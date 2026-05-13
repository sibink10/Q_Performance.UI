// @ts-nocheck
// Shared Add/Edit Focus Area modal — used by FocusAreas admin and ReviewFormEditor

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AppButton from '../../common/AppButton';
import { AppModal } from '../../common/index';
import { FOCUS_AREA_SUGGESTIONS } from '../../../utils/constants';

export const DEFAULT_FOCUS_AREA_FORM = { name: '', description: '', status: 'Active' };

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string|number|null} props.editingId — null = add mode
 * @param {{ name: string, description: string, status: string }} props.initialValues
 * @param {Array<{ id?: unknown, name: string }>} props.focusAreas — duplicate check & suggestions
 * @param {boolean} props.isSaving
 * @param {(values: typeof DEFAULT_FOCUS_AREA_FORM) => Promise<boolean>} props.onSubmit — resolve true on success (modal closes)
 */
const FocusAreaFormModal = ({
  open,
  onClose,
  editingId,
  initialValues,
  focusAreas,
  isSaving,
  onSubmit,
}) => {
  const list = Array.isArray(focusAreas) ? focusAreas : [];
  const [form, setForm] = useState(() => ({ ...DEFAULT_FOCUS_AREA_FORM, ...initialValues }));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      status: initialValues?.status ?? 'Active',
    });
    setFormError('');
  }, [open, editingId, initialValues?.name, initialValues?.description, initialValues?.status]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Focus area name is required');
      return;
    }
    const duplicate = list.find(
      (f) => f.name.toLowerCase() === form.name.trim().toLowerCase() && f.id !== editingId
    );
    if (duplicate) {
      setFormError('A focus area with this name already exists');
      return;
    }

    const ok = await onSubmit({
      name: form.name.trim(),
      description: form.description?.trim() ?? '',
      status: form.status,
    });
    if (ok) onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit Focus Area' : 'Add Focus Area'}
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton loading={isSaving} onClick={handleSave}>
            {editingId ? 'Save Changes' : 'Add Focus Area'}
          </AppButton>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {formError && <Alert severity="error">{formError}</Alert>}

        <TextField
          label="Focus Area Name *"
          value={form.name}
          onChange={(e) => {
            setForm((p) => ({ ...p, name: e.target.value }));
            setFormError('');
          }}
          fullWidth
          size="small"
          placeholder="e.g., Technical Skills"
        />

        {!editingId && (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Quick suggestions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {FOCUS_AREA_SUGGESTIONS.filter((s) => !list.some((f) => f.name === s)).map((s) => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => setForm((p) => ({ ...p, name: s }))}
                />
              ))}
            </Box>
          </Box>
        )}

        <TextField
          label="Description (Optional)"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          fullWidth
          size="small"
          multiline
          rows={2}
          placeholder="Describe what this focus area measures..."
          helperText="This description is shown to employees during self-evaluation"
        />

        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={form.status}
            label="Status"
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </AppModal>
  );
};

export default FocusAreaFormModal;
