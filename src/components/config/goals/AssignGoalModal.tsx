import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Chip, Grid, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { InputLabel, FormControl } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { GoalCategory } from '../../../types/goal';
import type { MockUser } from '../../../types/user';
import type { PerformanceCycle } from '../../../types/performanceCycle';
import { GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';

const DATE_FORMAT = 'DD/MM/YYYY';

export type AssignGoalFormValue = {
  cycleId: string;
  category: GoalCategory | '';
  title: string;
  description: string;
  successCriteria: string;
  weight: number | '';
  startDate: string | null;
  targetDate: string | null;
};

export type AssignGoalSubmitPayload = {
  cycleId: string;
  category: GoalCategory;
  title: string;
  description: string;
  successCriteria: string;
  weight: number;
  startDate: string;
  targetDate: string;
  employeeIds: string[];
};

const defaultForm: AssignGoalFormValue = {
  cycleId: '',
  category: '',
  title: '',
  description: '',
  successCriteria: '',
  weight: '',
  startDate: null,
  targetDate: null,
};

type AssignGoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AssignGoalSubmitPayload) => void;
  employees: MockUser[];
  cycles: PerformanceCycle[];
  isSubmitting?: boolean;
};

const AssignGoalModal = ({
  open,
  onClose,
  onSubmit,
  employees,
  cycles,
  isSubmitting = false,
}: AssignGoalModalProps) => {
  const [form, setForm] = useState<AssignGoalFormValue>(defaultForm);
  const [selectedEmployees, setSelectedEmployees] = useState<MockUser[]>([]);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setSelectedEmployees([]);
    }
  }, [open]);

  const canSubmit = useMemo(
    () =>
      Boolean(form.cycleId) &&
      Boolean(form.category) &&
      Boolean(form.title.trim()) &&
      Boolean(form.startDate) &&
      Boolean(form.targetDate) &&
      new Date(form.targetDate!) >= new Date(form.startDate!) &&
      typeof form.weight === 'number' &&
      form.weight > 0 &&
      form.weight <= 100 &&
      selectedEmployees.length > 0,
    [form, selectedEmployees],
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      cycleId: form.cycleId,
      category: form.category as GoalCategory,
      title: form.title.trim(),
      description: form.description.trim(),
      successCriteria: form.successCriteria.trim(),
      weight: Number(form.weight),
      startDate: form.startDate!,
      targetDate: form.targetDate!,
      employeeIds: selectedEmployees.map((e) => e.id),
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Assign Goal"
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
            Assign Goal
          </AppButton>
        </>
      }
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Performance Cycle</InputLabel>
                <Select
                  label="Performance Cycle"
                  value={form.cycleId}
                  onChange={(e) => setForm((p) => ({ ...p, cycleId: e.target.value }))}
                >
                  {cycles.map((cycle) => (
                    <MenuItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as GoalCategory }))}
                >
                  {Object.entries(GOAL_CATEGORY_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            size="small"
            fullWidth
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />

          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label="Success criteria"
            value={form.successCriteria}
            onChange={(e) => setForm((p) => ({ ...p, successCriteria: e.target.value }))}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="Weight (%)"
                value={form.weight}
                onChange={(e) =>
                  setForm((p) => ({ ...p, weight: e.target.value === '' ? '' : Number(e.target.value) }))
                }
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Start date"
                value={form.startDate ? dayjs(form.startDate) : null}
                onChange={(v: Dayjs | null) =>
                  setForm((p) => ({ ...p, startDate: v ? v.format('YYYY-MM-DD') : null }))
                }
                format={DATE_FORMAT}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Target date"
                value={form.targetDate ? dayjs(form.targetDate) : null}
                onChange={(v: Dayjs | null) =>
                  setForm((p) => ({ ...p, targetDate: v ? v.format('YYYY-MM-DD') : null }))
                }
                format={DATE_FORMAT}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </Grid>

          <Autocomplete
            multiple
            size="small"
            options={employees}
            value={selectedEmployees}
            onChange={(_, newValue) => setSelectedEmployees(newValue)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Stack>
                  <Typography variant="body2" fontWeight={600}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.role} • {option.department}
                  </Typography>
                </Stack>
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...chipProps } = getTagProps({ index });
                return <Chip {...chipProps} key={option.id} size="small" label={option.name} />;
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="Assign to" placeholder="Select employees or managers" />
            )}
          />
        </Stack>
      </LocalizationProvider>
    </AppModal>
  );
};

export default AssignGoalModal;
