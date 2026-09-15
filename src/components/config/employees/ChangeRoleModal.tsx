import { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AppModal from '../../common/AppModal';
import AppButton from '../../common/AppButton';
import * as employeeService from '../../../services/employeeService';
import type { AssignableRole, Employee } from '../../../types/user';

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
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [roleId, setRoleId] = useState<number | ''>('');

  useEffect(() => {
    if (!open) return;
    employeeService
      .getAssignableRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
  }, [open]);

  useEffect(() => {
    if (open && employee && roles.length > 0) {
      const current = roles.find((r) => r.code === employee.role) ?? roles.find((r) => r.code === 'EMPLOYEE');
      setRoleId(current?.id ?? '');
    }
  }, [open, employee, roles]);

  if (!employee) return null;

  const selectedRole = roles.find((r) => r.id === roleId);
  const handleChange = (e: SelectChangeEvent<number>) => setRoleId(Number(e.target.value));

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
            onClick={() => selectedRole && onSubmit(selectedRole)}
            disabled={isSubmitting || !selectedRole || selectedRole.code === employee.role}
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
            value={roleId}
            onChange={handleChange}
          >
            {roles.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </AppModal>
  );
};

export default ChangeRoleModal;
