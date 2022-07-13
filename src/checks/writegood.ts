import { Logger } from "winston";
import writeGood from "write-good";

import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../request";

export interface WriteGoodSettings {
  warnLimit?: number;
  options?: any;
}

export class WriteGood implements Check<WriteGoodSettings> {
  name = "WriteGood";
  async check(
    file: MarkdownFile,
    settings: WriteGoodSettings,
    log: Logger
  ): Promise<CheckResult> {
    const warnLimit = settings.warnLimit || 5;
    const suggestions = writeGood(file.text, settings.options) as Array<any>;

    log.debug(`Found ${suggestions.length} suggestions`);

    const result = {
      status: Status.info,
      message: `Found ${suggestions.length} suggestions`,
      detail: suggestions,
      file: file.file,
      check: this.name,
    };
    if (suggestions.length > warnLimit) {
      result.status = Status.warn;
    }

    return result;
  }
}
