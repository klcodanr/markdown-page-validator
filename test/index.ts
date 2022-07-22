import { expect } from "chai";
import { execSync } from "child_process";

describe("CLI", function () {
  this.timeout(120000);
  it("can call cli", function () {
    const resp = execSync("/usr/bin/env node . --help").toString();
    expect(resp).to.not.be.null;
    expect(resp.indexOf("Commands:") !== -1).to.be.true;
    expect(resp.indexOf("validate") !== -1).to.be.true;
    expect(resp.indexOf("parse") !== -1).to.be.true;
    expect(resp.indexOf("Options:") !== -1).to.be.true;
    expect(resp.indexOf("--help") !== -1).to.be.true;
    expect(resp.indexOf("--version") !== -1).to.be.true;
  });

  it("can validate files", function () {
    const resp = execSync(
      "/usr/bin/env node . validate --config test/resources/config.json --path test/resources/simple"
    ).toString();
    expect(resp).to.not.be.null;
    expect(JSON.stringify(JSON.parse(resp))).equal(
      JSON.stringify({
        status: "Success",
        results: [
          {
            status: "Success",
            checks: [
              {
                status: "Info",
                message: "Found 0 suggestions",
                detail: [],
                check: "WriteGood",
              },
            ],
            file: "test/resources/simple/file.md",
          }
        ],
        summary: { fileCount: 1, failures: 0, errors: 0, warnings: 0 },
      })
    );
  });

  it("Fails on invalid base path", function () {
    let err = null;
    try {
      execSync(
        "/usr/bin/env node . validate --config test/resources/config.json  --path test/resources/notafolder"
      ).toString();
    } catch (e) {
      err = e;
    }
    expect(err).to.not.be.null;
    expect(err.message.indexOf("Command failed:")).to.not.equal(-1);
  });

  it("can parse file", function () {
    const resp = execSync(
      "/usr/bin/env node . parse --file test/resources/simple/file.md"
    ).toString();
    expect(resp).to.not.be.null;

    expect(JSON.stringify(JSON.parse(resp))).equal(
      JSON.stringify({
        properties: { title: "Test", layout: "default" },
        markdown: "Some markdown content [here](https://www.danklco.com)\n",
        file: "test/resources/simple/file.md",
        text: "Some markdown content here",
        lines: ["Some markdown content here"],
      })
    );
  });
});
