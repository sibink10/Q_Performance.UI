// @ts-nocheck
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
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import AppButton from '../common/AppButton';
import { APPRAISAL_CYCLE_TYPES, APPRAISAL_START_MONTHS, RATING_SCALES } from '../../utils/constants';

const PHASE_FIELDS = [
  ['selfEvalStart', 'Self evaluation — start'],
  ['selfEvalEnd', 'Self evaluation — end'],
  ['managerEvalStart', 'Manager evaluation — start'],
  ['managerEvalEnd', 'Manager evaluation — end'],
  ['hrReviewStart', 'HR review — start'],
  ['hrReviewEnd', 'HR review — end'],
  ['ratingPublishStart', 'Rating publish — start'],
  ['ratingPublishEnd', 'Rating publish — end'],
];

type Props = {
  open: boolean;
  title: string;
  saving: boolean;
  error: string;
  editId: string;
  financialYears: any[];
  configForm: any;
  setConfigForm: (updater: any) => void;
  onClose: () => void;
  onSave: () => void;
  clearError: () => void;
};

const AppraisalConfigModal = ({
  open,
  title,
  saving,
  error,
  editId,
  financialYears,
  configForm,
  setConfigForm,
  onClose,
  onSave,
  clearError,
}: Props) => {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth scroll="paper">
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
              <InputLabel>Financial year</InputLabel>
              <Select
                label="Financial year"
                value={configForm.financialYearId}
                onChange={(e) => setConfigForm((p: any) => ({ ...p, financialYearId: e.target.value }))}
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
                value={configForm.cycleType}
                onChange={(e) => setConfigForm((p: any) => ({ ...p, cycleType: e.target.value }))}
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
                value={configForm.startMonth}
                onChange={(e) => setConfigForm((p: any) => ({ ...p, startMonth: e.target.value }))}
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
                value={configForm.ratingScale}
                onChange={(e) => setConfigForm((p: any) => ({ ...p, ratingScale: e.target.value }))}
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
                value={configForm[key] ? dayjs(configForm[key]) : null}
                onChange={(v) => setConfigForm((p: any) => ({ ...p, [key]: v?.toISOString() ?? null }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          ))}
        </Grid>

        {/* small bottom spacing so last date field doesn't touch divider */}
        <Box sx={{ height: 4 }} />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <AppButton variant="outlined" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton onClick={onSave} disabled={saving}>
          {editId ? 'Save changes' : 'Create'}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default AppraisalConfigModal;

