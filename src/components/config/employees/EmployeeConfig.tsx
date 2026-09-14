import { useEffect, useState, type ChangeEvent } from 'react';
import { Alert, Box } from '@mui/material';
import { AppCard, AppPagination, PageHeader } from '../../common';
import AppInput from '../../common/AppInput';
import * as employeeService from '../../../services/employeeService';
import useAuth from '../../../hooks/useAuth';
import type { AssignableRole, Employee } from '../../../types/user';
import EmployeesTable from './EmployeesTable';
import ChangeRoleModal from './ChangeRoleModal';

const DEFAULT_PAGE_SIZE = 20;

const EmployeeConfig = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    employeeService
      .getAllEmployees({ page, pageSize, search: debouncedSearch })
      .then((result) => {
        setEmployees(result.employees);
        setTotalCount(result.totalCount);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load employees.'));
  }, [page, pageSize, debouncedSearch]);

  const handleRoleChange = async (role: AssignableRole) => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await employeeService.updateEmployeeRole(selectedEmployee.id, role);
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSuccessMessage(`${updated.name}'s role was changed to ${role.charAt(0)}${role.slice(1).toLowerCase()}.`);
      setSelectedEmployee(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Employees"
        subtitle="View everyone in the org and manage their role."
        actions={
          <AppInput
            label="Search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />
        }
      />

      {(error || successMessage) && (
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => {
            setError(null);
            setSuccessMessage(null);
          }}
        >
          {error || successMessage}
        </Alert>
      )}

      <AppCard sx={{ p: 3 }}>
        <EmployeesTable
          employees={employees}
          currentUserId={user?.id ?? null}
          onChangeRole={setSelectedEmployee}
        />
        <AppPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </AppCard>

      <ChangeRoleModal
        open={Boolean(selectedEmployee)}
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onSubmit={handleRoleChange}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
};

export default EmployeeConfig;
