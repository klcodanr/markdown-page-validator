import { Check, CheckResult, Status } from "../check";
import { MarkdownFile } from "../validator";

export interface DateRangeSettings {
  property: string;
  afterOffset?: number;
  beforeOffset?: number;
}

export class DateRange implements Check<DateRangeSettings> {
  name = "DateRange";
  async check(
    file: MarkdownFile,
    settings: DateRangeSettings
  ): Promise<CheckResult> {
    const value: Date = file.properties[settings.property];
    if (!value) {
      return {
        status: Status.error,
        message: `No date found for: ${settings.property}`,
        check: this.name,
      };
    }
    const before = new Date(Date.now() - (settings.beforeOffset || 0));
    const after = new Date(Date.now() + (settings.afterOffset || 0));

    const valid =
      before.getTime() < value.getTime() && value.getTime() < after.getTime();
    if (valid) {
      return {
        status: Status.success,
        message: `Date for ${settings.property} within range`,
        check: this.name,
      };
    } else {
      return {
        status: Status.error,
        message: `Date ${value.toISOString()} for ${
          settings.property
        } not range`,
        check: this.name,
      };
    }
  }
}
