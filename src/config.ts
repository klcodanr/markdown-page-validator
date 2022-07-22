export enum Mode {
  Matching = "Matching",
  Changed = "Changed",
}
export interface ChangedModeConfig extends ModeConfig {
  branch?: string;
  remote?: string;
}
export interface ModeConfig {
  includes?: string;
  excludes?: string;
}
export interface CheckConfig {
  name: string;
  includes?: string;
  excludes?: string;
  settings?: any;
}
export interface ValidationConfig {
  mode?: Mode;
  modeConfig?: ModeConfig | ChangedModeConfig;
  checks: Array<CheckConfig>;
}
