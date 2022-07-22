import spellcheck from "spellchecker";

import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../markdownfile";

export interface SpellingSettings {
  customWords?: Array<string>;
  warnLimit?: number;
  errorLimit?: number;
}

export class Spelling implements Check<SpellingSettings> {
  name = "Spelling";
  async check(
    file: MarkdownFile,
    settings: SpellingSettings
  ): Promise<CheckResult> {
    if (settings.customWords) {
      settings.customWords.forEach((cw) => spellcheck.add(cw));
    }

    const corrections = new Array<string>();
    file.lines.forEach((line, idx) => {
      spellcheck
        .checkSpelling(line)
        .forEach((s) =>
          corrections.push(
            `Line ${idx}: Position: ${s.start}:${s.end} ${line.slice(
              s.start,
              s.end
            )} is misspelled`
          )
        );
    });

    let message = `Misspelled words found: ${corrections.length}`;
    let status = Status.success;
    if (corrections.length >= (settings.errorLimit || Number.MAX_VALUE)) {
      status = Status.error;
      message = `Misspelled word count ${corrections.length} is higher than ${settings.errorLimit}`;
    } else if (corrections.length >= (settings.warnLimit || Number.MAX_VALUE)) {
      status = Status.warn;
      message = `Misspelled word count ${corrections.length} is higher than ${settings.warnLimit}`;
    }

    return {
      status,
      message,
      check: this.name,
      detail: corrections,
    };
  }
}
