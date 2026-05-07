// @ts-nocheck
// src/components/config/FocusAreas
// Admin: Create and manage performance focus areas (categories used in review forms)

import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Alert, Snackbar, TextField, FormControl, InputLabel,
  Select, MenuItem, Stack, Tooltip, TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import usePerformance from '../../hooks/usePerformance';
import AppButton from '../../components/common/AppButton';
import { AppCard, AppModal, AppLoader, PageHeader } from '../../components/common/index';
import { FOCUS_AREA_SUGGESTIONS } from '../../utils/constants';

const DEFAULT_FORM = { name: '', description: '', status: 'Active' };

const FocusAreas = () => {
  const {
    focusAreas, isLoading, isSaving, error, successMessage,
    loadFocusAreas, addFocusArea, editFocusArea, clearSuccess,
  } = usePerformance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
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
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (fa) => {
    setEditingId(fa.id);
    setForm({ name: fa.name, description: fa.description || '', status: fa.status });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Focus area name is required');
      return;
    }
    // Check duplicate name (case-insensitive)
    const duplicate = focusAreas.find(
      (f) => f.name.toLowerCase() === form.name.toLowerCase() && f.id !== editingId
    );
    if (duplicate) {
      setFormError('A focus area with this name already exists');
      return;
    }

    let result;
    if (editingId) {
      result = await editFocusArea(editingId, form);
    } else {
      result = await addFocusArea(form);
      // Refresh from server after add so latest focus areas are shown.
      if (result?.meta?.requestStatus === 'fulfilled') {
        await fetchFocusAreasPage(page, rowsPerPage);
      }
    }

    if (result?.meta?.requestStatus === 'fulfilled') {
      setModalOpen(false);
    }
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
          <AppButton startIcon={<AddIcon />} onClick={openAdd}>
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
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No focus areas defined. Click "Add Focus Area" to get started.
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
                        {fa.description || '—'}
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

      {/* Add/Edit Modal */}
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Focus Area' : 'Add Focus Area'}
        maxWidth="sm"
        actions={
          <>
            <AppButton variant="outlined" onClick={() => setModalOpen(false)}>Cancel</AppButton>
            <AppButton loading={isSaving} onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Add Focus Area'}
            </AppButton>
          </>
        }
      >
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Name with suggestions */}
          <TextField
            label="Focus Area Name *"
            value={form.name}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormError(''); }}
            fullWidth size="small"
            placeholder="e.g., Technical Skills"
          />

          {/* Quick suggestion chips */}
          {!editingId && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Quick suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {FOCUS_AREA_SUGGESTIONS.filter(
                  (s) => !focusAreas.find((f) => f.name === s)
                ).map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    variant="outlined"
                    clickable
                    onClick={() => setForm((p) => ({ ...p, name: s }))}
                  />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            label="Description (Optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            fullWidth size="small" multiline rows={2}
            placeholder="Describe what this focus area measures..."
            helperText="This description is shown to employees during self-evaluation"
          />

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={form.status} label="Status"
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </AppModal>

      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={clearSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={clearSuccess}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FocusAreas;
