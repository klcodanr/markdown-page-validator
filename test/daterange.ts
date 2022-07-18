import { expect } from "chai";
import winston from "winston";
import { Status } from "../src/check";

import { DateRange } from "../src/checks/daterange";

const log = winston.createLogger({
  level: "fatal",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

describe("DateRange", function () {
  it("name correct", async function () {
    const daterange = new DateRange();
    expect(daterange.name).to.equal("DateRange");
  });

  it("basic check", async function () {
    const daterange = new DateRange();
    const result = await daterange.check(
      {
        file: "test",
        properties: { date: new Date() },
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { property: "date", afterOffset: 1000, beforeOffset: 1000 },
      log
    );
    expect(Status.success).to.equal(result.status);
  });

  it("detects dates newer than expected range", async function () {
    const daterange = new DateRange();
    const date = new Date(Date.now() + 2000);
    const result = await daterange.check(
      {
        file: "test",
        properties: { date },
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { property: "date", afterOffset: 1000 },
      log
    );
    expect(Status.error).to.equal(result.status);
  });

  it("detects dates older than expected range", async function () {
    const daterange = new DateRange();
    const date = new Date(Date.now() - 2000);
    const result = await daterange.check(
      {
        file: "test",
        properties: { date },
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { property: "date", beforeOffset: 1000 },
      log
    );
    expect(Status.error).to.equal(result.status);
  });

  it("handles missing date", async function () {
    const daterange = new DateRange();
    const result = await daterange.check(
      {
        file: "test",
        properties: {},
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { property: "date", afterOffset: 1000 },
      log
    );
    expect(Status.error).to.equal(result.status);
  });
});
