import { useEffect, useMemo, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { CreateCyclePayload, UpdateCyclePayload } from '../../../services/performanceCycleService';
import type { PerformanceCycle, PerformanceCycleStatus } from '../../../types/performanceCycle';

const DATE_FORMAT = 'DD/MM/YYYY';

const CYCLE_STATUS_OPTIONS: { value: PerformanceCycleStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

type CreateCycleFormValue = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: PerformanceCycleStatus;
};

const defaultForm: CreateCycleFormValue = {
  name: '',
  startDate: null,
  endDate: null,
  status: 'DRAFT',
};

type CreateCycleModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateCyclePayload | UpdateCyclePayload) => void;
  isSubmitting?: boolean;
  successMessage?: string | null;
  cycle?: PerformanceCycle | null;
};

const CreateCycleModal = ({
  open,
  onClose,
  onCreate,
  isSubmitting = false,
  successMessage,
  cycle = null,
}: CreateCycleModalProps) => {
  const isEditMode = Boolean(cycle);
  const [form, setForm] = useState<CreateCycleFormValue>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm(
        cycle
          ? { name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate, status: cycle.status }
          : defaultForm,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cycle]);

  useEffect(() => {
    if (successMessage && !isSubmitting && open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, isSubmitting]);

  const canCreate = useMemo(
    () =>
      Boolean(form.name.trim()) &&
      Boolean(form.startDate) &&
      Boolean(form.endDate) &&
      new Date(form.endDate!) >= new Date(form.startDate!),
    [form],
  );

  const handleCreate = () => {
    if (!canCreate || !form.startDate || !form.endDate) return;
    if (isEditMode) {
      onCreate({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      });
    } else {
      onCreate({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      });
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Performance Cycle' : 'Create Performance Cycle'}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton onClick={handleCreate} disabled={!canCreate || isSubmitting} loading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Cycle'}
          </AppButton>
        </>
      }
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <TextField
            size="small"
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            autoFocus
          />
          <DatePicker
            label="Start date"
            value={form.startDate ? dayjs(form.startDate) : null}
            onChange={(v: Dayjs | null) =>
              setForm((p) => ({ ...p, startDate: v ? v.format('YYYY-MM-DD') : null }))
            }
            format={DATE_FORMAT}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label="End date"
            value={form.endDate ? dayjs(form.endDate) : null}
            onChange={(v: Dayjs | null) =>
              setForm((p) => ({ ...p, endDate: v ? v.format('YYYY-MM-DD') : null }))
            }
            format={DATE_FORMAT}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          {isEditMode && (
            <FormControl size="small" fullWidth>
              <InputLabel id="cycle-status-label">Status</InputLabel>
              <Select
                labelId="cycle-status-label"
                label="Status"
                value={form.status}
                onChange={(e: SelectChangeEvent<PerformanceCycleStatus>) =>
                  setForm((p) => ({ ...p, status: e.target.value as PerformanceCycleStatus }))
                }
              >
                {CYCLE_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </LocalizationProvider>
    </AppModal>
  );
};

export default CreateCycleModal;
