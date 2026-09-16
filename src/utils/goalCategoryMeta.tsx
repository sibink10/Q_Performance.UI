import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { GOAL_CATEGORY } from './goalConstants';

type CategoryMeta = {
  Icon: SvgIconComponent;
  accent: (theme: Theme) => { main: string; soft: string; border: string };
};

/** Fallback for any category code beyond the 3 curated below (categories are now an open, admin-managed list). */
export const DEFAULT_CATEGORY_META: CategoryMeta = {
  Icon: CategoryOutlinedIcon,
  accent: (theme) => ({
    main: theme.palette.text.secondary,
    soft: alpha(theme.palette.text.secondary, 0.08),
    border: alpha(theme.palette.text.secondary, 0.18),
  }),
};

export const GOAL_CATEGORY_META: Record<string, CategoryMeta> = {
  [GOAL_CATEGORY.ORGANIZATIONAL]: {
    Icon: BusinessCenterOutlinedIcon,
    accent: (theme) => ({
      main: theme.palette.primary.main,
      soft: alpha(theme.palette.primary.main, 0.08),
      border: alpha(theme.palette.primary.main, 0.18),
    }),
  },
  [GOAL_CATEGORY.ROLE]: {
    Icon: WorkOutlineOutlinedIcon,
    accent: (theme) => ({
      main: theme.palette.info.main,
      soft: alpha(theme.palette.info.main, 0.08),
      border: alpha(theme.palette.info.main, 0.18),
    }),
  },
  [GOAL_CATEGORY.DEVELOPMENT]: {
    Icon: SchoolOutlinedIcon,
    accent: (theme) => ({
      main: theme.palette.secondary.main,
      soft: alpha(theme.palette.secondary.main, 0.1),
      border: alpha(theme.palette.secondary.main, 0.22),
    }),
  },
};

export function getCategoryMeta(code: string): CategoryMeta {
  return GOAL_CATEGORY_META[code] ?? DEFAULT_CATEGORY_META;
}
