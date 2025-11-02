import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import ora from "ora";
import chalk from "chalk";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DATABASE_NAME = "rental_monitor";
const DUMP_FILE = "db-dump.sql";
const RELATIVE_WRANGLER_D1_PATH = ".wrangler/state/v3/d1";
const WRANGLER_D1_PATH = join(process.cwd(), RELATIVE_WRANGLER_D1_PATH);

function getWranglerCli(): string {
  // https://github.com/cloudflare/workers-sdk/issues/8153
  if ("windir" in process.env) {
    return "npx wrangler@3.103.2";
  }
  return "bun wrangler";
}

function run(command: string) {
  execSync(command, { stdio: "inherit" });
}

function capture(command: string): string {
  return execSync(command, { encoding: "utf-8" }) as unknown as string;
}

async function confirmOrExit(force: boolean) {
  if (force) return;
  const rl = createInterface({ input, output });
  const question = [
    chalk.yellow("This will overwrite the ") +
      chalk.cyan("REMOTE") +
      chalk.yellow(" D1 database ") +
      chalk.bold.cyan(DATABASE_NAME),
    chalk.yellow("with the current contents of your ") +
      chalk.cyan("LOCAL") +
      chalk.yellow(" database at ") +
      chalk.cyan(WRANGLER_D1_PATH) +
      chalk.yellow("."),
    "",
    chalk.red.bold("Danger: ") +
      chalk.yellow("Production/remote data may be lost."),
    "",
    chalk.white("Continue? ") + chalk.gray("[y/N] "),
  ].join("\n");
  const answer = (await rl.question(question)).trim().toLowerCase();
  rl.close();
  if (answer !== "y" && answer !== "yes") {
    console.log(chalk.red("Aborted."));
    process.exit(1);
  }
}

function exportLocalToDump() {
  const spinner = ora("Exporting local database to dump").start();
  try {
    run(
      `${getWranglerCli()} d1 export ${DATABASE_NAME} --local --output=./${DUMP_FILE}`
    );
    spinner.succeed("Local export completed");
  } catch (error) {
    spinner.fail("Failed exporting local database");
    throw error;
  }
}

function importDumpToRemote(targetIdOrName: string) {
  const spinner = ora("Importing dump into remote database").start();
  try {
    run(
      `${getWranglerCli()} d1 execute ${targetIdOrName} --remote --file=./${DUMP_FILE}`
    );
    spinner.succeed("Remote import completed");
  } catch (error) {
    spinner.fail("Failed importing into remote database");
    throw error;
  }
}

function extractNameTypeRowsFromWranglerJson(
  output: string
): Array<{ name: string; type: "table" | "view" }> {
  try {
    const parsed = JSON.parse(output);
    const rows: Array<{ name: string; type: "table" | "view" }> = [];
    const seen = new Set<string>();
    const visit = (node: unknown) => {
      if (!node) return;
      if (Array.isArray(node)) {
        const arrayNode = node as unknown[];
        if (
          arrayNode.length > 0 &&
          arrayNode.every(
            (n) =>
              !!n &&
              typeof n === "object" &&
              "name" in (n as Record<string, unknown>) &&
              "type" in (n as Record<string, unknown>)
          )
        ) {
          for (const item of arrayNode as Array<Record<string, unknown>>) {
            const name = item.name;
            const type = item.type;
            if (
              typeof name === "string" &&
              (type === "table" || type === "view")
            ) {
              const key = `${type}|${name}`;
              if (!seen.has(key)) {
                rows.push({ name, type });
                seen.add(key);
              }
            }
          }
        }
        arrayNode.forEach(visit);
        return;
      }
      if (typeof node === "object") {
        Object.values(node as Record<string, unknown>).forEach(visit);
      }
    };
    visit(parsed);
    return rows;
  } catch {
    return [];
  }
}

function listRemoteDatabases(): Array<{ uuid: string; name: string }> {
  try {
    const out = capture(`${getWranglerCli()} d1 list --json`);
    const parsed = JSON.parse(out) as Array<{ uuid: string; name: string }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function deleteRemoteDatabase(idOrName: string) {
  const spinner = ora(`Deleting remote database (${idOrName})`).start();
  try {
    try {
      run(`${getWranglerCli()} d1 delete ${idOrName} -y`);
    } catch (e) {
      // Some wrangler versions use a different flag name
      run(`${getWranglerCli()} d1 delete ${idOrName} --skip-confirmation`);
    }
    spinner.succeed("Remote database deleted");
  } catch (error) {
    // If deletion fails because DB doesn't exist, continue
    spinner.warn("Remote database may not have existed; continuing");
  }
}

function createRemoteDatabase(name: string): { id: string } {
  const spinner = ora(`Creating remote database (${name})`).start();
  try {
    const out = capture(`${getWranglerCli()} d1 create ${name}`);
    let id = "";
    try {
      const listOut = capture(`${getWranglerCli()} d1 list --json`);
      const list = JSON.parse(listOut) as Array<{ uuid: string; name: string }>;
      const match = Array.isArray(list)
        ? list.find((d) => d.name === name)
        : undefined;
      if (match && match.uuid) id = match.uuid;
    } catch {
      const patterns = [
        /database_id\s*=\s*"?([a-f0-9-]{36})"?/i,
        /uuid\s*[:=]\s*"?([a-f0-9-]{36})"?/i,
        /id\s*[:=]\s*"?([a-f0-9-]{36})"?/i,
      ];
      for (const re of patterns) {
        const m = out.match(re);
        if (m && m[1]) {
          id = m[1];
          break;
        }
      }
    }
    if (!id)
      throw new Error("Could not parse database id from wrangler output");
    spinner.succeed("Remote database created");
    return { id };
  } catch (error) {
    spinner.fail("Failed creating remote database");
    throw error;
  }
}

function recreateRemoteDatabase(): { id: string } {
  // Attempt deletion by name; continue if it doesn't exist
  deleteRemoteDatabase(DATABASE_NAME);
  return createRemoteDatabase(DATABASE_NAME);
}

function cleanupDump() {
  const spinner = ora("Cleaning up dump file").start();
  try {
    if (existsSync(DUMP_FILE)) {
      unlinkSync(DUMP_FILE);
    }
    spinner.succeed("Cleanup complete");
  } catch (error) {
    spinner.fail("Failed cleaning up dump file");
    throw error;
  }
}

async function main() {
  const force = process.argv.includes("--yes") || process.argv.includes("-y");
  await confirmOrExit(force);
  exportLocalToDump();
  const { id: remoteId } = recreateRemoteDatabase();
  importDumpToRemote(DATABASE_NAME);
  console.log(
    chalk.green("\nData import to new remote database completed successfully.")
  );
  console.log(
    [
      chalk.yellow("New D1 database id:"),
      chalk.cyan(remoteId),
      "",
      chalk.yellow("Update these files to use the new id (database_id):"),
      chalk.cyan("- ./wrangler.jsonc"),
      chalk.cyan("- workers/cron-scraper/wrangler.jsonc"),
      chalk.cyan("- .env"),
    ].join("\n")
  );
  cleanupDump();
}

main().catch((error) => {
  console.error(chalk.red("Operation failed."));
  console.error(error);
  process.exit(1);
});
