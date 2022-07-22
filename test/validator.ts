import { expect } from "chai";

import validate, { updateStatus, Validator } from "../src/validator";
import { Check, Status } from "../src/check";
import { WriteGood } from "../src/checks/writegood";
import { Mode } from "../src/config";

describe("Produced Report", function () {
  describe("Simple Config", function () {
    it("Requires checks", async function () {
      let err;
      try {
        await validate("./test/resources/simple", {
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

    it("Base directory must exist", async function () {
      let err;
      try {
        await validate("./test/resources/idontexist", {
          mode: Mode.Matching,
          modeConfig: {},
          checks: [],
        });
      } catch (e) {
        err = e;
      }
      expect(err).to.not.be.null;
      expect("Base directory ./test/resources/idontexist does not exist").to.eq(
        err.message
      );
    });

    it("Base directory must be folder", async function () {
      let err;
      try {
        await validate("./test/resources/simple/file.md", {
          mode: Mode.Matching,
          modeConfig: {},
          checks: [],
        });
      } catch (e) {
        err = e;
      }
      expect(err).to.not.be.null;
      expect(
        "Base directory ./test/resources/simple/file.md is not a directory"
      ).to.eq(err.message);
    });

    it("Can read non-markdown files", async function () {
      await validate("./test/resources/simple", {
        mode: Mode.Matching,
        modeConfig: {
          includes: ".*\\..*",
        },
        checks: [
          {
            name: "WriteGood",
          },
        ],
      });
    });

    it("Can run validator", async function () {
      const result = await validate("./test/resources/simple", {
        mode: Mode.Matching,
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
                  property: "layout",
                  allowedValues: ["default"],
                },
              ],
            },
          },
        ],
      });
      expect(result.status).to.eq(Status.success);
      expect(result.results.length).to.eq(1);
      expect(result.results[0].checks.length).to.eq(2);
    });
  });

  describe("Git Diff", function () {
    it("Can use changes", async function () {
      this.timeout(120000);
      const result = await validate("./test/resources/simple", {
        mode: Mode.Changed,
        modeConfig: {
          branch: "main",
          includes: ".*\\.md",
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
      const result = await validator.validate("./test/resources/simple", {
        mode: Mode.Matching,
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
                  property: "layout",
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
        await validator.validate("./test/resources/simple", {
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
        await validator.validate("./test/resources/simple", {
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
      const result = await validate("./test/resources/nested", {
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
      const result = await validate("./test/resources/nested", {
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
      const result = await validate("./test/resources/nested", {
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
        check(_file, _settings) {
          throw new Error("fail!");
        },
      };
      validator.addCheck(faily);
      const result = await validator.validate("./test/resources/simple", {
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

    it("Can read and validate date", async function () {
      const result = await validate("./test/resources/nested/folder1", {
        mode: Mode.Matching,
        modeConfig: {},
        checks: [
          {
            name: "DateRange",
            settings: {
              property: "date",
            },
          },
        ],
      });
      expect(result.status).to.eq(Status.error);
      expect(result.results[0].checks[0].message).to.eq(
        "Date 2020-05-05T00:00:00.000Z for date not range"
      );
    });
  });

  describe("Can Set Status", function () {
    [
      {
        parent: Status.success,
        child: Status.failure,
        expected: Status.failure,
      },
      {
        parent: Status.info,
        child: Status.failure,
        expected: Status.failure,
      },
      {
        parent: Status.warn,
        child: Status.failure,
        expected: Status.failure,
      },
      {
        parent: Status.error,
        child: Status.failure,
        expected: Status.failure,
      },
      {
        parent: Status.failure,
        child: Status.failure,
        expected: Status.failure,
      },

      {
        parent: Status.success,
        child: Status.error,
        expected: Status.error,
      },
      {
        parent: Status.info,
        child: Status.error,
        expected: Status.error,
      },
      {
        parent: Status.warn,
        child: Status.error,
        expected: Status.error,
      },
      {
        parent: Status.error,
        child: Status.error,
        expected: Status.error,
      },
      {
        parent: Status.failure,
        child: Status.error,
        expected: Status.failure,
      },

      {
        parent: Status.success,
        child: Status.warn,
        expected: Status.warn,
      },
      {
        parent: Status.info,
        child: Status.warn,
        expected: Status.warn,
      },
      {
        parent: Status.warn,
        child: Status.warn,
        expected: Status.warn,
      },
      {
        parent: Status.error,
        child: Status.warn,
        expected: Status.error,
      },
      {
        parent: Status.failure,
        child: Status.warn,
        expected: Status.failure,
      },
    ].forEach(function (testCase: {
      parent: Status;
      child: Status;
      expected: Status;
    }) {
      const parent = { status: testCase.parent };
      updateStatus(parent, { status: testCase.child });
      expect(testCase.expected).to.equal(parent.status);
    });
  });
});
