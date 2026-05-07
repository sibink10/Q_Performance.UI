import { alpha } from '@mui/material/styles';

/** Base tint — paired with gradients below */
export const APP_PAGE_BACKGROUND_COLOR = '#f1f5f9';

/** Same layers as CssBaseline `body` — overlays (e.g. sticky subheader gap) must blend with page */
export const APP_PAGE_BACKGROUND_IMAGE = `
radial-gradient(1200px 600px at 10% -10%, ${alpha('#6366f1', 0.14)} 0%, transparent 55%),
radial-gradient(900px 500px at 100% 0%, ${alpha('#38bdf8', 0.12)} 0%, transparent 50%),
linear-gradient(180deg, ${alpha('#f8fafc', 1)} 0%, #eef2f7 45%, #f1f5f9 100%)
`.trim();

/** Use on elements that must match the page canvas without duplicating gradient strings */
export const appPageCanvasBackgroundLayers = {
  backgroundColor: APP_PAGE_BACKGROUND_COLOR,
  backgroundImage: APP_PAGE_BACKGROUND_IMAGE,
  backgroundAttachment: 'fixed' as const,
};
