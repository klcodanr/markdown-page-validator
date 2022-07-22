import assert from "assert";
import { existsSync, readdirSync, statSync } from "fs";
import { simpleGit } from "simple-git";
import winston, { Logger } from "winston";
import { Check, CheckResult, Status } from "./check";
import { DateRange } from "./checks/daterange";
import { Readability } from "./checks/readability";
import { RequiredProperties } from "./checks/requiredproperties";
import { Spelling } from "./checks/spelling";
import { WriteGood } from "./checks/writegood";

import {
  ChangedModeConfig,
  CheckConfig,
  Mode,
  ValidationConfig,
} from "./config";
import { MarkdownFile, parseMarkdownFile } from "./markdownfile";

function accumulateFiles(baseDir: string, files: Array<string>) {
  if (statSync(baseDir).isFile()) {
    files.push(baseDir);
    return;
  }
  const directoryFiles = readdirSync(baseDir);
  directoryFiles.forEach(function (file) {
    const path = `${baseDir}/${file}`;
    if (statSync(path).isDirectory()) {
      accumulateFiles(path, files);
    } else {
      files.push(path);
    }
  });
}

async function getChanges(config: ChangedModeConfig, baseDir: string) {
  const options = {
    baseDir,
    binary: "git",
    maxConcurrentProcesses: 1,
  };
  const branch = config.branch || "main";
  const git = simpleGit(options);
  await git.fetch(config.remote || "origin", branch);
  return git.diffSummary([branch]);
}

function isIncluded(
  file: string,
  config: {
    includes?: string;
    excludes?: string;
  }
): boolean {
  if (config.includes && !new RegExp(config.includes).test(file)) {
    return false;
  }
  if (config.excludes && new RegExp(config.excludes).test(file)) {
    return false;
  }
  return true;
}

/**
 * Updates the status of the parent result if the child result is of a higher severity.
 * @param parentResult the parent result to update
 * @param childResult the child result
 */
export function updateStatus(parentResult: Result, childResult: Result) {
  if (childResult.status === Status.failure) {
    parentResult.status = Status.failure;
  } else if (
    childResult.status === Status.error &&
    parentResult.status !== Status.failure
  ) {
    parentResult.status = Status.error;
  } else if (
    childResult.status === Status.warn &&
    parentResult.status !== Status.error &&
    parentResult.status !== Status.failure
  ) {
    parentResult.status = Status.warn;
  }
}

/**
 * Base type for a result
 */
export interface Result {
  /**
   * The status of the result
   */
  status: Status;
}

/**
 * Validation result
 */
export interface ValidationResult extends Result {
  /**
   * The results of the validation as an array of file results in order validated
   */
  results: Array<FileResult>;
  summary: {
    fileCount: number;
    failures: number;
    errors: number;
    warnings: number;
  };
}

/**
 * Representation of the result of the checks run against a single file
 */
export interface FileResult extends Result {
  /**
   * The subpath of the file validated
   */
  file: string;
  /**
   * The result of the checks
   */
  checks: Array<CheckResult>;
}

/**
 * Validates markdown files using checks
 */
export class Validator {
  private checks: Map<string, Check<any>>;
  private log: Logger;

  constructor() {
    this.log = winston.createLogger({
      level: "warn",
      format: winston.format.simple(),
      transports: [new winston.transports.Console()],
    });
    this.checks = new Map<string, Check<any>>();
    this.addCheck(new DateRange());
    this.addCheck(new Readability());
    this.addCheck(new RequiredProperties());
    this.addCheck(new Spelling());
    this.addCheck(new WriteGood());
  }

  /**
   * Adds a new check as available to the validator instance
   *
   * @param check the check to add
   */
  addCheck(check: Check<any>) {
    this.checks.set(check.name, check);
  }

  /**
   * Removes a check as available to the validator instance
   *
   * @param check the check (or name of the check) to remove
   */
  removeCheck(check: string | Check<any>) {
    if (typeof check === "string") {
      this.checks.delete(check);
    } else {
      this.checks.delete(check.name);
    }
  }

