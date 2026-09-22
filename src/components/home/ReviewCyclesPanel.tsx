// @ts-nocheck
import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { homeType } from './homeTypography';
import SectionCard from './SectionCard';

const STATUS_META = {
  ACTIVE: { label: 'Active', tone: 'success' },
  UPCOMING: { label: 'Upcoming', tone: 'info' },
  CLOSED: { label: 'Closed', tone: 'grey' },
};

const toneColor = (theme, tone) => (tone === 'grey' ? theme.palette.text.secondary : theme.palette[tone].main);

export const CycleStatusChip = ({ status }) => {
  const theme = useTheme();
  const meta = STATUS_META[status] || STATUS_META.CLOSED;
  const color = toneColor(theme, meta.tone);
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{ ...homeType.badge, height: 22, minWidth: 74, color, bgcolor: alpha(color, 0.12) }}
    />
  );
};

const fmt = (d) => dayjs(d).format('D MMM YYYY');

/** Minimal row: name + dates on the left, status on the right. */
const CycleRow = ({ cycle }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ py: 1.5 }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={homeType.rowTitle} noWrap>
        {cycle.name}
      </Typography>
      <Typography sx={homeType.meta}>
        {fmt(cycle.startDate)} – {fmt(cycle.endDate)}
      </Typography>
    </Box>
    <CycleStatusChip status={cycle.status} />
  </Stack>
);

/** Hidden entirely when there are no cycles (and not loading). */
const ReviewCyclesPanel = ({ cycles, loading, title = 'Review cycles' }) => {
  if (!loading && !cycles?.length) return null;
  return (
    <SectionCard title={title}>
      <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />} sx={{ mt: -1.5 }}>
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} height={52} sx={{ my: 0.75 }} />)
          : cycles.map((c) => <CycleRow key={c.id} cycle={c} />)}
      </Stack>
    </SectionCard>
  );
};

export default ReviewCyclesPanel;
