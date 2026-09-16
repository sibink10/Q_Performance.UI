import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import type { Employee, UserRole } from '../../../types/user';
import AppButton from '../../common/AppButton';
import { EmptyState } from '../../common';

const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  HR: 'HR',
  ADMIN: 'Admin',
};

const ROLE_COLORS: Record<UserRole, 'default' | 'primary' | 'success' | 'warning'> = {
  EMPLOYEE: 'default',
  MANAGER: 'primary',
  HR: 'warning',
  ADMIN: 'success',
};

type EmployeesTableProps = {
  employees: Employee[];
  currentUserId?: string | null;
  onChangeRole: (employee: Employee) => void;
};

const EmployeesTable = ({ employees, currentUserId, onChangeRole }: EmployeesTableProps) => {
  if (!employees.length) {
    return <EmptyState variant="box" message="No employees found." minHeight={220} sx={{ mt: 1 }} />;
  }

  return (
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone Number</TableCell>
            <TableCell>Role</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((row) => {
            const isSelf = Boolean(currentUserId) && row.id === currentUserId;
            return (
              <TableRow key={row.id} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={ROLE_LABELS[row.role]} color={ROLE_COLORS[row.role]} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={isSelf ? "You can't change your own role" : ''}>
                    <span>
                      <AppButton
                        variant="outlined"
                        size="small"
                        disabled={isSelf}
                        onClick={() => onChangeRole(row)}
                      >
                        Change Role
                      </AppButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EmployeesTable;
