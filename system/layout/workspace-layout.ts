export const NAVIGATION_LEFT_WIDTH = 203;

export const MATERIAL_PANEL_MIN_WIDTH = 240;
export const MATERIAL_PANEL_MAX_WIDTH = 420;
export const MATERIAL_PANEL_DEFAULT_WIDTH = 282;

export const SETTINGS_PANEL_MIN_WIDTH = 300;
export const SETTINGS_PANEL_MAX_WIDTH = 480;
export const SETTINGS_PANEL_DEFAULT_WIDTH = 354;

export const FURNITURE_GALLERY_PANEL_MIN_WIDTH = 260;
export const FURNITURE_GALLERY_PANEL_MAX_WIDTH = 520;
export const FURNITURE_GALLERY_PANEL_DEFAULT_WIDTH = 336;

export const BOOKMARK_DETAILS_PANEL_MIN_WIDTH = 520;
export const BOOKMARK_DETAILS_PANEL_MAX_WIDTH = 960;
export const BOOKMARK_DETAILS_PANEL_DEFAULT_WIDTH = 680;

export function clampPanelWidth(
  width: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, width));
}
