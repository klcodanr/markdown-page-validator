#!/usr/bin/env node
import { Check, CheckResult, Status } from "./check";
import { runCli } from "./cli";
import { ValidationConfig } from "./config";
import validate, {
  FileResult,
  MarkdownFile,
  readMarkdownFile,
  Result,
  ValidationResult,
  Validator,
} from "./validator";

runCli();

export {
  readMarkdownFile as parseMarkdownFile,
  validate as default,
  validate,
  Check,
  CheckResult,
  FileResult,
  MarkdownFile,
  Result,
  Status,
  ValidationConfig,
  ValidationResult,
  Validator,
};
