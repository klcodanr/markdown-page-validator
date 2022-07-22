import assert from "assert";
import { existsSync, readFileSync, statSync } from "fs";
import yaml from "js-yaml";
import markdownToTxt from "markdown-to-txt";

const SEP = /(\s*?\-+\s*\n)/g;

/**
 * Represents a parsed markdown file
 */
export interface MarkdownFile {
  /**
   *
   */
  file: string;
  lines: Array<string>;
  markdown: string;
  properties: Object;
  text: string;
}

/**
 * Parses the markdown file at the specified path
 * @param filename the file path to read
 * @returns the file with the YAML header (if present) available as the variable properties and the body in the text, markdown and lines variables
 */
export function parseMarkdownFile(filename: string): MarkdownFile {
  assert.ok(existsSync(filename), `No file found at: ${filename}`);
  assert.ok(statSync(filename).isFile(), `Not a file: ${filename}`);

  const content = readFileSync(filename)
    .toString()
    .replace(/^---\s*[\r\n]+/, "");
  const pos = content.search(SEP);
  if (pos !== -1) {
    const matches = content.match(SEP);
    const header = content.substring(0, pos);
    const markdown = content.substring(pos + matches[0].length);
    const properties = yaml.load(header);

    const text = markdownToTxt(markdown);
    const lines = text.split(/[\r\n]+/);
    return { properties, markdown, file: filename, text, lines };
  } else {
    const text = markdownToTxt(content);
    const lines = text.split(/[\r\n]+/);
    return { properties: {}, markdown: content, file: filename, text, lines };
  }
}
