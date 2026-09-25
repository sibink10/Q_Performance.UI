// @ts-nocheck
import { useRef, useState } from 'react';
import { Badge, IconButton, Popover, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationOpenSignal } from '../../hooks/useNotificationCenter';
import NotificationPanel from './NotificationPanel';

const NotificationBell = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();

  // Lets other pages (e.g. Home's "View all") open this same popover.
  useNotificationOpenSignal(() => setAnchorEl(buttonRef.current));

  const handleOpenItem = (n) => {
    markRead(n.id);
    if (n.path) {
      setAnchorEl(null);
      navigate(n.path);
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          ref={buttonRef}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' },
            ...(anchorEl && { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }),
          }}
        >
          <Badge
            badgeContent={unreadCount}
            max={99}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: 10, fontWeight: 600, minWidth: 17, height: 17, px: 0.5 } }}
          >
            <NotificationsNoneRoundedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: `0 16px 40px ${alpha(theme.palette.grey[900], 0.16)}`,
              overflow: 'hidden',
            },
          },
        }}
      >
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onRead={markRead}
          onReadAll={markAllRead}
          onOpen={handleOpenItem}
        />
      </Popover>
    </>
  );
};

export default NotificationBell;
