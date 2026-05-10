// @ts-nocheck
// Admin table: review form templates (summary rows from list API)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Stack,
  Tooltip, Alert, Pagination, FormControl, InputLabel,
  Select, MenuItem, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import usePerformance from '../../../hooks/usePerformance';
import AppButton from '../../common/AppButton';
import { AppCard, AppLoader, AppSnackbar, ConfirmDialog, EmptyState, PageHeader } from '../../common/index';
import {
  getReviewFormQuestionCount,
  getReviewFormSectionCount,
} from '../../../utils/helpers';
import useFinancialYears from '../../../hooks/useFinancialYears';

const getFormId = (row) => row?.id ?? row?._id;

const ReviewFormsList = () => {
  const navigate = useNavigate();
  const {
    reviewForms, isLoading, isSaving, error, successMessage,
    loadReviewForms, deleteReviewForm, publishReviewForm, clearSuccess,
  } = usePerformance();

  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [financialYearId, setFinancialYearId] = useState('');
  const [publishStatusFilter, setPublishStatusFilter] = useState('All');
  const { financialYears, activeFinancialYear } = useFinancialYears();
  const rowsPerPage = 10;

  useEffect(() => {
    loadReviewForms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeFinancialYear?.id && !financialYearId) setFinancialYearId(activeFinancialYear.id);
  }, [activeFinancialYear, financialYearId]);

  const handleDeleteClick = (form) => {
    setDeleteTarget(form);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await deleteReviewForm(getFormId(deleteTarget));
    if (result?.meta?.requestStatus === 'fulfilled') {
      await loadReviewForms();
    }
    setDeleteTarget(null);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handlePublishClick = (form) => {
    if (!financialYearId) return;
    setPublishTarget(form);
  };

  const handlePublishConfirm = async () => {
    if (!publishTarget || !financialYearId) return;
    const result = await publishReviewForm(getFormId(publishTarget), financialYearId);
    if (result?.meta?.requestStatus === 'fulfilled') {
      await loadReviewForms();
    }
    setPublishTarget(null);
  };

  const handlePublishCancel = () => setPublishTarget(null);

  const filteredForms = reviewForms.filter((row) =>
    publishStatusFilter === 'All' ? true : (row.publishStatus ?? 'Pending') === publishStatusFilter
  );
  const paginatedForms = filteredForms.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredForms.length / rowsPerPage);

  if (isLoading) return <AppLoader />;

  return (
    <Box>
      <PageHeader
        title="Review Forms"
        subtitle="Manage configured review templates used in the performance cycle."
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="review-forms-fy-label">Review period</InputLabel>
              <Select
                labelId="review-forms-fy-label"
                label="Review period"
                value={financialYearId}
                onChange={(e) => setFinancialYearId(e.target.value)}
              >
                {financialYears.map((y) => (
                  <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="review-forms-publish-status-label">Publish status</InputLabel>
              <Select
                labelId="review-forms-publish-status-label"
                label="Publish status"
                value={publishStatusFilter}
                onChange={(e) => setPublishStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Published">Published</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>
            <AppButton startIcon={<AddIcon />} onClick={() => navigate('/config/performance/review-forms/new')}>
              Add Review Form
            </AppButton>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <AppCard variant="table">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Form Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Publish Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Sections</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Questions</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                    <EmptyState variant="folder" message='No review forms available. Click "Add Review Form" to create one.' minHeight={240} />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedForms.map((rf, idx) => (
                  <TableRow key={getFormId(rf)} hover>
                    <TableCell>{((page - 1) * rowsPerPage) + idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{rf.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={rf.publishStatus || 'Pending'}
                        color={(rf.publishStatus || 'Pending') === 'Published' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{getReviewFormSectionCount(rf)}</TableCell>
                    <TableCell align="right">{getReviewFormQuestionCount(rf)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/config/performance/review-forms/${getFormId(rf)}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            financialYearId
                              ? 'Publish assignments for this form in the selected review period'
                              : 'Select a review period to publish'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handlePublishClick(rf)}
                              disabled={!financialYearId || isSaving}
                            >
                              <CloudUploadIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(rf)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredForms.length > rowsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_e, value) => setPage(value)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </AppCard>

      <AppSnackbar open={!!successMessage} onClose={clearSuccess} message={successMessage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Review Form"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name || 'this review form'}</strong>? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        loading={isSaving}
      />

      <ConfirmDialog
        open={!!publishTarget}
        title="Publish Review Form"
        message={
          <>
            Publish assignments for <strong>{publishTarget?.name || 'this review form'}</strong> in selected review
            period? This may create or update assignments for employees.
          </>
        }
        confirmText="Publish"
        cancelText="Cancel"
        confirmColor="success"
        onConfirm={handlePublishConfirm}
        onClose={handlePublishCancel}
        loading={isSaving}
      />
    </Box>
  );
};

export default ReviewFormsList;
