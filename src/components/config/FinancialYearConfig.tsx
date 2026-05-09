// @ts-nocheck
import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AppButton from '../common/AppButton';
import { AppCard, EmptyState, PageHeader } from '../common';
import performanceService from '../../services/performanceService';
import useFinancialYears from '../../hooks/useFinancialYears';
import { getApiErrorMessage } from '../../utils/helpers';

const defaultFy = { name: '', startDate: null, endDate: null, isActive: false };
const DATE_FORMAT = 'DD/MM/YYYY';

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
        <PageHeader title="Review Periods" subtitle="Create and manage review periods used across appraisal workflows." />
        {(error || message) && (
          <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => { setError(''); setMessage(''); }}>
            {error || message}
          </Alert>
        )}

        <AppCard sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Name"
                value={financialYearForm.name}
                onChange={(e) => setFinancialYearForm((p) => ({ ...p, name: e.target.value }))}
                sx={{
                }}
                inputProps={{ style: { fontSize: 13 } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start date"
                value={financialYearForm.startDate ? dayjs(financialYearForm.startDate) : null}
                onChange={(v) => setFinancialYearForm((p) => ({ ...p, startDate: v?.toISOString() }))}
                format={DATE_FORMAT}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& input': { fontSize: 13 },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End date"
                value={financialYearForm.endDate ? dayjs(financialYearForm.endDate) : null}
                onChange={(v) => setFinancialYearForm((p) => ({ ...p, endDate: v?.toISOString() }))}
                format={DATE_FORMAT}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                     
                      '& input': { fontSize: 13 },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <AppButton onClick={saveFinancialYear} disabled={!canCreate}>
                  Create
                </AppButton>
              </Stack>
            </Grid>
          </Grid>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Range</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {financialYears.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.startDate ? dayjs(row.startDate).format(DATE_FORMAT) : '-'} - {row.endDate ? dayjs(row.endDate).format(DATE_FORMAT) : '-'}</TableCell>
                    <TableCell><Chip size="small" label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right">
                      <AppButton
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => openDeleteConfirm(row.id)}
                      >
                        Delete
                      </AppButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!financialYears.length && (
            <EmptyState variant="box" message="No review periods available yet." minHeight={220} sx={{ mt: 1 }} />
          )}
        </AppCard>

        <Dialog open={Boolean(deleteConfirmId)} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
          <DialogTitle>Delete review period?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete the selected <strong>review period</strong>. This action cannot be undone.
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
