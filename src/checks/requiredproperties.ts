import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../markdownfile";
import { Result, updateStatus } from "../validator";

export interface RequiredPropertiesSettings {
  properties: Array<RequiredProperty | string>;
}

export interface RequiredProperty {
  property: string;
  allowedValues?: Array<any>;
  invalidStatus?: Status;
}

export interface Summary extends Result {
  properties: Array<PropertyResult>;
}

export interface PropertyResult extends Result {
  message: string;
}

export class RequiredProperties implements Check<RequiredPropertiesSettings> {
  name = "RequiredProperties";
  async check(
    file: MarkdownFile,
    settings: RequiredPropertiesSettings
  ): Promise<CheckResult> {
    const summary: Summary = {
      properties: new Array<PropertyResult>(),
      status: Status.success,
    };
    for (const property of settings.properties) {
      const result = this.runCheck(file.properties, property);
      summary.properties.push(result);
      updateStatus(summary, result);
    }

    return {
      status: summary.status,
      message: `Checked: ${settings.properties.length} properties, result: ${summary.status}`,
      detail: summary.properties,
      check: this.name,
    };
  }

  private runCheck(
    properties: Object,
    p: RequiredProperty | string
  ): PropertyResult {
    let settings: RequiredProperty;
    if (typeof p === "string") {
      settings = {
        property: p,
      };
    } else {
      settings = p;
    }
    const invalidStatus = settings.invalidStatus || Status.error;

    if (!properties.hasOwnProperty(settings.property)) {
      return {
        message: `Missing property: ${settings.property}`,
        status: invalidStatus,
      };
    }

    if (
      settings.allowedValues &&
      settings.allowedValues.indexOf(properties[settings.property])
    ) {
      return {
        message: `Invalid value: ${properties[settings.property]} for: ${
          settings.property
        }, must be one of: ${JSON.stringify(settings.allowedValues)}`,
        status: invalidStatus,
      };
    }
    return {
      message: `Property ${settings.property} is valid`,
      status: Status.success,
    };
  }
}
