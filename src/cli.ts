import { format } from "@fast-csv/format";
import { readFileSync } from "fs";
import { stringify } from "yaml";
import yargs from "yargs";

import winston, { Logger } from "winston";
import { Status } from "./check";
import { ValidationConfig } from "./config";
import { readMarkdownFile, Validator } from "./validator";

function getLog(args: any): Logger {
  const level = args.verbose ? "debug" : "error";
  return winston.createLogger({
    level,
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
  });
}

function writeCsv(data: Array<Object>) {
  const csvStream = format({ headers: true });
  csvStream.pipe(process.stdout);
  data.forEach((i) => csvStream.write(i));
  csvStream.end();
}

export function runCli() {
  let argv = yargs
    .command(
      "validate",
      "Validates the requested files",
      () => {
        return yargs
          .option("path", {
            describe: "the root path under which to scan for files",
            demandOption: false,
            type: "string",
          })
          .option("config", {
            describe: "the configuration file path",
            demandOption: true,
            type: "string",
          })
          .option("format", {
            describe: "the output format",
            choices: ["json", "yaml", "csv"],
            default: "json",
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
          const result = await validator.validate(
            args.path || process.cwd(),
            config
          );
          if (args.format === "yaml") {
            process.stdout.write(stringify(result));
          } else if (args.format === "csv") {
            const data = new Array<Object>();
            result.results.forEach((fr) => {
              fr.checks.forEach((cr) => {
                let detail: string;
                if (cr.detail && cr.detail instanceof Array) {
                  detail = cr.detail.join("\n");
                } else {
                  detail = stringify(cr.detail);
                }
                data.push({
                  ...cr,
                  file: fr.file,
                  detail,
                });
              });
            });
            writeCsv(data);
          } else {
            process.stdout.write(JSON.stringify(result, null, 2));
          }
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
          .option("format", {
            describe: "the output format",
            choices: ["json", "yaml", "csv"],
            default: "json",
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
        if (args.format === "yaml") {
          process.stdout.write(stringify(read));
        } else if (args.format === "csv") {
          writeCsv([read]);
        } else {
          process.stdout.write(JSON.stringify(read, null, 2));
        }
      }
    ).argv;
}
