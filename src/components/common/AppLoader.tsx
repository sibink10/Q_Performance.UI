import { Box, CircularProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

export type AppLoaderProps = {
  /** Text shown under the spinner. Pass `''`/`null` to hide it. */
  message?: string | null;
  /** Spinner diameter in px. */
  size?: number;
  /** Container min-height (ignored when `fullScreen`). */
  minHeight?: number | string;
  /** Covers the viewport with a soft backdrop instead of sitting inline. */
  fullScreen?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * The single shared loading indicator for the app - a plain two-tone
 * spinner (light track + brand-colored arc) plus an optional caption.
 * Reuse this anywhere content is being fetched instead of a bare
 * spinner, so loading states look consistent everywhere.
 */
const AppLoader = ({ message = 'Loading...', size = 36, minHeight = 300, fullScreen = false, sx }: AppLoaderProps) => {
  const theme = useTheme();

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        ...(fullScreen ? {} : { minHeight }),
        ...sx,
      }}
    >
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{ color: alpha(theme.palette.primary.main, 0.14) }}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          size={size}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            position: 'absolute',
            left: 0,
            top: 0,
            animationDuration: '650ms',
          }}
        />
      </Box>

      {message ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {message}
        </Typography>
      ) : null}
    </Box>
  );

  if (!fullScreen) return content;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.background.default, 0.8),
      }}
    >
      {content}
    </Box>
  );
};

export default AppLoader;
