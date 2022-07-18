import { Logger } from "winston";
import spellcheck from "spellchecker";

import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../request";

export interface SpellingSettings {
  property: string;
  afterOffset?: number;
  beforeOffset?: number;
}

export class Spelling implements Check<SpellingSettings> {
  name = "DateRange";
  async check(
    file: MarkdownFile,
    settings: SpellingSettings,
    _log: Logger
  ): Promise<CheckResult> {
    spellcheck.checkSpelling("");
    return null;
  }
}
