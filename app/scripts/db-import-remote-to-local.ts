import { execSync } from "child_process";
import { existsSync, rmSync, unlinkSync } from "fs";
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
    chalk.yellow("This will ") +
      chalk.red("DELETE") +
      chalk.yellow(" your local D1 state at ") +
      chalk.cyan(RELATIVE_WRANGLER_D1_PATH),
    chalk.yellow("and replace it with a fresh copy from the ") +
      chalk.cyan("REMOTE") +
      chalk.yellow(" database ") +
      chalk.bold.cyan(DATABASE_NAME) +
      chalk.yellow("."),
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

function deleteLocalDbFolder() {
  const spinner = ora("Removing existing local D1 state").start();
  try {
    if (existsSync(WRANGLER_D1_PATH)) {
      rmSync(WRANGLER_D1_PATH, { recursive: true, force: true });
    }
    spinner.succeed("Local D1 state cleared");
  } catch (error) {
    spinner.fail("Failed to remove local D1 state");
    throw error;
  }
}

function exportRemoteToDump() {
  const spinner = ora("Exporting remote database to dump").start();
  try {
    run(
      `${getWranglerCli()} d1 export ${DATABASE_NAME} --remote --output=./${DUMP_FILE}`
    );
    spinner.succeed("Remote export completed");
  } catch (error) {
    spinner.fail("Failed exporting remote database");
    throw error;
  }
}

function importDumpToLocal() {
  const spinner = ora("Importing dump into local database").start();
  try {
    run(
      `${getWranglerCli()} d1 execute ${DATABASE_NAME} --local --file=./${DUMP_FILE}`
    );
    spinner.succeed("Local import completed");
  } catch (error) {
    spinner.fail("Failed importing into local database");
    throw error;
  }
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
  deleteLocalDbFolder();
  exportRemoteToDump();
  importDumpToLocal();
  console.log(chalk.green("\nData import completed successfully."));
  cleanupDump();
}

main().catch((error) => {
  console.error(chalk.red("Operation failed."));
  console.error(error);
  process.exit(1);
});
