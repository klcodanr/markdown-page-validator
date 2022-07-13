import { expect } from "chai";

import validate, { Validator } from "../src";
import { Check, Status } from "../src/check";
import { WriteGood } from "../src/checks/writegood";
import { Mode } from "../src/config";

describe("Produced Report", function () {
  describe("Simple Config", function () {
    it("Requires checks", async function () {
      let err;
      try {
        await validate({
          baseDirectory: "./test/resources/simple",
          mode: Mode.Matching,
          modeConfig: {},
          checks: [],
        });
      } catch (e) {
        err = e;
      }
      expect(err).to.not.be.null;
      expect("No checks specified").to.eq(err.message);
    });

    it("Can read non-markdown files", async function () {
      await validate({
        baseDirectory: "./test/resources/simple",
        mode: Mode.Matching,
        modeConfig: {
          pattern: ".*\\..*",
        },
        checks: [
          {
            name: "WriteGood",
          },
        ],
      });
    });

    it("Can run validator", async function () {
      const result = await validate({
        baseDirectory: "./test/resources/simple",
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "WriteGood",
          },
          {
            name: "RequiredProperties",
            settings: {
              properties: [
                "title",
                {
                  key: "layout",
                  allowedValues: ["default"],
                },
              ],
            },
          },
        ],
      });
      expect(Status.success).to.eq(result.status);
      expect(1).to.eq(result.results.length);
      expect(2).to.eq(result.results[0].checks.length);
    });
  });

  describe("Git Diff", function () {
    it("Can use changes", async function () {
      const result = await validate({
        baseDirectory: "./test/resources/simple",
        mode: Mode.Changed,
        modeConfig: {
          branch: "main",
        },
        checks: [
          {
            name: "WriteGood",
          },
        ],
      });
      expect(Status.success).to.eq(result.status);
    });
  });

  describe("Advanced Config", function () {
    it("Can construct", async function () {
      const validator = new Validator();
      const result = await validator.validate({
        baseDirectory: "./test/resources/simple",
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "WriteGood",
          },
          {
            name: "RequiredProperties",
            settings: {
              properties: [
                "title",
                {
                  key: "layout",
                  allowedValues: ["default"],
                },
              ],
            },
          },
        ],
      });
      expect(Status.success).to.eq(result.status);
      expect(1).to.eq(result.results.length);
      expect(2).to.eq(result.results[0].checks.length);
    });
    it("Can remove checks by name", async function () {
      const validator = new Validator();
      validator.removeCheck("WriteGood");
      let err = null;
      try {
        await validator.validate({
          baseDirectory: "./test/resources/simple",
          mode: Mode.Matching,
          modeConfig: {},
          checks: [
            {
              name: "WriteGood",
            },
          ],
        });
      } catch (e) {
        err = e;
      }
      expect(err.message).to.eq("Unsupported check: WriteGood requested");
    });
    it("Can remove checks", async function () {
      const validator = new Validator();
      validator.removeCheck(new WriteGood());
      let err = null;
      try {
        await validator.validate({
          baseDirectory: "./test/resources/simple",
          mode: Mode.Matching,
          modeConfig: {},
          checks: [
            {
              name: "WriteGood",
            },
          ],
        });
      } catch (e) {
        err = e;
      }
      expect(err.message).to.eq("Unsupported check: WriteGood requested");
    });

    it("Can traverse folders", async function () {
      const result = await validate({
        baseDirectory: "./test/resources/nested",
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "WriteGood",
          },
        ],
      });
      expect(Status.success).to.eq(result.status);
      expect(2).to.eq(result.results.length);
      expect(result.results[0].file).to.eq(
        "./test/resources/nested/folder1/file1.md"
      );
      expect(result.results[1].file).to.eq(
        "./test/resources/nested/folder2/file2.md"
      );
    });

    it("Can limit checks by include", async function () {
      const result = await validate({
        baseDirectory: "./test/resources/nested",
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "WriteGood",
          },
          {
            name: "RequiredProperties",
            includes: ".*/folder2/.*",
            settings: {
              properties: ["property"],
            },
          },
        ],
      });
      expect(Status.success).to.eq(result.status);
      expect(2).to.eq(result.results.length);
      expect(result.results[0].file).to.eq(
        "./test/resources/nested/folder1/file1.md"
      );
      expect(result.results[0].checks.length).to.eq(1);
      expect(result.results[1].file).to.eq(
        "./test/resources/nested/folder2/file2.md"
      );
      expect(result.results[1].checks.length).to.eq(2);
    });

    it("Can limit checks by exclude", async function () {
      const result = await validate({
        baseDirectory: "./test/resources/nested",
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "WriteGood",
          },
          {
            name: "RequiredProperties",
            excludes: ".*/folder1/.*",
            settings: {
              properties: ["property"],
            },
          },
        ],
      });
      expect(Status.success).to.eq(result.status);
      expect(2).to.eq(result.results.length);
      expect(result.results[0].file).to.eq(
        "./test/resources/nested/folder1/file1.md"
      );
      expect(result.results[0].checks.length).to.eq(1);
      expect(result.results[1].file).to.eq(
        "./test/resources/nested/folder2/file2.md"
      );
      expect(result.results[1].checks.length).to.eq(2);
    });

    it("Can handle failing check", async function () {
      const validator = new Validator();
      const faily: Check<any> = {
        name: "faily",
        check(_file, _settings, _log) {
          throw new Error("fail!");
        },
      };
      validator.addCheck(faily);
      const result = await validator.validate({
        baseDirectory: "./test/resources/simple",
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "faily",
          },
        ],
      });
      expect(result.status).to.eq(Status.failure);
      expect(result.results[0].checks[0].message).to.eq(
        "Failed to execute check [faily], message: fail!"
      );
    });
  });
});
