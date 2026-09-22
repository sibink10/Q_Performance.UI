// @ts-nocheck
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';

/**
 * Reusable modal dialog.
 * Props: open, onClose, title, subtitle?, icon?, actions (ReactNode), maxWidth
 */
const AppModal = ({
  open,
  onClose,
  title,
  subtitle = null,
  icon = null,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  paperSx = undefined,
  headerAction = null,
  hideCloseIcon = false,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={maxWidth}
    fullWidth={fullWidth}
    PaperProps={{ sx: { borderRadius: '18px', ...paperSx } }}
  >
    <DialogTitle sx={{ p: 0 }}>
      <Stack direction="row" spacing={1.75} alignItems="flex-start" sx={{ pl: 3, pr: 2, py: 2.5 }}>
        {icon && (
          <Box
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0, pt: icon ? 0.4 : 0 }}>
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {headerAction}
        {!hideCloseIcon && (
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.25 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </DialogTitle>
    <DialogContent dividers sx={{ px: 3, py: 3 }}>
      {children}
    </DialogContent>
    {actions && <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>}
  </Dialog>
);

export default AppModal;
