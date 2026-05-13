import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import AppButton from '../common/AppButton';

export type PublishResultsConfirmMode = 'bulk' | 'single';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Disables actions and blocks backdrop/Escape close when true (bulk publish in flight). */
  loading?: boolean;
  mode: PublishResultsConfirmMode;
  /** Used for bulk copy only. */
  bulkSelectedCount?: number;
};

export default function PublishResultsConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  mode,
  bulkSelectedCount = 0,
}: Props) {
  const description =
    mode === 'bulk' ? (
      <>
        Selected employees will see these results in Published reviews ({bulkSelectedCount} assignment
        {bulkSelectedCount === 1 ? '' : 's'}). Confirm to publish.
      </>
    ) : (
      <>This employee will see this result in Published reviews. Confirm to publish.</>
    );

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>Publish results?</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{description}</Typography>
      </DialogContent>
      <DialogActions>
        <AppButton variant="outlined" startIcon={null} onClick={onClose} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton color="primary" startIcon={null} onClick={onConfirm} loading={loading}>
          Publish
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
