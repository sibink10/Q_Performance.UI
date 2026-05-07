import { alpha } from '@mui/material/styles';

/** Base tint — paired with gradients below */
export const APP_PAGE_BACKGROUND_COLOR = '#f6f7f9';

/** Same layers as CssBaseline `body` — overlays (e.g. sticky subheader gap) must blend with page */
export const APP_PAGE_BACKGROUND_IMAGE = `
radial-gradient(900px 520px at 12% -18%, ${alpha('#22c55e', 0.09)} 0%, transparent 60%),
radial-gradient(900px 520px at 105% 10%, ${alpha('#14b8a6', 0.07)} 0%, transparent 55%),
linear-gradient(180deg, ${alpha('#ffffff', 1)} 0%, #f5f6f8 48%, #f6f7f9 100%)
`.trim();

/** Use on elements that must match the page canvas without duplicating gradient strings */
export const appPageCanvasBackgroundLayers = {
  backgroundColor: APP_PAGE_BACKGROUND_COLOR,
  backgroundImage: APP_PAGE_BACKGROUND_IMAGE,
  backgroundAttachment: 'fixed' as const,
};
