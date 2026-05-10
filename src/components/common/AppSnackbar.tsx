// @ts-nocheck
// src/components/common/AppSnackbar
import { Alert, Button, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * Standardized snackbar for success / draft-save / info notifications.
 *
 * Used across the app so every "saved", "drafted", "assigned", etc.
 * confirmation has identical look + behavior:
 *   - filled severity colors (more prominent than plain Alerts)
 *   - bottom-center anchor
 *   - 8s autohide when an action link is present, 4s otherwise
 *   - optional navigation action ("Go to …") rendered inside the Alert
 *
 * Props:
 *  - open, onClose, message: standard snackbar controls
 *  - severity: 'success' | 'info' | 'warning' | 'error' (default 'success')
 *  - actionLabel + (actionTo | onAction): optional inline action.
 *      `actionTo` will navigate via react-router; `onAction` runs custom code.
 *      The snackbar always closes after the action fires.
 *  - autoHideDuration: override default timing if needed.
 */
const AppSnackbar: any = (props: any) => {
  const navigate = useNavigate();

  const {
    open,
    onClose,
    message,
    severity = 'success',
    actionLabel,
    actionTo,
    onAction,
    autoHideDuration,
    anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
    alertSx,
  } = props;

  const hasAction = !!actionLabel && (!!actionTo || typeof onAction === 'function');
  const effectiveDuration = autoHideDuration ?? (hasAction ? 8000 : 4000);

  const handleAction = () => {
    if (typeof onAction === 'function') onAction();
    if (actionTo) navigate(actionTo);
    onClose?.();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={effectiveDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={onClose}
        action={
          hasAction ? (
            <Button
              color="inherit"
              size="small"
              onClick={handleAction}
              sx={{ fontWeight: 600, textDecoration: 'underline' }}
            >
              {actionLabel}
            </Button>
          ) : undefined
        }
        sx={{ alignItems: 'center', width: '100%', maxWidth: 560, ...alertSx }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AppSnackbar;
