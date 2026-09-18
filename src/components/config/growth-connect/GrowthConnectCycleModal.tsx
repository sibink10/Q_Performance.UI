import { useEffect, useMemo, useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import dayjs, { type Dayjs } from 'dayjs';
import type { GrowthConnectCycle } from '../../../types/growthConnect';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';

const DATE_FORMAT = 'DD/MM/YYYY';

type GrowthConnectCycleFormValue = {
  name: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

export type GrowthConnectCycleSubmitPayload = {
  name: string;
  startDate: string;
  endDate: string;
};

const emptyForm: GrowthConnectCycleFormValue = { name: '', startDate: null, endDate: null };

type GrowthConnectCycleModalProps = {
  open: boolean;
  editingCycle?: GrowthConnectCycle | null;
  onClose: () => void;
  onSubmit: (payload: GrowthConnectCycleSubmitPayload) => void;
  isSubmitting?: boolean;
};

const GrowthConnectCycleModal = ({
  open,
  editingCycle,
  onClose,
  onSubmit,
  isSubmitting = false,
}: GrowthConnectCycleModalProps) => {
  const [form, setForm] = useState<GrowthConnectCycleFormValue>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      editingCycle
        ? {
            name: editingCycle.name,
            startDate: dayjs(editingCycle.startDate),
            endDate: dayjs(editingCycle.endDate),
          }
        : emptyForm,
    );
  }, [open, editingCycle]);

  const isRangeValid = useMemo(() => {
    if (!form.startDate || !form.endDate) return true;
    return form.endDate.isAfter(form.startDate) || form.endDate.isSame(form.startDate);
  }, [form.startDate, form.endDate]);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim()) && Boolean(form.startDate) && Boolean(form.endDate) && isRangeValid,
    [form, isRangeValid],
  );

  const handleSubmit = () => {
    if (!canSubmit || !form.startDate || !form.endDate) return;
    onSubmit({
      name: form.name.trim(),
      startDate: form.startDate.toISOString(),
      endDate: form.endDate.toISOString(),
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={editingCycle ? 'Edit Growth Connect Cycle' : 'New Growth Connect Cycle'}
      subtitle="Define the name and date range for this cycle within the review period."
      icon={<TimelineOutlinedIcon />}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
            {editingCycle ? 'Save changes' : 'Create cycle'}
          </AppButton>
        </>
      }
    >
      <Stack spacing={2.5}>
        <TextField
          autoFocus
          fullWidth
          label="Name"
          placeholder="e.g. Growth Connect 1"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          helperText="A clear, unique name for this cycle within the review period."
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <DatePicker
            label="Start date"
            value={form.startDate}
            onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
            format={DATE_FORMAT}
            sx={{ flex: 1 }}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <DatePicker
            label="End date"
            value={form.endDate}
            onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
            format={DATE_FORMAT}
            minDate={form.startDate ?? undefined}
            sx={{ flex: 1 }}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !isRangeValid,
                helperText: !isRangeValid ? 'End date must be on or after the start date.' : ' ',
              },
            }}
          />
        </Stack>
      </Stack>
    </AppModal>
  );
};

export default GrowthConnectCycleModal;
