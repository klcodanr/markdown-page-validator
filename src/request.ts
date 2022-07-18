import { Logger } from "winston";

export class ValidationRequest {
  files: Array<MarkdownFile>;
  log: Logger;

  constructor(log: Logger) {
    this.log = log;
    this.files = new Array<MarkdownFile>();
  }
}

export interface MarkdownFile {
  file: string;
  lines: Array<string>;
  markdown: string;
  properties: Object;
  text: string;
}
