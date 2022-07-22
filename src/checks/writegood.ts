import writeGood from "write-good";

import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../validator";

interface WriteGoodResult {
  index: number;
  offset: number;
  reason: string;
}

export interface WriteGoodSettings {
  warnLimit?: number;
  options?: any;
}

export class WriteGood implements Check<WriteGoodSettings> {
  name = "WriteGood";
  async check(
    file: MarkdownFile,
    settings: WriteGoodSettings
  ): Promise<CheckResult> {
    const warnLimit = settings.warnLimit || 5;
    const suggestions = new Array<string>();

    file.lines.forEach((line, idx) => {
      (writeGood(line, settings.options) as Array<WriteGoodResult>).forEach(
        (s) =>
          suggestions.push(
            `Line ${idx}: Position: ${s.index}:${s.offset} ${s.reason}`
          )
      );
    });

    const result = {
      status: Status.info,
      message: `Found ${suggestions.length} suggestions`,
      detail: suggestions,
      check: this.name,
    };
    if (suggestions.length >= warnLimit) {
      result.status = Status.warn;
    }

    return result;
  }
}
