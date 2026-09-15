import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { InputLabel, FormControl } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs, { type Dayjs } from 'dayjs';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { GoalCategory } from '../../../types/goal';
import type { GoalTemplate } from '../../../types/goalTemplate';
import type { MockUser } from '../../../types/user';
import type { PerformanceCycle } from '../../../types/performanceCycle';
import { GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
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

type AssignGoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AssignGoalSubmitPayload) => void;
  employees: MockUser[];
  cycles: PerformanceCycle[];
  templates?: GoalTemplate[];
  isSubmitting?: boolean;
};

const AssignGoalModal = ({
  open,
  onClose,
  onSubmit,
  employees,
  cycles,
  templates = [],
  isSubmitting = false,
}: AssignGoalModalProps) => {
  const theme = useTheme();
  const [form, setForm] = useState<AssignGoalFormValue>(defaultForm);
  const [selectedEmployees, setSelectedEmployees] = useState<MockUser[]>([]);
  const [goalSource, setGoalSource] = useState<'CUSTOM' | 'TEMPLATE'>('CUSTOM');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setSelectedEmployees([]);
      setGoalSource('CUSTOM');
      setSelectedTemplate(null);
    }
  }, [open]);

  const handleGoalSourceChange = (nextSource: 'CUSTOM' | 'TEMPLATE' | null) => {
    if (!nextSource) return;
    setGoalSource(nextSource);
    if (nextSource === 'CUSTOM') {
      setSelectedTemplate(null);
      setForm((p) => ({
        ...p,
        category: '',
        title: '',
        description: '',
        successCriteria: '',
        weight: '',
      }));
    }
  };

  const handleTemplateSelect = (template: GoalTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setForm((p) => ({
        ...p,
        category: template.category,
        title: template.title,
        description: template.description,
        successCriteria: template.successCriteria,
        weight: template.weight,
      }));
    }
  };

  const dateOrderInvalid = useMemo(
    () =>
      Boolean(form.startDate) &&
      Boolean(form.targetDate) &&
      new Date(form.targetDate!) < new Date(form.startDate!),
    [form.startDate, form.targetDate],
  );

  const canSubmit = useMemo(
    () =>
      Boolean(form.cycleId) &&
      Boolean(form.category) &&
      Boolean(form.title.trim()) &&
      Boolean(form.startDate) &&
      Boolean(form.targetDate) &&
      !dateOrderInvalid &&
      typeof form.weight === 'number' &&
      form.weight > 0 &&
      form.weight <= 100 &&
      selectedEmployees.length > 0,
    [form, selectedEmployees, dateOrderInvalid],
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

  const categoryAccent = form.category ? GOAL_CATEGORY_META[form.category].accent(theme) : null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Assign Goal"
      subtitle="Create a performance goal and assign it to one or more people."
      icon={<FlagRoundedIcon />}
      maxWidth="md"
      paperSx={{ maxWidth: 640 }}
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
        <Stack spacing={3.5}>
          <Box>
            <SectionHeader icon={<NotesRoundedIcon />} label="Goal details" />
            <Stack spacing={2}>
              {templates.length > 0 && (
                <Box>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    fullWidth
                    value={goalSource}
                    onChange={(_, value) => handleGoalSourceChange(value)}
                    sx={{
                      mb: goalSource === 'TEMPLATE' ? 1.5 : 0,
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        gap: 0.75,
                      },
                    }}
                  >
                    <ToggleButton value="CUSTOM">
                      <EditRoundedIcon sx={{ fontSize: 17 }} />
                      Custom goal
                    </ToggleButton>
                    <ToggleButton value="TEMPLATE">
                      <LibraryBooksRoundedIcon sx={{ fontSize: 17 }} />
                      Use a template
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {goalSource === 'TEMPLATE' && (
                    <Autocomplete
                      size="small"
                      options={templates}
                      value={selectedTemplate}
                      onChange={(_, newValue) => handleTemplateSelect(newValue)}
                      groupBy={(option) => GOAL_CATEGORY_LABELS[option.category]}
                      getOptionLabel={(option) => option.title}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderOption={(props, option) => {
                        const meta = GOAL_CATEGORY_META[option.category];
                        const Icon = meta.Icon;
                        const accent = meta.accent(theme);
                        return (
                          <li {...props} key={option.id}>
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: '100%', py: 0.25 }}>
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  flexShrink: 0,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: accent.soft,
                                }}
                              >
                                <Icon sx={{ fontSize: 15, color: accent.main }} />
                              </Box>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                                {option.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={`${option.weight}%`}
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: accent.soft,
                                  color: accent.main,
                                }}
                              />
                            </Stack>
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Goal template" placeholder="Search templates…" />
                      )}
                    />
                  )}
                </Box>
              )}

              <Box>
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
                  </Grid>
                </Grid>
              </Box>

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

          <Divider />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <SectionHeader icon={<GroupsRoundedIcon />} label="Assign to" />
              {selectedEmployees.length > 0 && (
                <Chip
                  size="small"
                  label={`${selectedEmployees.length} selected`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: categoryAccent ? categoryAccent.soft : alpha(theme.palette.primary.main, 0.1),
                    color: categoryAccent ? categoryAccent.main : theme.palette.primary.dark,
                  }}
                />
              )}
            </Stack>
            <Autocomplete
              multiple
              size="small"
              options={employees}
              value={selectedEmployees}
              onChange={(_, newValue) => setSelectedEmployees(newValue)}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              componentsProps={{
                popper: {
                  placement: 'top-start',
                  modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
                },
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.25 }}>
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.dark,
                      }}
                    >
                      {getInitials(option.name)}
                    </Avatar>
                    <Stack sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {option.role} • {option.department}
                      </Typography>
                    </Stack>
                  </Stack>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      {...chipProps}
                      key={option.id}
                      size="small"
                      avatar={
                        <Avatar sx={{ bgcolor: 'transparent !important', color: 'inherit', fontSize: '0.65rem', fontWeight: 700 }}>
                          {getInitials(option.name)}
                        </Avatar>
                      }
                      label={option.name}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.dark,
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Employees or managers" placeholder="Search people…" />
              )}
            />
          </Box>
        </Stack>
      </LocalizationProvider>
    </AppModal>
  );
};

export default AssignGoalModal;
