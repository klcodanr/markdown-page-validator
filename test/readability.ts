import { expect } from "chai";
import { readFileSync } from "fs";

import { Status } from "../src/check";
import { Readability } from "../src/checks/readability";

describe("Readability", function () {
  it("name correct", async function () {
    const readability = new Readability();
    expect(readability.name).to.equal("Readability");
  });

  it("can detect very complex", async function () {
    const readability = new Readability();
    const result = await readability.check(
      {
        file: "test",
        properties: { date: new Date() },
        markdown: "Hello World",
        text: `Playing games has always been thought to be important to 
        the development of well-balanced and creative children; 
        however, what part, if any, they should play in the lives 
        of adults has never been researched that deeply. I believe 
        that playing games is every bit as important for adults 
        as for children. Not only is taking time out to play games 
        with our children and other adults valuable to building 
        interpersonal relationships but is also a wonderful way 
        to release built up tension.`,
        lines: [],
      },
      { errorLimit: 14, warnLimit: 9 }
    );
    expect(result.status).to.equal(Status.error);
  });
  it("can detect simple", async function () {
    const readability = new Readability();
    const result = await readability.check(
      {
        file: "test",
        properties: { date: new Date() },
        markdown: "Hello World",
        text: readFileSync("test/resources/simple.txt", "utf8"),
        lines: [],
      },
      { errorLimit: 14, warnLimit: 9 }
    );
    expect(result.status).to.equal(Status.success);
  });
  it("can detect medium", async function () {
    const readability = new Readability();
    const result = await readability.check(
      {
        file: "test",
        properties: { date: new Date() },
        markdown: "Hello World",
        text: readFileSync("test/resources/simple.txt", "utf8"),
        lines: [],
      },
      { errorLimit: 14, warnLimit: 6 }
    );
    expect(result.status).to.equal(Status.warn);
  });
});
