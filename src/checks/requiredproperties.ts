import { Logger } from "winston";
import { Result, updateStatus } from "..";

import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../request";

export interface RequiredPropertiesSettings {
  properties: Array<RequiredProperty | string>;
}

export interface RequiredProperty {
  key: string;
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
    settings: RequiredPropertiesSettings,
    _log: Logger
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
      file: file.file,
      check: this.name,
    };
  }

  private runCheck(
    properties: Object,
    p: RequiredProperty | string
  ): PropertyResult {
    let property: RequiredProperty;
    if (typeof p === "string") {
      property = {
        key: p,
      };
    } else {
      property = p;
    }
    const invalidStatus = property.invalidStatus || Status.error;

    if (!properties.hasOwnProperty(property.key)) {
      return {
        message: `Missing property: ${property.key}`,
        status: invalidStatus,
      };
    }

    if (
      property.allowedValues &&
      property.allowedValues.indexOf(properties[property.key])
    ) {
      return {
        message: `Invalid value: ${properties[property.key]} for: ${
          property.key
        }, must be one of: ${JSON.stringify(property.allowedValues)}`,
        status: invalidStatus,
      };
    }
    return {
      message: `Property ${property.key} is valid`,
      status: Status.success,
    };
  }
}
