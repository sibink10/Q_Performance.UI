import { createTheme, alpha } from '@mui/material/styles';
import { appPageCanvasBackgroundLayers } from '../utils/appPageCanvasBackground';
import { APP_SURFACE_RADIUS_PX } from '../utils/appSurfaceSx';

const gradientPrimary = 'linear-gradient(135deg, #4f46e5 0%, #6366f1 42%, #2563eb 100%)';
const gradientPrimaryHover = 'linear-gradient(135deg, #6366f1 0%, #818cf8 45%, #3b82f6 100%)';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5',
      light: '#818cf8',
      dark: '#4338ca',
    },
    secondary: {
      main: '#64748b',
    },
    success: {
      main: '#059669',
    },
    warning: {
      main: '#d97706',
    },
    error: {
      main: '#dc2626',
    },
    info: {
      main: '#0284c7',
      dark: '#0369a1',
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: alpha('#0f172a', 0.08),
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h5: { fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em' },
    h6: { fontWeight: 650, fontSize: '1.08rem' },
    subtitle1: { fontWeight: 650, fontSize: '0.95rem' },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
  },
  shape: {
    /** Base radius; Cards/Papers use APP_SURFACE_RADIUS_PX for parity with AppCard. */
    borderRadius: APP_SURFACE_RADIUS_PX,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          ...appPageCanvasBackgroundLayers,
          minHeight: '100%',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
        contained: {
          boxShadow: `0 4px 14px ${alpha('#4f46e5', 0.28)}`,
          '&:hover': {
            boxShadow: `0 6px 20px ${alpha('#4f46e5', 0.38)}`,
          },
        },
        containedPrimary: {
          background: gradientPrimary,
          '&:hover': {
            background: gradientPrimaryHover,
          },
        },
        outlined: {
          borderWidth: '1px',
          borderColor: alpha('#0f172a', 0.12),
          '&:hover': {
            borderWidth: '1px',
            borderColor: alpha('#4f46e5', 0.35),
            backgroundColor: alpha('#4f46e5', 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}, 0 10px 28px -12px ${alpha(
            '#0f172a',
            0.09,
          )}`,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${APP_SURFACE_RADIUS_PX}px`,
        }),
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: `${APP_SURFACE_RADIUS_PX}px`,
        },
        elevation1: {
          boxShadow: `0 1px 2px ${alpha('#0f172a', 0.05)}, 0 8px 24px -8px ${alpha('#0f172a', 0.12)}`,
        },
      },
    },
    MuiChip: {
      defaultProps: {
        variant: 'filled',
      },
      styleOverrides: {
        root: ({ theme, ownerState }) => {
          const variant = ownerState.variant || 'filled';
          const paletteKey =
            typeof ownerState.color === 'string' ? ownerState.color : 'default';
          const base = { fontWeight: 600 };

          if (variant === 'outlined') {
            return {
              ...base,
              backgroundColor: alpha(theme.palette.grey[500], 0.08),
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: alpha(theme.palette.grey[500], 0.35),
            };
          }

          const colorKeys = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
          type ToneKey = (typeof colorKeys)[number];
          const toneKey =
            (colorKeys as readonly string[]).includes(paletteKey) ? (paletteKey as ToneKey) : null;
          const tone = toneKey ? theme.palette[toneKey] : null;

          if (tone?.main) {
            return {
              ...base,
              border: 'none',
              backgroundColor: alpha(
                tone.main,
                paletteKey === 'warning' ? 0.18 : 0.14,
              ),
              color: tone.dark ?? tone.main,
            };
          }

          return {
            ...base,
            border: 'none',
            backgroundColor: alpha(theme.palette.grey[500], 0.14),
            color: theme.palette.text.primary,
          };
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': { fontWeight: 700, fontSize: '0.8125rem' },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&:before': { display: 'none' },
          boxShadow: `0 1px 2px ${alpha('#0f172a', 0.04)}`,
          border: `1px solid ${alpha('#0f172a', 0.06)}`,
          borderRadius: '12px !important',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 44,
          padding: theme.spacing(0.5),
          borderRadius: 14,
          backgroundColor: alpha(theme.palette.primary.main, 0.07),
          borderBottom: 'none',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }),
        flexContainer: {
          gap: 4,
        },
        indicator: {
          display: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 38,
          padding: '8px 14px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 10,
          color: theme.palette.text.secondary,
          transition: 'color 0.2s, background-color 0.2s, box-shadow 0.2s',
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `0 2px 8px ${alpha('#0f172a', 0.08)}, 0 1px 2px ${alpha('#0f172a', 0.06)}`,
          },
        }),
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: 'default',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          color: theme.palette.text.primary,
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.03)}`,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
});
