import { expect } from "chai";
import winston from "winston";
import { Status } from "../src/check";

import { WriteGood } from "../src/checks/writegood";

const log = winston.createLogger({
  level: "fatal",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

describe("WriteGood", function () {
  it("name correct", async function () {
    const writegood = new WriteGood();
    expect(writegood.name).to.equal("WriteGood");
  });

  it("basic check", async function () {
    const writegood = new WriteGood();
    const result = await writegood.check(
      {
        file: "test",
        properties: {},
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      {},
      log
    );
    expect(Status.info).to.equal(result.status);
  });

  it("can set warn limit", async function () {
    const writegood = new WriteGood();
    const result = await writegood.check(
      {
        file: "test",
        properties: {},
        markdown: "",
        text: "so I like to write code but maybe not",
        lines: ["so I like to write code but maybe not"],
      },
      { warnLimit: 1 },
      log
    );
    expect(result.status).to.equal(Status.warn);
    expect(result.detail[0]).to.equal(
      'Line 0: Position: 28:5 "maybe" can weaken meaning'
    );
  });
});
