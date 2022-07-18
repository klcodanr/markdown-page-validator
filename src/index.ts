#!/usr/bin/env node
import yargs, { Argv } from "yargs";
import { readFileSync } from "fs";

import { readMarkdownFile, Validator } from "./validator";
import { ValidationConfig } from "./config";
import winston, { Logger } from "winston";
import { Status } from "./check";

function getLog(args: any): Logger {
  const level = args.verbose ? "debug" : "warn";
  return winston.createLogger({
    level,
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
  });
}

let argv = yargs
  .command(
    "validate",
    "Validates the requested files",
    () => {
      return yargs
        .option("config", {
          describe: "the configuration file path",
          demandOption: true,
          type: "string",
        })
        .option("verbose", {
          alias: "v",
          default: false,
        });
    },
    async function (args) {
      const log = getLog(args);
      try {
        log.info(`Reading configuration from: ${args.config}`);
        const config = JSON.parse(
          readFileSync(args.config, "utf-8")
        ) as ValidationConfig;
        const validator = new Validator();
        validator.setLogger(log);
        const result = await validator.validate(config);
        console.log(JSON.stringify(result, null, 2));
        if (
          result.status === Status.error ||
          result.status === Status.failure
        ) {
          process.exit(1);
        }
      } catch (e) {
        log.error(`Failed to run validation`, e);
        process.exit(1);
      }
    }
  )
  .command(
    "parse",
    "Parses the requested markdown file",
    () => {
      return yargs
        .option("file", {
          describe: "the file to parse",
          demandOption: true,
          type: "string",
        })
        .option("verbose", {
          alias: "v",
          default: false,
        });
    },
    async function (args) {
      const log = getLog(args);
      log.info(`Parsing file: ${args.file}`);
      const read = await readMarkdownFile(args.file);
      console.log(JSON.stringify(read, null, 2));
    }
  ).argv;
