import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Divider, Grid, InputAdornment, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { InputLabel, FormControl } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { GoalCategory } from '../../../types/goal';
import type { GoalTemplate } from '../../../types/goalTemplate';
import { GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';

type GoalTemplateFormValue = {
  category: GoalCategory | '';
  title: string;
  description: string;
  successCriteria: string;
  weight: number | '';
};

export type GoalTemplateSubmitPayload = {
  category: GoalCategory;
  title: string;
  description: string;
  successCriteria: string;
  weight: number;
};

const emptyForm: GoalTemplateFormValue = {
  category: '',
  title: '',
  description: '',
  successCriteria: '',
  weight: '',
};

function formFromTemplate(template: GoalTemplate | null): GoalTemplateFormValue {
  if (!template) return emptyForm;
  return {
    category: template.category,
    title: template.title,
    description: template.description,
    successCriteria: template.successCriteria,
    weight: template.weight,
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

type GoalTemplateModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: GoalTemplateSubmitPayload) => void;
  template?: GoalTemplate | null;
  isSubmitting?: boolean;
};

const GoalTemplateModal = ({
  open,
  onClose,
  onSubmit,
  template = null,
  isSubmitting = false,
}: GoalTemplateModalProps) => {
  const theme = useTheme();
  const [form, setForm] = useState<GoalTemplateFormValue>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(formFromTemplate(template));
    }
  }, [open, template]);

  const canSubmit = useMemo(
    () =>
      Boolean(form.category) &&
      Boolean(form.title.trim()) &&
      typeof form.weight === 'number' &&
      form.weight > 0 &&
      form.weight <= 100,
    [form],
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      category: form.category as GoalCategory,
      title: form.title.trim(),
      description: form.description.trim(),
      successCriteria: form.successCriteria.trim(),
      weight: Number(form.weight),
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={template ? 'Edit Goal Template' : 'New Goal Template'}
      subtitle="Define a reusable goal that admins can quickly assign later."
      icon={<LibraryAddRoundedIcon />}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
            {template ? 'Save changes' : 'Create template'}
          </AppButton>
        </>
      }
    >
      <Stack spacing={3.5}>
        <Box>
          <SectionHeader icon={<NotesRoundedIcon />} label="Template details" />
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
          <SectionHeader icon={<LibraryAddRoundedIcon />} label="Default weight" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
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
                helperText="Prefilled when this template is used — admins can adjust it per assignment."
              />
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </AppModal>
  );
};

export default GoalTemplateModal;
