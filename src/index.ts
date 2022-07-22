#!/usr/bin/env node
import { Check, CheckResult, Status } from "./check";
import { runCli } from "./cli";
import { ValidationConfig } from "./config";
import validate, {
  FileResult,
  Result,
  ValidationResult,
  Validator,
} from "./validator";

import { MarkdownFile, parseMarkdownFile } from "./markdownfile";

runCli();

export {
  parseMarkdownFile,
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
