// @ts-nocheck
import { Typography } from '@mui/material';
import AppButton from './AppButton';
import AppModal from './AppModal';

/**
 * Reusable confirmation dialog for destructive or high-impact actions.
 */
const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'error',
  onConfirm,
  onClose,
  loading = false,
}) => (
  <AppModal
    open={open}
    onClose={onClose}
    title={title}
    actions={(
      <>
        <AppButton variant="outlined" onClick={onClose} disabled={loading}>
          {cancelText}
        </AppButton>
        <AppButton color={confirmColor} onClick={onConfirm} loading={loading}>
          {confirmText}
        </AppButton>
      </>
    )}
  >
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </AppModal>
);

export default ConfirmDialog;
