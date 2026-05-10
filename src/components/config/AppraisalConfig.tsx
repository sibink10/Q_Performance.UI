// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AppButton from '../common/AppButton';
import { AppCard, EmptyState, PageHeader } from '../common';
import performanceService from '../../services/performanceService';
import useFinancialYears from '../../hooks/useFinancialYears';
import { getApiErrorMessage, toArrayFromPayload } from '../../utils/helpers';
import AppraisalConfigModal from './AppraisalConfigModal';

const defaultCfg = {
  financialYearId: '',
  startMonth: 4,
  cycleType: 'ANNUAL',
  ratingScale: 5,
  selfEvalStart: null,
  selfEvalEnd: null,
  managerEvalStart: null,
  managerEvalEnd: null,
  hrReviewStart: null,
  hrReviewEnd: null,
  ratingPublishStart: null,
  ratingPublishEnd: null,
};

const AppraisalConfig = () => {
  const { financialYears } = useFinancialYears();
  const [configs, setConfigs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState(defaultCfg);
  const [editConfigId, setEditConfigId] = useState('');
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);

  const loadConfigs = async () => {
    try {
      const payload = await performanceService.getAllAppraisalConfigs();
      setConfigs(toArrayFromPayload(payload));
    } catch (e) {
      setPageError(getApiErrorMessage(e));
      setConfigs([]);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const dismissPageAlerts = () => {
    setPageError('');
    setPageSuccess('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditConfigId('');
    setConfigForm(defaultCfg);
    setFormError('');
    setModalSaving(false);
  };

  const openAddModal = () => {
    setFormError('');
    setEditConfigId('');
    setConfigForm(defaultCfg);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setFormError('');
    setEditConfigId(row.id);
    setConfigForm({ ...defaultCfg, ...row });
    setModalOpen(true);
  };

  const saveConfig = async () => {
    setFormError('');
    setModalSaving(true);
    try {
      const payload = { ...configForm, financialYearId: configForm.financialYearId };
      if (editConfigId) {
        await performanceService.updateAppraisalConfig(editConfigId, payload);
      } else {
        await performanceService.createAppraisalConfig(payload);
      }
      setPageError('');
      setPageSuccess(editConfigId ? 'Config updated' : 'Config created');
      closeModal();
      await loadConfigs();
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    } finally {
      setModalSaving(false);
    }
  };

  const deleteConfig = async (id) => {
    try {
      await performanceService.deleteAppraisalConfig(id);
      setPageSuccess('Config deleted');
      setPageError('');
      await loadConfigs();
    } catch (e) {
      setPageError(getApiErrorMessage(e));
      setPageSuccess('');
    }
  };

  const requestDelete = (id) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteSaving) return;
    setDeleteConfirmOpen(false);
    setDeleteTargetId('');
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteSaving(true);
    try {
      await deleteConfig(deleteTargetId);
      setDeleteConfirmOpen(false);
      setDeleteTargetId('');
    } finally {
      setDeleteSaving(false);
    }
  };

  const modalTitle = editConfigId ? 'Edit appraisal config' : 'Add appraisal config';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <PageHeader
          title="Appraisal Config"
          subtitle="Manage appraisal cycles, scales, and evaluation timelines by review period."
          actions={
            <AppButton onClick={openAddModal} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Add
            </AppButton>
          }
        />
        {!modalOpen && (pageError || pageSuccess) && (
          <Alert
            severity={pageError ? 'error' : 'success'}
            sx={{ mb: 2 }}
            onClose={dismissPageAlerts}
          >
            {pageError || pageSuccess}
          </Alert>
        )}

        <AppCard sx={{ p: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Review period</TableCell>
                  <TableCell>Cycle</TableCell>
                  <TableCell>Scale</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.financialYearName
                        || financialYears.find((y) => y.id === row.financialYearId)?.name
                        || '-'}
                    </TableCell>
                    <TableCell>{row.cycleType}</TableCell>
                    <TableCell>{row.ratingScale}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditModal(row)} aria-label="Edit appraisal config">
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => requestDelete(row.id)}
                            aria-label="Delete appraisal config"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!configs.length && (
            <EmptyState
              variant="box"
              message="No appraisal configurations yet. Click Add to create one."
              minHeight={220}
              sx={{ mt: 1 }}
            />
          )}
        </AppCard>

        <AppraisalConfigModal
          open={modalOpen}
          title={modalTitle}
          saving={modalSaving}
          error={formError}
          editId={editConfigId}
          financialYears={financialYears}
          configForm={configForm}
          setConfigForm={setConfigForm}
          onClose={closeModal}
          onSave={saveConfig}
          clearError={() => setFormError('')}
        />

        <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
          <DialogTitle>Delete config?</DialogTitle>
          <DialogContent dividers>
            <Typography>
              This will permanently delete the selected <strong>appraisal configuration</strong>.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <AppButton variant="outlined" onClick={closeDeleteConfirm} disabled={deleteSaving}>
              Cancel
            </AppButton>
            <AppButton color="error" onClick={confirmDelete} disabled={deleteSaving}>
              Delete
            </AppButton>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AppraisalConfig;
