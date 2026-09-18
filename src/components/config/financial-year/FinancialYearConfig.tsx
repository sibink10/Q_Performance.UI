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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AppButton from '../../common/AppButton';
import { AppCard, AppLoader, PageHeader } from '../../common';
import performanceService from '../../../services/performanceService';
import useFinancialYears from '../../../hooks/useFinancialYears';
import { getApiErrorMessage } from '../../../utils/helpers';
import FinancialYearModal from './FinancialYearModal';
import FinancialYearsTable from './FinancialYearsTable';
import GrowthConnectCyclesPanel from '../growth-connect/GrowthConnectCyclesPanel';

const FinancialYearConfig = () => {
  const { financialYears, financialYearsLoading, reloadFinancialYears } = useFinancialYears();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFinancialYear, setEditingFinancialYear] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [growthConnectReviewPeriod, setGrowthConnectReviewPeriod] = useState(null);

  const openCreateModal = () => {
    setEditingFinancialYear(null);
    setIsModalOpen(true);
  };
  const openEditModal = (row) => {
    setEditingFinancialYear(row);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingFinancialYear(null);
  };

  const saveFinancialYear = async (payload) => {
    setIsSubmitting(true);
    try {
      if (editingFinancialYear) {
        await performanceService.updateFinancialYear(editingFinancialYear.id, payload);
        setMessage('Review period updated');
      } else {
        await performanceService.createFinancialYear(payload);
        setMessage('Review period created');
      }
      await reloadFinancialYears();
      setIsModalOpen(false);
      setEditingFinancialYear(null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setIsSubmitting(false);
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
        <PageHeader
          title="Review Periods"
          subtitle="Create and manage Review Periods used across appraisal workflows."
          actions={
            <AppButton startIcon={<AddRoundedIcon />} onClick={openCreateModal}>
              New Review Period
            </AppButton>
          }
        />
        {(error || message) && (
          <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => { setError(''); setMessage(''); }}>
            {error || message}
          </Alert>
        )}

        <AppCard sx={{ p: 3 }}>
          {financialYearsLoading && !financialYears.length ? (
            <AppLoader message="Loading review periods…" minHeight={160} />
          ) : (
            <FinancialYearsTable
              financialYears={financialYears}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
              onManageGrowthConnect={setGrowthConnectReviewPeriod}
            />
          )}
        </AppCard>

        <FinancialYearModal
          open={isModalOpen}
          editingFinancialYear={editingFinancialYear}
          onClose={closeModal}
          onSubmit={saveFinancialYear}
          isSubmitting={isSubmitting}
        />

        <GrowthConnectCyclesPanel
          open={Boolean(growthConnectReviewPeriod)}
          reviewPeriod={growthConnectReviewPeriod}
          onClose={() => setGrowthConnectReviewPeriod(null)}
        />

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
