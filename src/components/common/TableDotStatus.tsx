// @ts-nocheck
import { Box, Stack, Typography } from '@mui/material';

/** Map free-text statuses to semantic dot tones (modern table rows). */
export function statusToDotTone(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (!s) return 'neutral';
  if (
    /submitted|completed|published|active|approved|done|success/.test(s)
  ) {
    return 'positive';
  }
  if (/reject|fail|error|overdue|negative|declined/.test(s)) {
    return 'negative';
  }
  if (/progress|pending|waiting|draft|partial/.test(s)) {
    return 'warning';
  }
  if (/not started|not.?started|^new$/.test(s)) {
    return 'neutral';
  }
  return 'neutral';
}

const DOT = {
  positive: '#14b8a6',
  negative: '#ef4444',
  warning: '#f59e0b',
  neutral: '#94a3b8',
};

/**
 * Minimal status row: coloured dot + lowercase label (matches reference dashboards).
 */
const TableDotStatus = ({ label, tone: toneProp = undefined }) => {
  const tone = toneProp ?? statusToDotTone(label);
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ py: 0.25 }}>
      <Box
        sx={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: DOT[tone] || DOT.neutral,
          boxShadow: `0 0 0 2px ${String(DOT[tone] || DOT.neutral)}22`,
        }}
      />
      <Typography
        component="span"
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          textTransform: 'lowercase',
          fontSize: '0.8125rem',
          lineHeight: 1.35,
        }}
      >
        {String(label ?? '—')
          .trim()
          .toLowerCase() || '—'}
      </Typography>
    </Stack>
  );
};

export default TableDotStatus;
