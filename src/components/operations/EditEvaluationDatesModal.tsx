// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import AppButton from '../common/AppButton';

const DATE_TIME_FORMAT = 'MMM D, YYYY HH:mm';

const normalizeReason = (v: any) => String(v ?? '').trim().slice(0, 500);

const toIsoOrNull = (d: any) => {
  if (!d) return null;
  const x = dayjs(d);
  return x.isValid() ? x.toISOString() : null;
};

const parseDayjsOrNull = (iso: any) => {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d : null;
};

type Props = {
  open: boolean;
  row: any | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (payload: any) => void;
  clearError: () => void;
};

export default function EditEvaluationDatesModal({
  open,
  row,
  saving,
  error,
  onClose,
  onSave,
  clearError,
}: Props) {
  const [form, setForm] = useState(() => ({
    selfEvalStart: null,
    selfEvalEnd: null,
    managerEvalStart: null,
    managerEvalEnd: null,
    hrReviewStart: null,
    hrReviewEnd: null,
    reason: '',
  }));

  useEffect(() => {
    if (!open) return;
    setForm({
      selfEvalStart: parseDayjsOrNull(row?.selfEvalStart),
      selfEvalEnd: parseDayjsOrNull(row?.selfEvalEnd),
      managerEvalStart: parseDayjsOrNull(row?.managerEvalStart),
      managerEvalEnd: parseDayjsOrNull(row?.managerEvalEnd),
      hrReviewStart: parseDayjsOrNull(row?.hrReviewStart),
      hrReviewEnd: parseDayjsOrNull(row?.hrReviewEnd),
      reason: '',
    });
  }, [open, row]);

  const validation = useMemo(() => {
    const errs: string[] = [];
    const sS = form.selfEvalStart;
    const sE = form.selfEvalEnd;
    const mS = form.managerEvalStart;
    const mE = form.managerEvalEnd;
    const hS = form.hrReviewStart;
    const hE = form.hrReviewEnd;

    const allValid =
      [sS, sE, mS, mE, hS, hE].every((d) => d == null || dayjs(d).isValid()) &&
      (sS && sE ? !dayjs(sS).isAfter(sE) : true) &&
      (mS && mE ? !dayjs(mS).isAfter(mE) : true) &&
      (hS && hE ? !dayjs(hS).isAfter(hE) : true) &&
      (sE && mS ? !dayjs(sE).isAfter(mS) : true) &&
      (mE && hS ? !dayjs(mE).isAfter(hS) : true);

    if (sS && sE && dayjs(sS).isAfter(sE)) errs.push('Self evaluation: start must be on/before end.');
    if (mS && mE && dayjs(mS).isAfter(mE)) errs.push('Manager evaluation: start must be on/before end.');
    if (hS && hE && dayjs(hS).isAfter(hE)) errs.push('HR review: start must be on/before end.');
    if (sE && mS && dayjs(sE).isAfter(mS)) errs.push('Sequence: Self end must be on/before Manager start.');
    if (mE && hS && dayjs(mE).isAfter(hS)) errs.push('Sequence: Manager end must be on/before HR start.');

    return { ok: allValid && errs.length === 0, errs };
  }, [form]);

  const canSave = open && !!row?.id && !saving && validation.ok;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        Edit evaluation dates
        {row?.employeeName ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {row.employeeName}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        ) : null}

        {!validation.ok && validation.errs.length ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {validation.errs.map((m) => (
              <div key={m}>{m}</div>
            ))}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Self evaluation — start"
              value={form.selfEvalStart}
              onChange={(v) => setForm((p) => ({ ...p, selfEvalStart: v }))}
              format={DATE_TIME_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Self evaluation — end"
              value={form.selfEvalEnd}
              onChange={(v) => setForm((p) => ({ ...p, selfEvalEnd: v }))}
              format={DATE_TIME_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Manager evaluation — start"
              value={form.managerEvalStart}
              onChange={(v) => setForm((p) => ({ ...p, managerEvalStart: v }))}
              format={DATE_TIME_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Manager evaluation — end"
              value={form.managerEvalEnd}
              onChange={(v) => setForm((p) => ({ ...p, managerEvalEnd: v }))}
              format={DATE_TIME_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="HR review — start"
              value={form.hrReviewStart}
              onChange={(v) => setForm((p) => ({ ...p, hrReviewStart: v }))}
              format={DATE_TIME_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="HR review — end"
              value={form.hrReviewEnd}
              onChange={(v) => setForm((p) => ({ ...p, hrReviewEnd: v }))}
              format={DATE_TIME_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Reason (optional)"
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              size="small"
              fullWidth
              multiline
              minRows={2}
              inputProps={{ maxLength: 500 }}
              helperText={`${normalizeReason(form.reason).length}/500`}
            />
          </Grid>
        </Grid>

        <Box sx={{ height: 4 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton
          onClick={() => {
            onSave({
              selfEvalStart: toIsoOrNull(form.selfEvalStart),
              selfEvalEnd: toIsoOrNull(form.selfEvalEnd),
              managerEvalStart: toIsoOrNull(form.managerEvalStart),
              managerEvalEnd: toIsoOrNull(form.managerEvalEnd),
              hrReviewStart: toIsoOrNull(form.hrReviewStart),
              hrReviewEnd: toIsoOrNull(form.hrReviewEnd),
              reason: normalizeReason(form.reason) || undefined,
            });
          }}
          disabled={!canSave}
          loading={saving}
        >
          Save
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

