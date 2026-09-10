import { useEffect, useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AppCard, PageHeader } from '../../common';
import ConfirmDialog from '../../common/ConfirmDialog';
import usePerformanceCycle from '../../../hooks/usePerformanceCycle';
import CycleStageTimeline, { type PendingAction } from './CycleStageTimeline';
import PerformanceCycleForm, { type PerformanceCycleFormValue } from './PerformanceCycleForm';
import PerformanceCyclesTable from './PerformanceCyclesTable';

const defaultForm: PerformanceCycleFormValue = {
  name: '',
  startDate: null,
  endDate: null,
};

const PerformanceCycleConfig = () => {
  const {
    cycles,
    selectedCycle,
    isLoading,
    isMutating,
    error,
    successMessage,
    createCycle,
    activateStage,
    lockStage,
    reopenStage,
    selectCycle,
    clearError,
    clearSuccess,
  } = usePerformanceCycle();

  const [form, setForm] = useState<PerformanceCycleFormValue>(defaultForm);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const canCreate = useMemo(
    () =>
      Boolean(form.name.trim()) &&
      Boolean(form.startDate) &&
      Boolean(form.endDate) &&
      new Date(form.endDate!) >= new Date(form.startDate!),
    [form],
  );

  useEffect(() => {
    if (successMessage && !isMutating) {
      setForm(defaultForm);
    }
  }, [successMessage, isMutating]);

  const handleCreate = () => {
    if (!canCreate || !form.startDate || !form.endDate) return;
    createCycle({
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    });
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <PageHeader
          title="Performance Cycles"
          subtitle="Create and manage performance cycles and their workflow stages across the organization."
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
          <PerformanceCycleForm
            value={form}
            onChange={setForm}
            onCreate={handleCreate}
            canCreate={canCreate}
            isSubmitting={isMutating}
          />

          <PerformanceCyclesTable
            cycles={cycles}
            selectedCycleId={selectedCycle?.id ?? null}
            onSelectCycle={(cycle) => selectCycle(cycle)}
          />

          {selectedCycle && (
            <CycleStageTimeline
              cycle={selectedCycle}
              isMutating={isMutating}
              onActivate={activateStage}
              onRequestLock={setPendingAction}
              onRequestReopen={setPendingAction}
            />
          )}

          {isLoading && !cycles.length && (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              Loading performance cycles…
            </Box>
          )}
        </AppCard>

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
    </LocalizationProvider>
  );
};

export default PerformanceCycleConfig;
