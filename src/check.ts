import { MarkdownFile } from "./validator";

/**
 * The possible status from a check
 */
export enum Status {
  failure = "Failure",
  error = "Error",
  warn = "Warn",
  info = "Info",
  success = "Success",
}

/**
 * The result of a single check
 */
export interface CheckResult {
  /**
   * the status of the check
   */
  status: Status;

  /**
   * The name of the check
   */
  check: string;

  /**
   * A message provided by the check
   */
  message: string;

  /**
   * Detailed information provided by the check
   */
  detail?: any;
}

/**
 * Interface for checks to extend. Each check should be executed against a
 * single file, returning a promise with .
 */
export interface Check<C extends any> {
  /**
   * The name of the check
   */
  name: string;

  /**
   * Execute the check
   *
   * @param markdownFile the file being checked
   * @param settings the settings for this check
   */
  check(markdownFile: MarkdownFile, settings: C): Promise<CheckResult>;
}
