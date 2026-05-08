import chalk from "chalk";
import ora, { Ora } from "ora";

export type Spinner = Ora;

export function startSpinner(text: string): Spinner {
  return ora({ text: chalk.cyan(text), color: "cyan" }).start();
}

export function succeedSpinner(spinner: Spinner, text: string): void {
  spinner.succeed(chalk.cyan(text));
}

export function failSpinner(spinner: Spinner, text: string): void {
  spinner.fail(chalk.cyan(text));
}

export function updateSpinner(spinner: Spinner, text: string): void {
  spinner.text = chalk.cyan(text);
}
