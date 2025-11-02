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

// old JSON parsing helpers removed

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
  importDumpToRemote(DATABASE_NAME);
  console.log(chalk.green("\nData import to remote completed successfully."));
  cleanupDump();
}

main().catch((error) => {
  console.error(chalk.red("Operation failed."));
  console.error(error);
  process.exit(1);
});
