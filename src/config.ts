export enum Mode {
  Matching = "Matching",
  Changed = "Changed",
}
export interface ChangedModeConfig extends ModeConfig {
  branch?: string;
  remote?: string;
}
export interface ModeConfig {
  pattern?: string;
}
export interface CheckConfig {
  name: string;
  includes?: string;
  excludes?: string;
  settings?: any;
}
export interface ValidationConfig {
  mode: Mode;
  modeConfig: ModeConfig | ChangedModeConfig;
  baseDirectory?: string;
  checks: Array<CheckConfig>;
}
