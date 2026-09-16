import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../../common';
import AppButton from '../../common/AppButton';
import ConfirmDialog from '../../common/ConfirmDialog';
import useGoalCategories from '../../../hooks/useGoalCategories';
import type { GoalCategoryDto } from '../../../types/goalCategory';
import GoalCategoryModal, { type GoalCategorySubmitPayload } from './GoalCategoryModal';

const GoalCategoryConfig = () => {
  const {
    categories,
    isLoading,
    error,
    successMessage,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    clearSuccess,
  } = useGoalCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GoalCategoryDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GoalCategoryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: GoalCategoryDto) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (payload: GoalCategorySubmitPayload) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch {
      // error surfaced via the hook's `error` state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClose = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error surfaced via the hook's `error` state
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Goal Categories"
        subtitle="Manage the categories goal templates and goals are grouped under (e.g. Organizational, Role, Development)."
        actions={
          <AppButton startIcon={<AddRoundedIcon />} onClick={openCreateModal}>
            New Category
          </AppButton>
        }
      />

      {(error || successMessage) && (
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => {
            clearError();
            clearSuccess();
          }}
        >
          {error || successMessage}
        </Alert>
      )}

      <AppCard variant="table">
        {isLoading && !categories.length ? (
          <AppLoader message="Loading goal categories…" />
        ) : categories.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{category.code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        color={category.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditModal(category)}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(category)}>
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState
            variant="folder"
            message='No goal categories defined. Click "New Category" to get started.'
            minHeight={240}
          />
        )}
      </AppCard>

      <GoalCategoryModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        category={editingCategory}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete goal category"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.code}"? This will fail if any goal template still uses it.`
            : 'Are you sure you want to delete this category?'
        }
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
        loading={isDeleting}
      />
    </Box>
  );
};

export default GoalCategoryConfig;
