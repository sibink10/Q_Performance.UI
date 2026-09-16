import { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { AppCard, AppLoader, PageHeader } from '../../common';
import AppButton from '../../common/AppButton';
import ConfirmDialog from '../../common/ConfirmDialog';
import usePerformanceCycle from '../../../hooks/usePerformanceCycle';
import type { UpdateCyclePayload } from '../../../services/performanceCycleService';
import CreateCycleModal from './CreateCycleModal';
import PerformanceCyclesTable from './PerformanceCyclesTable';
import type { PerformanceCycle } from '../../../types/performanceCycle';

const PerformanceCycleConfig = () => {
  const {
    cycles,
    selectedCycle,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadCycles,
    createCycle,
    updateCycle,
    deleteCycle,
    selectCycle,
    clearError,
    clearSuccess,
  } = usePerformanceCycle();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PerformanceCycle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PerformanceCycle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const handleEditCycle = (cycle: PerformanceCycle) => {
    setEditingCycle(cycle);
  };

  const handleCloseEditModal = () => {
    setEditingCycle(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCycle(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Performance Cycles"
        subtitle="Create and manage performance cycles across the organization."
        actions={
          <AppButton startIcon={<AddRoundedIcon />} onClick={() => setIsCreateModalOpen(true)}>
            Create Cycle
          </AppButton>
        }
      />

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

      <AppCard sx={{ p: 3 }}>
        <PerformanceCyclesTable
          cycles={cycles}
          selectedCycleId={selectedCycle?.id ?? null}
          onSelectCycle={(cycle) => selectCycle(cycle)}
          onEditCycle={handleEditCycle}
          onDeleteCycle={setDeleteTarget}
        />

        {isLoading && !cycles.length && (
          <AppLoader message="Loading performance cycles…" minHeight={160} />
        )}
      </AppCard>

      <CreateCycleModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createCycle}
        isSubmitting={isMutating}
        successMessage={successMessage}
      />

      <CreateCycleModal
        open={Boolean(editingCycle)}
        onClose={handleCloseEditModal}
        onCreate={(payload) =>
          editingCycle && updateCycle(editingCycle.id, payload as UpdateCyclePayload)
        }
        isSubmitting={isMutating}
        successMessage={successMessage}
        cycle={editingCycle}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Performance Cycle"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This action can't be undone.`
            : 'Are you sure you want to delete this performance cycle?'
        }
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </Box>
  );
};

export default PerformanceCycleConfig;
