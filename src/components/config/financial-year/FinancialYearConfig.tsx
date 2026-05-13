// @ts-nocheck
import { useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AppButton from '../../common/AppButton';
import { AppCard, PageHeader } from '../../common';
import performanceService from '../../../services/performanceService';
import useFinancialYears from '../../../hooks/useFinancialYears';
import { getApiErrorMessage } from '../../../utils/helpers';
import FinancialYearForm from './FinancialYearForm';
import FinancialYearsTable from './FinancialYearsTable';

const defaultFy = { name: '', startDate: null, endDate: null, isActive: false };

const FinancialYearConfig = () => {
  const { financialYears, reloadFinancialYears } = useFinancialYears();
  const [financialYearForm, setFinancialYearForm] = useState(defaultFy);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate =
    Boolean(financialYearForm.name?.trim()) &&
    Boolean(financialYearForm.startDate) &&
    Boolean(financialYearForm.endDate);

  const saveFinancialYear = async () => {
    try {
      await performanceService.createFinancialYear(financialYearForm);
      setFinancialYearForm(defaultFy);
      await reloadFinancialYears();
      setMessage('Review period created');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const deleteFinancialYear = async (id) => {
    try {
      setIsDeleting(true);
      await performanceService.deleteFinancialYear(id);
      await reloadFinancialYears();
      setMessage('Review period deleted');
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setError(msg.includes('in use') ? 'Review period is in use and cannot be deleted.' : msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirm = (id) => setDeleteConfirmId(id);
  const closeDeleteConfirm = () => {
    if (!isDeleting) setDeleteConfirmId(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteFinancialYear(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <PageHeader title="Review Periods" subtitle="Create and manage Review Periods used across appraisal workflows." />
        {(error || message) && (
          <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => { setError(''); setMessage(''); }}>
            {error || message}
          </Alert>
        )}

        <AppCard sx={{ p: 3 }}>
          <FinancialYearForm
            value={financialYearForm}
            onChange={setFinancialYearForm}
            onCreate={saveFinancialYear}
            canCreate={canCreate}
          />
          <FinancialYearsTable financialYears={financialYears} onDelete={openDeleteConfirm} />
        </AppCard>

        <Dialog open={Boolean(deleteConfirmId)} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Review Period?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete the selected <strong>Review Period</strong>. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <AppButton variant="outlined" onClick={closeDeleteConfirm} disabled={isDeleting}>
              Cancel
            </AppButton>
            <AppButton color="error" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AppButton>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialYearConfig;
