import { useEffect, useMemo, useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import dayjs, { type Dayjs } from 'dayjs';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';

const DATE_FORMAT = 'DD/MM/YYYY';

type FinancialYearFormValue = {
  name: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

export type FinancialYearSubmitPayload = {
  name: string;
  startDate: string;
  endDate: string;
};

const emptyForm: FinancialYearFormValue = {
  name: '',
  startDate: null,
  endDate: null,
};

type FinancialYearModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: FinancialYearSubmitPayload) => void;
  isSubmitting?: boolean;
};

const FinancialYearModal = ({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: FinancialYearModalProps) => {
  const [form, setForm] = useState<FinancialYearFormValue>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
    }
  }, [open]);

  const isRangeValid = useMemo(() => {
    if (!form.startDate || !form.endDate) return true;
    return form.endDate.isAfter(form.startDate) || form.endDate.isSame(form.startDate);
  }, [form.startDate, form.endDate]);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim()) && Boolean(form.startDate) && Boolean(form.endDate) && isRangeValid,
    [form, isRangeValid]
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
      title="New Review Period"
      subtitle="Define the name and date range for a review period used across appraisal workflows."
      icon={<CalendarMonthRoundedIcon />}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
            Create review period
          </AppButton>
        </>
      }
    >
      <Stack spacing={2.5}>
        <TextField
          autoFocus
          fullWidth
          label="Name"
          placeholder="e.g. FY 2026-2027"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          helperText="A clear, unique name for this review period."
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

export default FinancialYearModal;
