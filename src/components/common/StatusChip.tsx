// @ts-nocheck
import { Chip } from '@mui/material';

const STATUS_CHIP_COLORS = {
  'Not Started': 'default',
  'In Progress': 'warning',
  'Draft Saved': 'info',
  Submitted: 'success',
  Completed: 'success',
  Active: 'success',
  Inactive: 'default',
  Published: 'success',
  Pending: 'warning',
};

/**
 * Color-coded status chip (filled + light tonal background via theme).
 */
const StatusChip = ({ status, size = 'small' }) => (
  <Chip label={status} color={STATUS_CHIP_COLORS[status] || 'default'} size={size} variant="filled" />
);

export default StatusChip;
