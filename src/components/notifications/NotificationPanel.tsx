// @ts-nocheck
import { Box, Button, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

const NotificationPanel = ({ notifications, loading, unreadCount, onRead, onReadAll, onOpen }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Box sx={{ width: { xs: 'calc(100vw - 32px)', sm: 400 }, maxWidth: 400 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.75 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em' }}>
          Notifications{notifications.length ? ` (${notifications.length})` : ''}
        </Typography>
        <Button
          size="small"
          onClick={onReadAll}
          disabled={unreadCount === 0}
          sx={{ fontWeight: 600, fontSize: 13, px: 1, minWidth: 0 }}
        >
          Mark all read
        </Button>
      </Stack>
      <Divider />

      <Box sx={{ maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {loading ? (
          [0, 1, 2].map((i) => (
            <Box key={i} sx={{ px: 2.5, py: 1.75 }}>
              <Skeleton width="45%" />
              <Skeleton width="80%" />
            </Box>
          ))
        ) : notifications.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.secondary' }}>
            <NotificationsNoneRoundedIcon sx={{ fontSize: 40, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              You are all caught up
            </Typography>
          </Stack>
        ) : (
          notifications.map((n, i) => (
            <Box
              key={n.id}
              onClick={() => onOpen(n)}
              sx={{
                px: 2.5,
                py: 1.75,
                cursor: 'pointer',
                position: 'relative',
                bgcolor: n.isRead ? 'transparent' : alpha(primary, 0.05),
                borderBottom: i === notifications.length - 1 ? 'none' : '1px solid',
                borderColor: 'divider',
                transition: 'background-color .15s',
                '&:hover': { bgcolor: alpha(primary, n.isRead ? 0.04 : 0.09) },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  {!n.isRead && (
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: primary, flexShrink: 0 }} />
                  )}
                  <Typography
                    sx={{
                      fontSize: 14,
                      lineHeight: 1.4,
                      fontWeight: 600,
                      color: n.isRead ? 'text.secondary' : 'primary.main',
                    }}
                    noWrap
                  >
                    {n.title}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', pt: 0.25 }}>
                  {dayjs(n.createdAt).format('D MMM')}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
                {n.message}
              </Typography>
              {!n.isRead && (
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(n.id);
                  }}
                  sx={{ mt: 0.5, ml: -0.75, px: 0.75, minWidth: 0, fontWeight: 600, fontSize: 12.5 }}
                >
                  Mark as read
                </Button>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default NotificationPanel;
