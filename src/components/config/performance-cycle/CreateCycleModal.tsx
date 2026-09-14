import { useEffect, useMemo, useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { CreateCyclePayload } from '../../../services/performanceCycleService';

const DATE_FORMAT = 'DD/MM/YYYY';

type CreateCycleFormValue = {
  name: string;
  startDate: string | null;
  endDate: string | null;
};

const defaultForm: CreateCycleFormValue = {
  name: '',
  startDate: null,
  endDate: null,
};

type CreateCycleModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateCyclePayload) => void;
  isSubmitting?: boolean;
  successMessage?: string | null;
};

const CreateCycleModal = ({
  open,
  onClose,
  onCreate,
  isSubmitting = false,
  successMessage,
}: CreateCycleModalProps) => {
  const [form, setForm] = useState<CreateCycleFormValue>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
    }
  }, [open]);

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
    onCreate({
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Create Performance Cycle"
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton onClick={handleCreate} disabled={!canCreate || isSubmitting} loading={isSubmitting}>
            Create Cycle
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
        </Stack>
      </LocalizationProvider>
    </AppModal>
  );
};

export default CreateCycleModal;
