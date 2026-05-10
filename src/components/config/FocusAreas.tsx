// @ts-nocheck
// src/components/config/FocusAreas
// Admin: Create and manage performance focus areas (categories used in review forms)

import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Alert, Stack, Tooltip, TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import usePerformance from '../../hooks/usePerformance';
import AppButton from '../../components/common/AppButton';
import { AppCard, AppLoader, AppSnackbar, EmptyState, PageHeader } from '../../components/common/index';
import FocusAreaFormModal, { DEFAULT_FOCUS_AREA_FORM } from './FocusAreaFormModal';

const FocusAreas = () => {
  const {
    focusAreas, isLoading, isSaving, error, successMessage,
    loadFocusAreas, addFocusArea, editFocusArea, clearSuccess,
  } = usePerformance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalInitialValues, setModalInitialValues] = useState(DEFAULT_FOCUS_AREA_FORM);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchFocusAreasPage = async (nextPage = page, nextRowsPerPage = rowsPerPage) => {
    const result = await loadFocusAreas({ page: nextPage + 1, pageSize: nextRowsPerPage });
    if (result?.meta?.requestStatus !== 'fulfilled') return result;

    const paging = result?.payload?.data || {};
    const serverPage = Number(paging.page) || (nextPage + 1);
    const serverPageSize = Number(paging.pageSize) || nextRowsPerPage;

    setPage(Math.max(0, serverPage - 1));
    setRowsPerPage(serverPageSize);
    setTotalCount(Number(paging.totalCount) || 0);
    setTotalPages(Number(paging.totalPages) || 0);
    return result;
  };

  useEffect(() => {
    fetchFocusAreasPage(0, rowsPerPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setModalInitialValues({ ...DEFAULT_FOCUS_AREA_FORM });
    setModalOpen(true);
  };

  const openEdit = (fa) => {
    setEditingId(fa.id);
    setModalInitialValues({
      name: fa.name,
      description: fa.description || '',
      status: fa.status,
    });
    setModalOpen(true);
  };

  const handleFocusAreaModalSubmit = async (payload) => {
    let result;
    if (editingId) {
      result = await editFocusArea(editingId, payload);
    } else {
      result = await addFocusArea(payload);
      if (result?.meta?.requestStatus === 'fulfilled') {
        await fetchFocusAreasPage(page, rowsPerPage);
      }
    }
    return result?.meta?.requestStatus === 'fulfilled';
  };

  const toggleStatus = async (fa) => {
    const result = await editFocusArea(fa.id, {
      ...fa,
      status: fa.status === 'Active' ? 'Inactive' : 'Active',
    });
    if (result?.meta?.requestStatus === 'fulfilled') {
      await fetchFocusAreasPage(page, rowsPerPage);
    }
  };

  const handleChangePage = (_event, newPage) => {
    fetchFocusAreasPage(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const nextRowsPerPage = parseInt(event.target.value, 10);
    fetchFocusAreasPage(0, nextRowsPerPage);
  };

  if (isLoading) return <AppLoader message="Loading focus areas..." />;

  return (
    <Box>
      <PageHeader
        title="Focus Areas"
        subtitle="Define performance categories used in review forms. Examples: Technical Skills, Communication, Leadership."
        actions={
          <AppButton
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Add Focus Area
          </AppButton>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Focus Areas Table */}
      <AppCard variant="table">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Focus Area</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {focusAreas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                    <EmptyState variant="folder" message='No focus areas defined. Click "Add Focus Area" to get started.' minHeight={240} />
                  </TableCell>
                </TableRow>
              ) : (
                focusAreas.map((fa, idx) => (
                  <TableRow key={fa.id} hover>
                    <TableCell>{(page * rowsPerPage) + idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{fa.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {fa.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fa.status}
                        color={fa.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(fa)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={fa.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => toggleStatus(fa)}>
                            {fa.status === 'Active'
                              ? <CloseIcon fontSize="small" color="error" />
                              : <CheckIcon fontSize="small" color="success" />}
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
        <TablePagination
          component="div"
          count={totalCount || focusAreas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}${totalPages ? ` (Page ${page + 1}/${totalPages})` : ''}`
          }
        />
      </AppCard>

      <FocusAreaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
        initialValues={modalInitialValues}
        focusAreas={focusAreas}
        isSaving={isSaving}
        onSubmit={handleFocusAreaModalSubmit}
      />

      <AppSnackbar open={!!successMessage} onClose={clearSuccess} message={successMessage} />
    </Box>
  );
};

export default FocusAreas;
