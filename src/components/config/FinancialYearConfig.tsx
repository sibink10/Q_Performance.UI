// @ts-nocheck
import { useState } from 'react';
import { Alert, Box, Chip, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AppButton from '../common/AppButton';
import { AppCard, PageHeader } from '../common';
import performanceService from '../../services/performanceService';
import useFinancialYears from '../../hooks/useFinancialYears';
import { getApiErrorMessage } from '../../utils/helpers';

const defaultFy = { name: '', startDate: null, endDate: null, isActive: false };

const FinancialYearConfig = () => {
  const { financialYears, reloadFinancialYears } = useFinancialYears();
  const [financialYearForm, setFinancialYearForm] = useState(defaultFy);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const saveFinancialYear = async () => {
    try {
      await performanceService.createFinancialYear(financialYearForm);
      setFinancialYearForm(defaultFy);
      await reloadFinancialYears();
      setMessage('Financial year created');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const deleteFinancialYear = async (id) => {
    try {
      await performanceService.deleteFinancialYear(id);
      await reloadFinancialYears();
      setMessage('Financial year deleted');
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setError(msg.includes('in use') ? 'Financial year is in use and cannot be deleted.' : msg);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <PageHeader title="Financial Years" subtitle="Create and manage financial years used across appraisal workflows." />
        {(error || message) && (
          <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => { setError(''); setMessage(''); }}>
            {error || message}
          </Alert>
        )}

        <AppCard sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField size="small" fullWidth label="Name" value={financialYearForm.name} onChange={(e) => setFinancialYearForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><DatePicker label="Start date" value={financialYearForm.startDate ? dayjs(financialYearForm.startDate) : null} onChange={(v) => setFinancialYearForm((p) => ({ ...p, startDate: v?.toISOString() }))} slotProps={{ textField: { size: 'small', fullWidth: true } }} /></Grid>
            <Grid item xs={12} md={3}><DatePicker label="End date" value={financialYearForm.endDate ? dayjs(financialYearForm.endDate) : null} onChange={(v) => setFinancialYearForm((p) => ({ ...p, endDate: v?.toISOString() }))} slotProps={{ textField: { size: 'small', fullWidth: true } }} /></Grid>
            <Grid item xs={12} md={3}><Stack direction="row" spacing={1}><AppButton onClick={saveFinancialYear}>Create</AppButton></Stack></Grid>
          </Grid>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Range</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {financialYears.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.startDate ? dayjs(row.startDate).format('MMM D, YYYY') : '—'} - {row.endDate ? dayjs(row.endDate).format('MMM D, YYYY') : '—'}</TableCell>
                    <TableCell><Chip size="small" label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right"><AppButton variant="outlined" color="error" size="small" onClick={() => deleteFinancialYear(row.id)} disabled={row.isActive}>Delete</AppButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!financialYears.length && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No financial years available yet.
            </Typography>
          )}
        </AppCard>
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialYearConfig;
