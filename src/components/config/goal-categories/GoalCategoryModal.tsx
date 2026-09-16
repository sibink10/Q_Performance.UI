import { useEffect, useMemo, useState } from 'react';
import { Box, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { GoalCategoryDto } from '../../../types/goalCategory';

type GoalCategoryFormValue = {
  code: string;
  description: string;
  isActive: boolean;
};

export type GoalCategorySubmitPayload = GoalCategoryFormValue;

const emptyForm: GoalCategoryFormValue = {
  code: '',
  description: '',
  isActive: true,
};

function formFromCategory(category: GoalCategoryDto | null): GoalCategoryFormValue {
  if (!category) return emptyForm;
  return {
    code: category.code,
    description: category.description,
    isActive: category.isActive,
  };
}

type GoalCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: GoalCategorySubmitPayload) => void;
  category?: GoalCategoryDto | null;
  isSubmitting?: boolean;
};

const GoalCategoryModal = ({
  open,
  onClose,
  onSubmit,
  category = null,
  isSubmitting = false,
}: GoalCategoryModalProps) => {
  const [form, setForm] = useState<GoalCategoryFormValue>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(formFromCategory(category));
    }
  }, [open, category]);

  const canSubmit = useMemo(() => Boolean(form.code.trim()), [form]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      isActive: form.isActive,
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={category ? 'Edit Goal Category' : 'New Goal Category'}
      subtitle="Categories group goal templates (e.g. Organizational, Role, Development)."
      icon={<CategoryRoundedIcon />}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
            {category ? 'Save changes' : 'Create category'}
          </AppButton>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          size="small"
          fullWidth
          label="Code"
          placeholder="e.g. ORGANIZATIONAL"
          value={form.code}
          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
          helperText="Short unique identifier, stored in upper case."
        />

        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          label="Description"
          placeholder="What kind of goals belong to this category?"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
            }
            label="Active"
          />
        </Box>
      </Stack>
    </AppModal>
  );
};

export default GoalCategoryModal;
