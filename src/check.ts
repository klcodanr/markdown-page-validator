import { Logger } from "winston";
import { MarkdownFile } from "./request";

export enum Status {
  failure = "Failure",
  error = "Error",
  warn = "Warn",
  info = "Info",
  success = "Success",
}

export interface CheckResult {
  status: Status;
  check: string;
  file: string;
  message: string;
  detail?: any;
}

export interface Check<C extends any> {
  name: string;
  check(file: MarkdownFile, settings: C, log: Logger): Promise<CheckResult>;
}
