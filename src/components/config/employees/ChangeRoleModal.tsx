import { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import type { AssignableRole, Employee } from '../../../types/user';

const ROLE_OPTIONS: { value: AssignableRole; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

type ChangeRoleModalProps = {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (role: AssignableRole) => void;
  isSubmitting?: boolean;
};

const ChangeRoleModal = ({
  open,
  employee,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ChangeRoleModalProps) => {
  const [role, setRole] = useState<AssignableRole>('EMPLOYEE');

  useEffect(() => {
    if (open && employee) {
      const current = employee.role === 'ADMIN' || employee.role === 'MANAGER' ? employee.role : 'EMPLOYEE';
      setRole(current);
    }
  }, [open, employee]);

  if (!employee) return null;

  const handleChange = (e: SelectChangeEvent) => setRole(e.target.value as AssignableRole);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Change Role"
      maxWidth="xs"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            onClick={() => onSubmit(role)}
            disabled={isSubmitting || role === employee.role}
            loading={isSubmitting}
          >
            Save
          </AppButton>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ mt: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {employee.name} &middot; {employee.email}
        </Typography>
        <FormControl size="small" fullWidth>
          <InputLabel id="change-role-select-label">Role</InputLabel>
          <Select
            labelId="change-role-select-label"
            label="Role"
            value={role}
            onChange={handleChange}
          >
            {ROLE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </AppModal>
  );
};

export default ChangeRoleModal;
