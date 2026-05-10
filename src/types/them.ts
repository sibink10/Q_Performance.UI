import { createTheme, alpha, darken, lighten } from '@mui/material/styles';
import { appPageCanvasBackgroundLayers } from '../utils/appPageCanvasBackground';
import { APP_SURFACE_RADIUS_PX } from '../utils/appSurfaceSx';

/** Default primary when org branding has no theme color set */
export const DEFAULT_BRAND_PRIMARY = '#0f9d78';

function isValidHex6(s: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(String(s || '').trim());
}

/**
 * Builds the app MUI theme; pass org `themePrimaryColor` (#rrggbb) to brand the UI.
 */
export function createAppTheme(primaryHex?: string | null) {
  const brandGreen = isValidHex6(primaryHex || '') ? primaryHex!.trim() : DEFAULT_BRAND_PRIMARY;
  const brandGreenHover = darken(brandGreen, 0.12);
  const primaryLight = lighten(brandGreen, 0.28);
  const primaryDark = darken(brandGreen, 0.18);

  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: brandGreen,
        light: primaryLight,
        dark: primaryDark,
      },
      secondary: {
        main: '#64748b',
      },
      success: {
        main: '#16a34a',
      },
      warning: {
        main: '#d97706',
      },
      error: {
        main: '#dc2626',
      },
      info: {
        main: '#0891b2',
        dark: '#0e7490',
      },
      background: {
        default: '#f6f7f9',
        paper: '#ffffff',
      },
      text: {
        primary: '#0f172a',
        secondary: '#64748b',
      },
      divider: '#e6eaef',
      grey: {
        50: '#f8fafc',
        100: '#f4f6f8',
        200: '#e6eaef',
        900: '#0f172a',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
      fontSize: 14,
      h5: { fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em' },
      h6: { fontWeight: 650, fontSize: '1.08rem' },
      subtitle1: { fontWeight: 650, fontSize: '0.95rem' },
      subtitle2: { fontWeight: 650, fontSize: '0.875rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.55 },
      caption: { fontSize: '0.75rem', lineHeight: 1.45 },
      overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.085em' },
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
            boxShadow: `0 6px 18px ${alpha(brandGreen, 0.18)}`,
            '&:hover': {
              boxShadow: `0 10px 26px ${alpha(brandGreen, 0.22)}`,
            },
          },
          containedPrimary: {
            background: brandGreen,
            '&:hover': {
              background: brandGreenHover,
            },
          },
          outlined: {
            borderWidth: '1px',
            borderColor: alpha('#0f172a', 0.12),
            '&:hover': {
              borderWidth: '1px',
              borderColor: alpha(brandGreen, 0.35),
              backgroundColor: alpha(brandGreen, 0.04),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: 'none',
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
            boxShadow: 'none',
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
            const base = {
              fontWeight: 600,
              borderRadius: 999,
              height: 22,
              fontSize: '0.75rem',
              lineHeight: 1,
            } as const;

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
          label: {
            paddingLeft: 10,
            paddingRight: 10,
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
            backgroundColor: alpha(theme.palette.grey[900], 0.035),
            borderBottom: 'none',
            border: `1px solid ${alpha(theme.palette.grey[900], 0.08)}`,
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
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              boxShadow: `0 1px 2px ${alpha('#0f172a', 0.06)}, 0 10px 22px -14px ${alpha(
                '#0f172a',
                0.18,
              )}`,
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
}

/** Static default theme (matches `createAppTheme()` with no org color). */
export const theme = createAppTheme();
