// Shared content surface — same radius, border, shadow as theme MuiCard/MuiPaper.

import { Paper } from '@mui/material';
import type { PaperProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { appSurfaceGlassSx, appSurfacePaperSx, appSurfaceTableShellSx } from '../../utils/appSurfaceSx';

export type AppCardVariant = 'paper' | 'glass' | 'table';

export type AppCardProps = Omit<PaperProps, 'elevation' | 'variant'> & {
  /** `glass`: sticky/header bands · `table`: table/list shells */
  variant?: AppCardVariant;
};

const AppCard = ({ variant = 'paper', sx, ...props }: AppCardProps) => {
  const theme = useTheme();
  const base =
    variant === 'glass'
      ? appSurfaceGlassSx(theme)
      : variant === 'table'
        ? appSurfaceTableShellSx(theme)
        : appSurfacePaperSx(theme);
  return <Paper elevation={0} sx={{ ...base, ...sx }} {...props} />;
};

export default AppCard;
