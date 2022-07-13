import assert from "assert";
import { existsSync, readdirSync, statSync } from "fs";
import { markdownToTxt } from "markdown-to-txt";
import { simpleGit } from "simple-git";
import winston, { Logger } from "winston";
import yamlhead from "yamlhead";
import { Check, CheckResult, Status } from "./check";
import { RequiredProperties } from "./checks/requiredproperties";
import { WriteGood } from "./checks/writegood";

import {
  ChangedModeConfig,
  CheckConfig,
  Mode,
  ValidationConfig,
} from "./config";
import { MarkdownFile } from "./request";

function accumulateFiles(baseDir: string, files: Array<string>) {
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

function parseMarkdownFile(
  file: string
): Promise<{ properties: any; markdown: string }> {
  return new Promise(function (resolve, reject) {
    yamlhead(file, function (err: any, properties: any, markdown: string) {
      if (err) {
        reject(err);
      } else {
        if (!properties) {
          properties = {};
        }
        resolve({ properties, markdown });
      }
    });
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

function isIncluded(file: MarkdownFile, checkConfig: CheckConfig): boolean {
  if (
    checkConfig.includes &&
    !new RegExp(checkConfig.includes).test(file.file)
  ) {
    return false;
  }
  if (
    checkConfig.excludes &&
    new RegExp(checkConfig.excludes).test(file.file)
  ) {
    return false;
  }
  return true;
}

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

export async function readMarkdownFile(file: string): Promise<MarkdownFile> {
  const { properties, markdown } = await parseMarkdownFile(file);
  const text = markdownToTxt(markdown);
  return { properties, markdown, file, text };
}

export interface Result {
  status: Status;
}

export interface ValidationResult extends Result {
  results: Array<FileResult>;
}

export interface FileResult extends Result {
  file: string;
  status: Status;
  checks: Array<CheckResult>;
}

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
    this.addCheck(new WriteGood());
    this.addCheck(new RequiredProperties());
  }

  addCheck(check: Check<any>) {
    this.checks.set(check.name, check);
  }

  removeCheck(check: string | Check<any>) {
    if (typeof check === "string") {
      this.checks.delete(check);
    } else {
      this.checks.delete(check.name);
    }
  }

  setLogger(log: Logger) {
    this.log = log;
  }

  async validate(config: ValidationConfig): Promise<ValidationResult> {
    let files = new Array<string>();
    const baseDirectory = config.baseDirectory || process.cwd();

    // first validate the configuration
    assert(
      existsSync(baseDirectory),
      `Base directory ${baseDirectory} does not exist`
    );
    assert(
      statSync(baseDirectory).isDirectory(),
      `Base directory ${baseDirectory} is not a directory`
    );
    assert(config.checks.length > 0, "No checks specified");
    for (const check of config.checks) {
      assert(
        this.checks.has(check.name),
        `Unsupported check: ${check.name} requested`
      );
    }

    // next determine the set of files to evaluate
    const pattern = new RegExp(config.modeConfig.pattern || ".*.md");
    if (config.mode === Mode.Matching) {
      accumulateFiles(baseDirectory, files);
      files = files.filter((file) => pattern.test(file));
    } else {
      const modeConfig = config.modeConfig as ChangedModeConfig;
      files = (await getChanges(modeConfig, baseDirectory)).files
        .map((f) => f.file)
        .filter((file) => pattern.test(file));
    }

    // next read the files
    const toValidate = new Array<MarkdownFile>();
    this.log.debug(`Reading ${files.length} files`);
    for (const file of files) {
      this.log.debug(`Reading file: ${file}`);
      toValidate.push(await readMarkdownFile(file));
    }

    // finally run the checks
    const validationResult = {
      status: Status.success,
      results: new Array<FileResult>(),
    };
    for (const file of toValidate) {
      this.log.info(`Validating: ${file.file}`);

      const fileResult = {
        status: Status.success,
        checks: new Array<CheckResult>(),
        file: file.file,
      };
      for (const checkConfig of config.checks) {
        if (isIncluded(file, checkConfig)) {
          const checkResult = await this.runCheck(checkConfig, file);
          fileResult.checks.push(checkResult);
          updateStatus(fileResult, checkResult);
        } else {
          this.log.info(`Skipping check: ${checkConfig.name}`);
        }
      }
      updateStatus(validationResult, fileResult);
      validationResult.results.push(fileResult);
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
        .check(file, checkConfig.settings || {}, this.log);
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
        file: file.file,
        detail: e,
      };
    }

    return result;
  }
}

export default async function validate(
  config: ValidationConfig
): Promise<ValidationResult> {
  return new Validator().validate(config);
}
