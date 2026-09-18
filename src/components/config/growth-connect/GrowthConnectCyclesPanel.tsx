import { useEffect, useState } from 'react';
import { Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import type { FinancialYearOption } from '../../../hooks/useFinancialYears';
import type { GrowthConnectCycle } from '../../../types/growthConnect';
import AppButton from '../../common/AppButton';
import AppModal from '../../common/AppModal';
import AppLoader from '../../common/AppLoader';
import useGrowthConnectCycles from '../../../hooks/useGrowthConnectCycles';
import GrowthConnectCycleModal, { type GrowthConnectCycleSubmitPayload } from './GrowthConnectCycleModal';
import GrowthConnectCyclesTable from './GrowthConnectCyclesTable';

type GrowthConnectCyclesPanelProps = {
  open: boolean;
  reviewPeriod: FinancialYearOption | null;
  onClose: () => void;
};

const GrowthConnectCyclesPanel = ({ open, reviewPeriod, onClose }: GrowthConnectCyclesPanelProps) => {
  const {
    cycles,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadCycles,
    createCycle,
    updateCycle,
    openCycle,
    closeCycle,
    deleteCycle,
    clearError,
    clearSuccess,
  } = useGrowthConnectCycles();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<GrowthConnectCycle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GrowthConnectCycle | null>(null);

  useEffect(() => {
    if (open && reviewPeriod) {
      loadCycles(reviewPeriod.id);
    }
  }, [open, reviewPeriod, loadCycles]);

  const handleCreate = () => {
    setEditingCycle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cycle: GrowthConnectCycle) => {
    setEditingCycle(cycle);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (payload: GrowthConnectCycleSubmitPayload) => {
    if (!reviewPeriod) return;
    try {
      if (editingCycle) {
        await updateCycle(editingCycle.id, payload);
      } else {
        await createCycle(reviewPeriod.id, payload);
      }
      setIsFormOpen(false);
      setEditingCycle(null);
    } catch {
      // error surfaced via the hook's `error` state; keep the form open
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCycle(deleteTarget.id);
    } catch {
      // error surfaced via the hook's `error` state
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppModal
        open={open}
        onClose={onClose}
        title="Growth Connect Cycles"
        subtitle={reviewPeriod?.name}
        icon={<TimelineOutlinedIcon />}
        maxWidth="md"
        hideCloseIcon
        headerAction={
          <AppButton
            startIcon={<AddRoundedIcon />}
            onClick={handleCreate}
            sx={{ flexShrink: 0 }}
          >
            New cycle
          </AppButton>
        }
        actions={
          <AppButton
            variant="outlined"
            onClick={onClose}
            sx={{ backgroundColor: '#fff', color: 'text.primary', borderColor: 'divider' }}
          >
            Close
          </AppButton>
        }
      >
        {(error || successMessage) && (
          <Alert
            severity={error ? 'error' : 'success'}
            sx={{ mb: 2 }}
            onClose={() => {
              clearError();
              clearSuccess();
            }}
          >
            {error || successMessage}
          </Alert>
        )}

        {isLoading && !cycles.length ? (
          <AppLoader message="Loading Growth Connect cycles…" minHeight={160} />
        ) : (
          <GrowthConnectCyclesTable
            cycles={cycles}
            isMutating={isMutating}
            onEdit={handleEdit}
            onOpen={(cycle) => openCycle(cycle.id)}
            onClose={(cycle) => closeCycle(cycle.id)}
            onDelete={setDeleteTarget}
          />
        )}
      </AppModal>

      <GrowthConnectCycleModal
        open={isFormOpen}
        editingCycle={editingCycle}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isMutating}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Growth Connect cycle?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete <strong>{deleteTarget?.name}</strong>. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <AppButton variant="outlined" onClick={() => setDeleteTarget(null)} disabled={isMutating}>
            Cancel
          </AppButton>
          <AppButton color="error" onClick={handleDeleteConfirm} disabled={isMutating}>
            {isMutating ? 'Deleting…' : 'Delete'}
          </AppButton>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GrowthConnectCyclesPanel;
