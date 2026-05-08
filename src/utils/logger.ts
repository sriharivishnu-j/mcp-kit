import chalk from "chalk";
import boxen from "boxen";
import { table } from "table";

// Chalk-based colored logger
export const log = {
  info: (msg: string): void => console.log(`${chalk.cyan("ℹ")} ${msg}`),
  success: (msg: string): void => console.log(`${chalk.green("✅")} ${msg}`),
  warn: (msg: string): void => console.log(`${chalk.yellow("⚠️")} ${msg}`),
  error: (msg: string): void => console.error(`${chalk.red("❌")} ${msg}`),
  step: (msg: string): void => console.log(`${chalk.blue("→")} ${msg}`),
  header: (msg: string): void =>
    console.log(
      boxen(chalk.bold(msg), {
        padding: 1,
        borderColor: "cyan"
      })
    ),
  muted: (msg: string): void => console.log(chalk.gray(msg)),
  code: (msg: string): void => console.log(chalk.bgGray.white(` ${msg} `)),
  blank: (): void => console.log("")
};

// ASCII table renderer
export function printTable(headers: string[], rows: string[][]): void {
  if (rows.length === 0) {
    log.muted("(no entries)");
    return;
  }
  const data = [headers.map((h) => chalk.bold.cyan(h)), ...rows];
  console.log(table(data));
}