  /**
   * Sets the logger for this validator instance
   *
   * @param log the logger to set
   */
  setLogger(log: Logger) {
    this.log = log;
  }

  /**
   *
   * @param base the path to the base directory to find the files (or a file)
   * @param config the configuration for this validation
   * @returns
   */
  async validate(
    base: string,
    config: ValidationConfig
  ): Promise<ValidationResult> {
    let files = new Array<string>();

    // first validate the configuration
    assert(existsSync(base), `Base ${base} does not exist`);
    assert(config.checks.length > 0, "No checks specified");
    for (const check of config.checks) {
      assert(
        this.checks.has(check.name),
        `Unsupported check: ${check.name} requested`
      );
    }

    // next determine the set of files to evaluate
    const pattern = config.modeConfig || {
      includes: ".*.md",
    };
    if (config.mode !== Mode.Changed) {
      accumulateFiles(base, files);
      files = files.filter((file) => isIncluded(file, pattern));
    } else {
      const modeConfig = config.modeConfig as ChangedModeConfig;
      files = (await getChanges(modeConfig, base)).files
        .map((f) => f.file)
        .filter((file) => existsSync(file) && isIncluded(file, pattern));
    }

    // next read the files
    const validationResult = {
      status: Status.success,
      results: new Array<FileResult>(),
      summary: {
        fileCount: 0,
        failures: 0,
        errors: 0,
        warnings: 0,
      },
    };
    validationResult.summary.fileCount = files.length;
    this.log.debug(`Reading ${files.length} files`);
    for (const file of files) {
      this.log.debug(`Reading file: ${file}`);
      try {
        const markdownFile = parseMarkdownFile(file);

        this.log.info(`Validating: ${markdownFile.file}`);

        const fileResult = {
          status: Status.success,
          checks: new Array<CheckResult>(),
          file: markdownFile.file,
        };
        for (const checkConfig of config.checks) {
          if (isIncluded(markdownFile.file, checkConfig)) {
            const checkResult = await this.runCheck(checkConfig, markdownFile);
            fileResult.checks.push(checkResult);
            updateStatus(fileResult, checkResult);
          } else {
            this.log.info(`Skipping check: ${checkConfig.name}`);
          }
        }
        fileResult.checks.forEach((ch) => {
          if (ch.status === Status.failure) {
            validationResult.summary.failures++;
          } else if (ch.status === Status.error) {
            validationResult.summary.errors++;
          } else if (ch.status === Status.warn) {
            validationResult.summary.warnings++;
          }
        });
        updateStatus(validationResult, fileResult);
        validationResult.results.push(fileResult);
      } catch (e) {
        validationResult.results.push({
          file,
          checks: [
            {
              status: Status.warn,
              check: "validator.ReadFile",
              message: `Failed to read file: ${file}, Cause: ${e.toString()}`,
            },
          ],
          status: Status.warn,
        });
        validationResult.summary.warnings++;
      }
    }

    return validationResult;
  }

  private async runCheck(
    checkConfig: CheckConfig,
    file: MarkdownFile
  ): Promise<CheckResult> {
    this.log.info(`Running check: ${checkConfig.name}`);
    let result: CheckResult;
    try {
      result = await this.checks
        .get(checkConfig.name)
        .check(file, checkConfig.settings || {});
      this.log.info(`Check result: ${result.status}: ${result.message}`);
    } catch (e) {
      this.log.warn(
        `Failed to execute check [${checkConfig.name}], message: ${e.message}`,
        e
      );
      result = {
        status: Status.failure,
        message: `Failed to execute check [${checkConfig.name}], message: ${e.message}`,
        check: checkConfig.name,
        detail: e,
      };
    }

    return result;
  }
}

export default async function validate(
  baseDirectory: string,
  config: ValidationConfig
): Promise<ValidationResult> {
  return new Validator().validate(baseDirectory, config);
}
