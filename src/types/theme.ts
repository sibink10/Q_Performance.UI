import { createTheme, alpha, darken, lighten } from '@mui/material/styles';
import type { PaletteColor, Shadows } from '@mui/material/styles';
import { appPageCanvasBackgroundLayers } from '../utils/appPageCanvasBackground';
import { APP_SURFACE_RADIUS_PX } from '../utils/appSurfaceSx';

/** Default primary when org branding has no theme color set */
export const DEFAULT_BRAND_PRIMARY = '#0f9d78';

const SEMANTIC_GOAL_COLORS = {
  onTrack: { main: '#16a34a', light: '#dcfce7', dark: '#15803d', contrastText: '#ffffff' },
  needsAttention: { main: '#d97706', light: '#fef3c7', dark: '#b45309', contrastText: '#ffffff' },
  offTrack: { main: '#dc2626', light: '#fee2e2', dark: '#b91c1c', contrastText: '#ffffff' },
  completed: { main: '#0891b2', light: '#cffafe', dark: '#0e7490', contrastText: '#ffffff' },
} as const satisfies Record<string, PaletteColor>;

const SEMANTIC_RATING_SCALE = {
  exceptional: { main: '#7c3aed', light: '#ede9fe', dark: '#6d28d9', contrastText: '#ffffff' },
  exceedsExpectations: { main: '#2563eb', light: '#dbeafe', dark: '#1d4ed8', contrastText: '#ffffff' },
  meetsExpectations: { main: '#16a34a', light: '#dcfce7', dark: '#15803d', contrastText: '#ffffff' },
  needsImprovement: { main: '#d97706', light: '#fef3c7', dark: '#b45309', contrastText: '#ffffff' },
  unsatisfactory: { main: '#dc2626', light: '#fee2e2', dark: '#b91c1c', contrastText: '#ffffff' },
} as const satisfies Record<string, PaletteColor>;

/** Softer elevation shadows than MUI defaults. */
function createSoftShadows(): Shadows {
  const base = alpha('#0f172a', 0.06);
  const mid = alpha('#0f172a', 0.08);
  const deep = alpha('#0f172a', 0.12);

  return [
    'none',
    `0 1px 2px ${base}`,
    `0 2px 6px ${base}, 0 1px 2px ${alpha('#0f172a', 0.04)}`,
    `0 4px 12px ${mid}, 0 2px 4px ${base}`,
    `0 8px 20px ${mid}, 0 4px 8px ${base}`,
    `0 12px 28px ${deep}, 0 6px 12px ${mid}`,
    `0 16px 36px ${deep}, 0 8px 16px ${mid}`,
    `0 20px 44px ${deep}, 0 10px 20px ${mid}`,
    `0 24px 52px ${alpha('#0f172a', 0.14)}, 0 12px 24px ${deep}`,
    `0 28px 60px ${alpha('#0f172a', 0.16)}, 0 14px 28px ${deep}`,
    `0 32px 68px ${alpha('#0f172a', 0.18)}, 0 16px 32px ${deep}`,
    `0 36px 76px ${alpha('#0f172a', 0.2)}, 0 18px 36px ${deep}`,
    `0 40px 84px ${alpha('#0f172a', 0.22)}, 0 20px 40px ${deep}`,
    `0 44px 92px ${alpha('#0f172a', 0.24)}, 0 22px 44px ${deep}`,
    `0 48px 100px ${alpha('#0f172a', 0.26)}, 0 24px 48px ${deep}`,
    `0 52px 108px ${alpha('#0f172a', 0.28)}, 0 26px 52px ${deep}`,
    `0 56px 116px ${alpha('#0f172a', 0.3)}, 0 28px 56px ${deep}`,
    `0 60px 124px ${alpha('#0f172a', 0.32)}, 0 30px 60px ${deep}`,
    `0 64px 132px ${alpha('#0f172a', 0.34)}, 0 32px 64px ${deep}`,
    `0 68px 140px ${alpha('#0f172a', 0.36)}, 0 34px 68px ${deep}`,
    `0 72px 148px ${alpha('#0f172a', 0.38)}, 0 36px 72px ${deep}`,
    `0 76px 156px ${alpha('#0f172a', 0.4)}, 0 38px 76px ${deep}`,
    `0 80px 164px ${alpha('#0f172a', 0.42)}, 0 40px 80px ${deep}`,
    `0 84px 172px ${alpha('#0f172a', 0.44)}, 0 42px 84px ${deep}`,
    `0 88px 180px ${alpha('#0f172a', 0.46)}, 0 44px 88px ${deep}`,
  ] as Shadows;
}

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
      onTrack: { ...SEMANTIC_GOAL_COLORS.onTrack },
      needsAttention: { ...SEMANTIC_GOAL_COLORS.needsAttention },
      offTrack: { ...SEMANTIC_GOAL_COLORS.offTrack },
      completed: { ...SEMANTIC_GOAL_COLORS.completed },
      ratingScale: {
        exceptional: { ...SEMANTIC_RATING_SCALE.exceptional },
        exceedsExpectations: { ...SEMANTIC_RATING_SCALE.exceedsExpectations },
        meetsExpectations: { ...SEMANTIC_RATING_SCALE.meetsExpectations },
        needsImprovement: { ...SEMANTIC_RATING_SCALE.needsImprovement },
        unsatisfactory: { ...SEMANTIC_RATING_SCALE.unsatisfactory },
      },
    },
    shadows: createSoftShadows(),
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Segoe UI", "Roboto", sans-serif',
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
      borderRadius: 12,
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
            '& .MuiTableCell-root': {
              fontWeight: 700,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
            },
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
