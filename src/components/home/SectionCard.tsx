// @ts-nocheck
import { Box, Stack, Typography } from '@mui/material';
import { homeType } from './homeTypography';
import AppCard from '../common/AppCard';

/**
 * Shared card for dashboard sections so headers, padding and typography stay identical.
 * `action` renders on the right of the header (count, link, legend…).
 */
const SectionCard = ({ title, subtitle, action, children, sx, bodySx }) => (
  <AppCard sx={{ p: 2.5, display: 'flex', flexDirection: 'column', ...sx }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={homeType.cardTitle}>{title}</Typography>
        {subtitle && (
          <Typography sx={homeType.meta}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
    <Box sx={{ flex: 1, minHeight: 0, ...bodySx }}>{children}</Box>
  </AppCard>
);

export default SectionCard;
