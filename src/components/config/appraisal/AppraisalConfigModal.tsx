// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import AppButton from '../../common/AppButton';
import { APPRAISAL_CYCLE_TYPES, APPRAISAL_START_MONTHS, RATING_SCALES } from '../../../utils/constants';
import { getDefaultRatingBands } from '../../../utils/helpers';
import RatingBandCard from './RatingBandCard';

const DATE_FORMAT = 'DD/MM/YYYY';

const PHASE_FIELDS = [
  ['selfEvalStart', 'Self evaluation - start'],
  ['selfEvalEnd', 'Self evaluation - end'],
  ['managerEvalStart', 'Manager evaluation - start'],
  ['managerEvalEnd', 'Manager evaluation - end'],
  ['hrReviewStart', 'HR review - start'],
  ['hrReviewEnd', 'HR review - end'],
  ['ratingPublishStart', 'Rating publish - start'],
  ['ratingPublishEnd', 'Rating publish - end'],
];

type Props = {
  open: boolean;
  title: string;
  saving: boolean;
  error: string;
  editId: string;
  financialYears: any[];
  initialForm: any;
  onClose: () => void;
  onSave: (form: any) => void;
  clearError: () => void;
};

const AppraisalConfigModal = ({
  open,
  title,
  saving,
  error,
  editId,
  financialYears,
  initialForm,
  onClose,
  onSave,
  clearError,
}: Props) => {
  const [form, setForm] = useState(initialForm);
  const isEditing = Boolean(editId);
  const bandsTouchedRef = useRef(false);
  const prevScaleRef = useRef(initialForm?.ratingScale);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      bandsTouchedRef.current = false;
      prevScaleRef.current = initialForm?.ratingScale;
    }
  }, [open, initialForm]);

  useEffect(() => {
    if (!open) return;

    const scale = Number(form?.ratingScale) || 5;
    const bands = Array.isArray(form?.ratingBands) ? form.ratingBands : [];

    if (!bands.length) {
      setForm((p: any) => ({
        ...p,
        ratingBands: getDefaultRatingBands(scale),
        ratingBandsCustomized: false,
      }));
      return;
    }

    if (!isEditing && prevScaleRef.current !== scale && !bandsTouchedRef.current) {
      setForm((p: any) => ({
        ...p,
        ratingBands: getDefaultRatingBands(scale),
        ratingBandsCustomized: false,
      }));
    }

    prevScaleRef.current = scale;
  }, [open, form?.ratingScale, form?.ratingBands?.length, isEditing]);

  const handleBandFieldChange = useCallback((index: number, field: string, value: string | number) => {
    bandsTouchedRef.current = true;
    setForm((p: any) => {
      const next = [...(p.ratingBands || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...p, ratingBands: next, ratingBandsCustomized: true };
    });
  }, []);

  const resetBandsToDefaults = () => {
    bandsTouchedRef.current = false;
    const scale = Number(form?.ratingScale) || 5;
    setForm((p: any) => ({
      ...p,
      ratingBands: getDefaultRatingBands(scale),
      ratingBandsCustomized: false,
    }));
  };

  const canSave =
    Boolean(form?.financialYearId) &&
    PHASE_FIELDS.every(([key]) => Boolean(form?.[key])) &&
    Array.isArray(form?.ratingBands) &&
    form.ratingBands.length > 0;

  const bands = Array.isArray(form?.ratingBands) ? form.ratingBands : [];

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Cycle settings
            </Typography>
            <Divider sx={{ mt: 1 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Review period</InputLabel>
              <Select
                label="Review period"
                value={form.financialYearId}
                disabled={isEditing}
                onChange={(e) => setForm((p: any) => ({ ...p, financialYearId: e.target.value }))}
              >
                {financialYears.map((y: any) => (
                  <MenuItem key={y.id} value={y.id}>
                    {y.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Cycle Type</InputLabel>
              <Select
                label="Cycle Type"
                value={form.cycleType}
                disabled={isEditing}
                onChange={(e) => setForm((p: any) => ({ ...p, cycleType: e.target.value }))}
              >
                {APPRAISAL_CYCLE_TYPES.map((c: any) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Start Month</InputLabel>
              <Select
                label="Start Month"
                value={form.startMonth}
                disabled={isEditing}
                onChange={(e) => setForm((p: any) => ({ ...p, startMonth: e.target.value }))}
              >
                {APPRAISAL_START_MONTHS.map((m: any) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Rating Scale</InputLabel>
              <Select
                label="Rating Scale"
                value={form.ratingScale}
                disabled={isEditing}
                onChange={(e) => setForm((p: any) => ({ ...p, ratingScale: e.target.value }))}
              >
                {Object.values(RATING_SCALES).map((s: any) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Result rating bands
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Map overall score ranges to the title and description shown on published results.
                  Bands must cover {form.ratingScale} steps from 0.1 to {form.ratingScale}.
                </Typography>
              </Box>
              <Tooltip title="Reset to default bands for this scale">
                <span>
                  <IconButton
                    size="small"
                    aria-label="Reset rating bands"
                    onClick={resetBandsToDefaults}
                    disabled={saving}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Stack spacing={2}>
              {bands.map((band: any, idx: number) => (
                <RatingBandCard
                  key={`band-${idx}`}
                  index={idx}
                  band={band}
                  saving={saving}
                  onFieldChange={handleBandFieldChange}
                />
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Evaluation dates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Define the window for each phase in the cycle.
            </Typography>
            <Divider sx={{ mt: 1 }} />
          </Grid>

          {PHASE_FIELDS.map(([key, label]) => (
            <Grid item xs={12} md={6} key={key}>
              <DatePicker
                label={label}
                value={form[key] ? dayjs(form[key]) : null}
                onChange={(v) => setForm((p: any) => ({ ...p, [key]: v?.toISOString() ?? null }))}
                format={DATE_FORMAT}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ height: 4 }} />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton onClick={() => onSave(form)} disabled={saving || !canSave}>
          {editId ? 'Save changes' : 'Create'}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default AppraisalConfigModal;
