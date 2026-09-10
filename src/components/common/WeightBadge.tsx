import { Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type WeightBadgeProps = {
  weight: number;
  size?: 'small' | 'medium';
};

const WeightBadge = ({ weight, size = 'small' }: WeightBadgeProps) => {
  const theme = useTheme();

  return (
    <Chip
      size={size}
      label={`${weight}%`}
      sx={{
        fontWeight: 600,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.dark,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    />
  );
};

export default WeightBadge;
