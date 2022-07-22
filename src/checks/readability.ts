import readability from "text-readability";

import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../validator";

export interface ReadabilitySettings {
  warnLimit?: number;
  errorLimit?: number;
  includeDetail?: boolean;
}

export class Readability implements Check<ReadabilitySettings> {
  name = "Readability";
  async check(
    file: MarkdownFile,
    settings: ReadabilitySettings
  ): Promise<CheckResult> {
    const score = readability.textStandard(file.text, true) as number;

    let detail;
    if (settings.includeDetail) {
      detail = {
        fleschReadingEase: readability.fleschReadingEase(file.text),
        fleschKincaidGrade: readability.fleschKincaidGrade(file.text),
        colemanLiauIndex: readability.colemanLiauIndex(file.text),
        automatedReadabilityIndex: readability.automatedReadabilityIndex(
          file.text
        ),
        daleChallReadabilityScore: readability.daleChallReadabilityScore(
          file.text
        ),
        difficultWords: readability.difficultWords(file.text),
        linsearWriteFormula: readability.linsearWriteFormula(file.text),
        gunningFog: readability.gunningFog(file.text),
        textStandard: readability.textStandard(file.text),
        syllableCount: readability.syllableCount(file.text),
        wordCount: readability.lexiconCount(file.text, true),
        sentenceCount: readability.sentenceCount(file.text, true),
      };
    }

    let message = `Readbility score: ${score}`;
    let status = Status.success;
    if (score >= settings.errorLimit) {
      status = Status.error;
      message = `Readbility score: ${score} is higher than ${settings.errorLimit}`;
    } else if (score >= settings.warnLimit) {
      status = Status.warn;
      message = `Readbility score: ${score} is higher than ${settings.warnLimit}`;
    }
    return {
      status,
      message,
      check: this.name,
      detail,
    };
  }
}
