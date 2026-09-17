import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { formatDateOnly, formatTimeOnly } from '../../utils/helpers';

type DateTimeStampProps = {
  date: string;
};

/** Renders a date and time as two distinct, aligned pieces instead of one plain string. */
const DateTimeStamp = ({ date }: DateTimeStampProps) => {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {formatDateOnly(date)}
      </Typography>
      <Box
        sx={{
          width: 3,
          height: 3,
          borderRadius: '50%',
          backgroundColor: alpha(theme.palette.text.secondary, 0.5),
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {formatTimeOnly(date)}
      </Typography>
    </Stack>
  );
};

export default DateTimeStamp;
