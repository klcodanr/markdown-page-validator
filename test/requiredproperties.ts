import { expect } from "chai";
import { Status } from "../src/check";
import { RequiredProperties } from "../src/checks/requiredproperties";

describe("RequiredProperties", function () {
  it("name correct", async function () {
    const check = new RequiredProperties();
    expect(check.name).to.equal("RequiredProperties");
  });

  it("basic check", async function () {
    const requiredproperties = new RequiredProperties();
    const result = await requiredproperties.check(
      {
        file: "test",
        properties: { title: "test" },
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { properties: ["title"] }
    );
    expect(result.status).to.equal(Status.success);
  });

  it("can set level", async function () {
    const requiredproperties = new RequiredProperties();
    const result = await requiredproperties.check(
      {
        file: "test",
        properties: {},
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { properties: [{ property: "test", invalidStatus: Status.warn }] }
    );
    expect(result.status).to.equal(Status.warn);
  });

  it("can check for invalid properties", async function () {
    const requiredproperties = new RequiredProperties();
    let result = await requiredproperties.check(
      {
        file: "test",
        properties: {
          test: "something",
        },
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { properties: [{ property: "test", allowedValues: ["value", 1] }] }
    );
    expect(result.status).to.equal(Status.error);

    result = await requiredproperties.check(
      {
        file: "test",
        properties: {
          test: "value",
        },
        markdown: "Hello World",
        text: "Hello World",
        lines: ["Hello World"],
      },
      { properties: [{ property: "test", allowedValues: ["value", 1] }] }
    );
    expect(result.status).to.equal(Status.success);
  });
});
