import { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { AppCard, PageHeader } from '../../common';
import AppButton from '../../common/AppButton';
import ConfirmDialog from '../../common/ConfirmDialog';
import usePerformanceCycle from '../../../hooks/usePerformanceCycle';
import CycleStagesDrawer from './CycleStagesDrawer';
import CreateCycleModal from './CreateCycleModal';
import PerformanceCyclesTable from './PerformanceCyclesTable';
import type { PendingAction } from './CycleStageTimeline';

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
    activateStage,
    lockStage,
    reopenStage,
    selectCycle,
    clearError,
    clearSuccess,
  } = usePerformanceCycle();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStagesDrawerOpen, setIsStagesDrawerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const handleViewStages = (cycle: (typeof cycles)[number]) => {
    selectCycle(cycle);
    setIsStagesDrawerOpen(true);
  };

  const handleCloseStagesDrawer = () => {
    setIsStagesDrawerOpen(false);
    selectCycle(null);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'lock') {
      lockStage(pendingAction.cycleId, pendingAction.stageId);
    } else {
      reopenStage(pendingAction.cycleId, pendingAction.stageId);
    }
    setPendingAction(null);
  };

  const confirmTitle =
    pendingAction?.type === 'lock' ? 'Lock Stage?' : 'Reopen Stage?';
  const confirmMessage =
    pendingAction?.type === 'lock'
      ? `Lock "${pendingAction?.stageName}"? Employees will no longer be able to submit work for this stage until it is reopened.`
      : `Reopen "${pendingAction?.stageName}"? This will set the stage back to Active.`;

  return (
    <Box>
      <PageHeader
        title="Performance Cycles"
        subtitle="Create and manage performance cycles and their workflow stages across the organization."
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
          onViewStages={handleViewStages}
        />

        {isLoading && !cycles.length && (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            Loading performance cycles…
          </Box>
        )}
      </AppCard>

      <CreateCycleModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createCycle}
        isSubmitting={isMutating}
        successMessage={successMessage}
      />

      <CycleStagesDrawer
        open={isStagesDrawerOpen}
        cycle={selectedCycle}
        isMutating={isMutating}
        onActivate={activateStage}
        onRequestLock={setPendingAction}
        onRequestReopen={setPendingAction}
        onClose={handleCloseStagesDrawer}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={pendingAction?.type === 'lock' ? 'Lock Stage' : 'Reopen Stage'}
        confirmColor={pendingAction?.type === 'lock' ? 'error' : 'primary'}
        onConfirm={handleConfirmAction}
        onClose={() => setPendingAction(null)}
        loading={isMutating}
      />
    </Box>
  );
};

export default PerformanceCycleConfig;
