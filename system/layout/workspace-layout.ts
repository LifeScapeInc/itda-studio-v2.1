export const NAVIGATION_LEFT_WIDTH = 203;

export const MATERIAL_PANEL_MIN_WIDTH = 240;
export const MATERIAL_PANEL_MAX_WIDTH = 420;
export const MATERIAL_PANEL_DEFAULT_WIDTH = 282;

export const SETTINGS_PANEL_MIN_WIDTH = 300;
export const SETTINGS_PANEL_MAX_WIDTH = 480;
export const SETTINGS_PANEL_DEFAULT_WIDTH = 354;

export function clampPanelWidth(
  width: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, width));
}
