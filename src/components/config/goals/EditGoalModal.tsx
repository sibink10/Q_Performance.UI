import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Divider, Grid, InputAdornment, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { InputLabel, FormControl } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs, { type Dayjs } from 'dayjs';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { Goal, GoalCategory } from '../../../types/goal';
import { GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';

const DATE_FORMAT = 'DD/MM/YYYY';

type EditGoalFormValue = {
  category: GoalCategory | '';
  title: string;
  description: string;
  successCriteria: string;
  weight: number | '';
  startDate: string | null;
  targetDate: string | null;
};

export type EditGoalSubmitPayload = {
  category: GoalCategory;
  title: string;
  description: string;
  successCriteria: string;
  weight: number;
  startDate: string;
  targetDate: string;
};

const emptyForm: EditGoalFormValue = {
  category: '',
  title: '',
  description: '',
  successCriteria: '',
  weight: '',
  startDate: null,
  targetDate: null,
};

function formFromGoal(goal: Goal | null): EditGoalFormValue {
  if (!goal) return emptyForm;
  return {
    category: goal.category,
    title: goal.title,
    description: goal.description,
    successCriteria: goal.successCriteria,
    weight: goal.weight,
    startDate: goal.startDate,
    targetDate: goal.targetDate,
  };
}

type SectionHeaderProps = { icon: ReactNode; label: string };

const SectionHeader = ({ icon, label }: SectionHeaderProps) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: 'primary.main',
        '& svg': { fontSize: 16 },
      }}
    >
      {icon}
    </Box>
    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
      {label}
    </Typography>
  </Stack>
);

type EditGoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: EditGoalSubmitPayload) => void;
  goal: Goal | null;
  employeeName?: string;
  cycleName?: string;
  isSubmitting?: boolean;
};

const EditGoalModal = ({
  open,
  onClose,
  onSubmit,
  goal,
  employeeName,
  cycleName,
  isSubmitting = false,
}: EditGoalModalProps) => {
  const theme = useTheme();
  const [form, setForm] = useState<EditGoalFormValue>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(formFromGoal(goal));
    }
  }, [open, goal]);

  const dateOrderInvalid = useMemo(
    () =>
      Boolean(form.startDate) &&
      Boolean(form.targetDate) &&
      new Date(form.targetDate!) < new Date(form.startDate!),
    [form.startDate, form.targetDate],
  );

  const canSubmit = useMemo(
    () =>
      Boolean(form.category) &&
      Boolean(form.title.trim()) &&
      Boolean(form.startDate) &&
      Boolean(form.targetDate) &&
      !dateOrderInvalid &&
      typeof form.weight === 'number' &&
      form.weight > 0 &&
      form.weight <= 100,
    [form, dateOrderInvalid],
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      category: form.category as GoalCategory,
      title: form.title.trim(),
      description: form.description.trim(),
      successCriteria: form.successCriteria.trim(),
      weight: Number(form.weight),
      startDate: form.startDate!,
      targetDate: form.targetDate!,
    });
  };

  const contextLine = [employeeName, cycleName].filter(Boolean).join(' · ');

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Goal"
      subtitle={contextLine || 'Update the details for this goal.'}
      icon={<EditRoundedIcon />}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
            Save changes
          </AppButton>
        </>
      }
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={3.5}>
          <Box>
            <SectionHeader icon={<NotesRoundedIcon />} label="Goal details" />
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as GoalCategory }))}
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '1.4375em',
                    },
                  }}
                  renderValue={(value) => {
                    if (!value) return '';
                    const meta = GOAL_CATEGORY_META[value as GoalCategory];
                    const Icon = meta.Icon;
                    const accent = meta.accent(theme);
                    return (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Icon sx={{ fontSize: 17, color: accent.main }} />
                        <span>{GOAL_CATEGORY_LABELS[value as GoalCategory]}</span>
                      </Stack>
                    );
                  }}
                >
                  {Object.entries(GOAL_CATEGORY_LABELS).map(([value, label]) => {
                    const meta = GOAL_CATEGORY_META[value as GoalCategory];
                    const Icon = meta.Icon;
                    const accent = meta.accent(theme);
                    return (
                      <MenuItem key={value} value={value}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: accent.soft,
                            }}
                          >
                            <Icon sx={{ fontSize: 15, color: accent.main }} />
                          </Box>
                          <span>{label}</span>
                        </Stack>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                size="small"
                fullWidth
                label="Title"
                placeholder="e.g. Improve customer response time"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />

              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                label="Description"
                placeholder="What should this goal accomplish?"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />

              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                label="Success criteria"
                placeholder="How will success be measured?"
                value={form.successCriteria}
                onChange={(e) => setForm((p) => ({ ...p, successCriteria: e.target.value }))}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <SectionHeader icon={<EventRoundedIcon />} label="Timeline & weight" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label="Weight"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, weight: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
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
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: dateOrderInvalid,
                    },
                  }}
                />
              </Grid>
            </Grid>
            {dateOrderInvalid && (
              <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                Target date must be on or after the start date.
              </Typography>
            )}
          </Box>
        </Stack>
      </LocalizationProvider>
    </AppModal>
  );
};

export default EditGoalModal;
