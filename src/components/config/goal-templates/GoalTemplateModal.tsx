import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { InputLabel, FormControl } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LibraryAddRoundedIcon from '@mui/icons-material/LibraryAddRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { GoalTemplate } from '../../../types/goalTemplate';
import type { GoalCategoryDto } from '../../../types/goalCategory';
import { getCategoryMeta } from '../../../utils/goalCategoryMeta';
import { formatCategoryLabel } from '../../../utils/goalConstants';

type GoalTemplateFormValue = {
  categoryId: string;
  title: string;
  description: string;
  successCriteria: string;
};

export type GoalTemplateSubmitPayload = {
  categoryId: string;
  title: string;
  description: string;
  successCriteria: string;
};

const emptyForm: GoalTemplateFormValue = {
  categoryId: '',
  title: '',
  description: '',
  successCriteria: '',
};

function formFromTemplate(template: GoalTemplate | null): GoalTemplateFormValue {
  if (!template) return emptyForm;
  return {
    categoryId: template.categoryId,
    title: template.title,
    description: template.description,
    successCriteria: template.successCriteria,
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
  categories: GoalCategoryDto[];
  isSubmitting?: boolean;
};

const GoalTemplateModal = ({
  open,
  onClose,
  onSubmit,
  template = null,
  categories,
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
    () => Boolean(form.categoryId) && Boolean(form.title.trim()),
    [form],
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      categoryId: form.categoryId,
      title: form.title.trim(),
      description: form.description.trim(),
      successCriteria: form.successCriteria.trim(),
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
                value={form.categoryId}
                onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '1.4375em',
                  },
                }}
                renderValue={(value) => {
                  const selected = categories.find((c) => c.id === value);
                  if (!selected) return '';
                  const meta = getCategoryMeta(selected.code);
                  const Icon = meta.Icon;
                  const accent = meta.accent(theme);
                  return (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Icon sx={{ fontSize: 17, color: accent.main }} />
                      <span>{formatCategoryLabel(selected.code)}</span>
                    </Stack>
                  );
                }}
              >
                {categories.map((cat) => {
                  const meta = getCategoryMeta(cat.code);
                  const Icon = meta.Icon;
                  const accent = meta.accent(theme);
                  return (
                    <MenuItem key={cat.id} value={cat.id}>
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
                        <span>{formatCategoryLabel(cat.code)}</span>
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
      </Stack>
    </AppModal>
  );
};

export default GoalTemplateModal;
