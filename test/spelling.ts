import { expect } from "chai";
import winston from "winston";
import { Status } from "../src/check";

import { Spelling } from "../src/checks/spelling";

const log = winston.createLogger({
  level: "fatal",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

describe("Spelling", function () {
  it("name correct", async function () {
    const spelling = new Spelling();
    expect(spelling.name).to.equal("Spelling");
  });

  it("basic check", async function () {
    const spelling = new Spelling();
    const result = await spelling.check(
      {
        file: "test",
        properties: {},
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      {}
    );
    expect(result.status).to.equal(Status.success);
  });

  it("can set warn limit", async function () {
    const spelling = new Spelling();
    const result = await spelling.check(
      {
        file: "test",
        properties: {},
        markdown: "",
        text: "",
        lines: ["Speeling is grate!"],
      },
      { warnLimit: 1 }
    );
    expect(result.status).to.equal(Status.warn);
    expect(result.detail[0]).to.equal(
      "Line 0: Position: 0:8 Speeling is misspelled"
    );
  });

  it("can set error limit", async function () {
    const spelling = new Spelling();
    const result = await spelling.check(
      {
        file: "test",
        properties: {},
        markdown: "",
        text: "",
        lines: ["Speeling is grate!"],
      },
      { errorLimit: 1 }
    );
    expect(result.status).to.equal(Status.error);
    expect(result.detail[0]).to.equal(
      "Line 0: Position: 0:8 Speeling is misspelled"
    );
  });

  it("can add custom words", async function () {
    const spelling = new Spelling();
    const result = await spelling.check(
      {
        file: "test",
        properties: {},
        markdown: "",
        text: "",
        lines: ["Speling is grate!"],
      },
      { warnLimit: 1, customWords: ["Speling"] }
    );
    expect(result.status).to.equal(Status.success);
  });
});
