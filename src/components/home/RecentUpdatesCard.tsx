// @ts-nocheck
// Recent updates for Home. Draws on the same dummy notification data as the navbar bell —
// "View all" opens that same popover instead of a second list. See useNotificationCenter.
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useNotifications } from '../../hooks/useNotifications';
import { openNotifications } from '../../hooks/useNotificationCenter';
import { homeType } from './homeTypography';
import { ROW_PADDING_X } from './homeLayout';
import SectionCard from './SectionCard';

const MAX_ROWS = 5;

/** `admin` sees every notification framed as "All notifications"; others see their own "Recent updates". */
const RecentUpdatesCard = ({ role }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const { notifications, loading } = useNotifications();
  const rows = notifications.slice(0, MAX_ROWS);
  const title = role === 'ADMIN' ? 'All notifications' : 'Recent updates';

  return (
    <SectionCard
      title={title}
      action={
        <Button
          size="small"
          onClick={openNotifications}
          sx={{ ...homeType.rowTitle, color: 'primary.main', px: 1, minWidth: 0 }}
        >
          View all
        </Button>
      }
    >
      <Stack spacing={0.25} sx={{ mx: -ROW_PADDING_X }}>
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{ mx: ROW_PADDING_X, my: 0.5 }} />)
        ) : rows.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 3, color: 'text.secondary' }}>
            <NotificationsNoneRoundedIcon sx={{ fontSize: 32, opacity: 0.5 }} />
            <Typography sx={homeType.meta}>You are all caught up</Typography>
          </Stack>
        ) : (
          rows.map((n) => (
            <Stack
              key={n.id}
              direction="row"
              spacing={1.25}
              alignItems="flex-start"
              onClick={openNotifications}
              sx={{
                px: ROW_PADDING_X,
                py: 1,
                borderRadius: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.grey[900], 0.03) },
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  mt: 0.75,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: n.isRead ? 'transparent' : primary,
                }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ ...homeType.rowTitle, fontWeight: n.isRead ? 500 : 600 }} noWrap>
                  {n.title}
                </Typography>
                <Typography sx={homeType.meta} noWrap>
                  {n.message}
                </Typography>
              </Box>
              <Typography sx={{ ...homeType.meta, whiteSpace: 'nowrap', pt: 0.25 }}>
                {dayjs(n.createdAt).format('D MMM')}
              </Typography>
            </Stack>
          ))
        )}
      </Stack>
    </SectionCard>
  );
};

export default RecentUpdatesCard;
