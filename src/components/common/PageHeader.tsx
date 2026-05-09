// Sticky, glass-style page title band - pairs with MainLayout AppBar height (56px).

import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { appPageCanvasBackgroundLayers } from '../../utils/appPageCanvasBackground';
import { appSurfaceGlassSx } from '../../utils/appSurfaceSx';

export const MAIN_LAYOUT_APP_BAR_HEIGHT = 56;

/** MUI `spacing()` units - gap below the fixed AppBar for sticky page subheaders */
export const PAGE_SUBHEADER_TOP_MARGIN_SPACING = 2;

/**
 * Sticky inset, flow margin below AppBar, and an opaque stripe above the band so
 * scrolled page content cannot show through the gap under the toolbar.
 */
export function mainLayoutStickySubheaderBandSx(theme: Theme) {
  const gap = theme.spacing(PAGE_SUBHEADER_TOP_MARGIN_SPACING);
  return {
    position: 'sticky' as const,
    top: `calc(${MAIN_LAYOUT_APP_BAR_HEIGHT}px + ${gap})`,
    mt: PAGE_SUBHEADER_TOP_MARGIN_SPACING,
    zIndex: theme.zIndex.appBar - 1,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: `calc(-1 * (${gap}))`,
      height: gap,
      ...appPageCanvasBackgroundLayers,
      zIndex: 0,
    },
  };
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  startAdornment?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
  sx?: object;
}

const PageHeader = ({
  title,
  subtitle,
  startAdornment,
  actions,
  sticky = true,
  sx = {},
}: PageHeaderProps) => {
  const theme = useTheme();

  const surface = {
    mx: 0,
    px: 2,
    py: 2,
    mb: sticky ? 2.5 : 3,
    ...appSurfaceGlassSx(theme),
    ...(!sticky ? { mt: PAGE_SUBHEADER_TOP_MARGIN_SPACING } : {}),
    ...(sticky ? mainLayoutStickySubheaderBandSx(theme) : {}),
  };

  const stickySx = surface;

  const rowSx = sticky
    ? {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        position: 'relative',
        zIndex: 1,
      }
    : {};

  return (
    <Box sx={{ ...stickySx, ...sx }}>
      <Box sx={rowSx}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0, flex: 1 }}>
          {startAdornment}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {actions ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>{actions}</Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default PageHeader;
