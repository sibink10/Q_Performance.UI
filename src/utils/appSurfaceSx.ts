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
    boxShadow: 'none',
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
    boxShadow: 'none',
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
    boxShadow: 'none',
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
  fontSize: (theme: Theme) => theme.typography.overline.fontSize,
  fontWeight: 600,
  letterSpacing: '0.085em',
  color: 'text.secondary',
  borderBottom: 'none',
  py: 2.25,
  px: 2,
  bgcolor: 'transparent',
  whiteSpace: 'nowrap',
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
