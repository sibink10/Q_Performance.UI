import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

/** MUI `sx.borderRadius` index (typically 8px). */
export const APP_SURFACE_RADIUS = 1;

/** Pixel radius for theme overrides that need explicit px (matches APP_SURFACE_RADIUS). */
export const APP_SURFACE_RADIUS_PX = 8;

const outline = {
  border: '1px solid',
  borderColor: 'divider',
} as const;

/** Standard body / content card (Paper-like). */
export function appSurfacePaperSx(theme: Theme) {
  return {
    borderRadius: APP_SURFACE_RADIUS,
    ...outline,
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'none',
    boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}, 0 10px 28px -12px ${alpha(
      '#0f172a',
      0.09,
    )}`,
  } as const;
}

/** Sticky / glass page band (PageHeader, My reviews hero). */
export function appSurfaceGlassSx(theme: Theme) {
  return {
    borderRadius: APP_SURFACE_RADIUS,
    ...outline,
    backgroundColor: alpha(theme.palette.background.paper, 0.94),
    backdropFilter: 'saturate(180%) blur(12px)',
    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    boxShadow: `0 8px 36px ${alpha(theme.palette.common.black, 0.09)}`,
  } as const;
}

/** Table / data shell wrapper. */
export function appSurfaceTableShellSx(theme: Theme) {
  return {
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: APP_SURFACE_RADIUS,
    ...outline,
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'none',
    boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.07)}`,
  } as const;
}

/** @deprecated use appSurfaceGlassSx */
export function floatingPanelSx(theme: Theme) {
  return appSurfaceGlassSx(theme);
}

/** @deprecated use appSurfaceTableShellSx */
export function floatingTableShellSx(theme: Theme) {
  return appSurfaceTableShellSx(theme);
}

export const modernTableHeadCellSx = {
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.085em',
  color: 'text.secondary',
  borderBottom: 'none',
  py: 2.25,
  px: 2,
  bgcolor: 'transparent',
} as const;

export const modernTableBodyCellSx = {
  borderBottom: 'none',
  verticalAlign: 'middle',
  py: 2.25,
  px: 2,
} as const;

export const modernTableSx = {
  borderCollapse: 'separate',
  borderSpacing: 0,
  '& .MuiTableHead-root .MuiTableCell-root': { ...modernTableHeadCellSx },
  '& .MuiTableBody-root .MuiTableCell-root': { ...modernTableBodyCellSx },
} as const;
