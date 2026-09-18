import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { alpha, useTheme } from '@mui/material/styles';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../../common';
import AppButton from '../../common/AppButton';
import ConfirmDialog from '../../common/ConfirmDialog';
import useGoalTemplates from '../../../hooks/useGoalTemplates';
import useGoalCategories from '../../../hooks/useGoalCategories';
import type { GoalTemplate } from '../../../types/goalTemplate';
import { getCategoryMeta } from '../../../utils/goalCategoryMeta';
import { formatCategoryLabel } from '../../../utils/goalConstants';
import { sortGoalTemplatesByCategory } from '../../../utils/goalTemplateSort';
import GoalTemplateModal, { type GoalTemplateSubmitPayload } from './GoalTemplateModal';

const GoalTemplateConfig = () => {
  const theme = useTheme();
  const {
    templates,
    isLoading,
    error,
    successMessage,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    clearError,
    clearSuccess,
  } = useGoalTemplates();
  const { categories, loadCategories } = useGoalCategories();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GoalTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [loadTemplates, loadCategories]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = templates.filter((template) => {
      const matchesCategory = categoryFilter === 'ALL' || template.categoryId === categoryFilter;
      const matchesSearch = !query || template.title.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    return sortGoalTemplatesByCategory(filtered);
  }, [templates, search, categoryFilter]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: GoalTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (payload: GoalTemplateSubmitPayload) => {
    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, payload);
      } else {
        await createTemplate(payload);
      }
      setIsModalOpen(false);
      setEditingTemplate(null);
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
      await deleteTemplate(deleteTarget.id);
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
        title="Goal Templates"
        subtitle="Create reusable goal templates so admins can quickly assign them during goal setting instead of typing every goal from scratch."
        actions={
          <AppButton startIcon={<AddRoundedIcon />} onClick={openCreateModal}>
            New Template
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

      <AppCard sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {[{ id: 'ALL', code: 'All categories' }, ...categories].map((category) => {
            const selected = categoryFilter === category.id;
            const accent = category.id !== 'ALL' ? getCategoryMeta(category.code).accent(theme) : null;
            return (
              <Chip
                key={category.id}
                label={category.id === 'ALL' ? category.code : formatCategoryLabel(category.code)}
                onClick={() => setCategoryFilter(category.id)}
                sx={{
                  fontWeight: 700,
                  backgroundColor: selected
                    ? accent
                      ? accent.soft
                      : alpha(theme.palette.primary.main, 0.14)
                    : 'transparent',
                  color: selected ? (accent ? accent.main : theme.palette.primary.dark) : 'text.secondary',
                  border: '1px solid',
                  borderColor: selected
                    ? alpha(accent ? accent.main : theme.palette.primary.main, 0.35)
                    : 'divider',
                }}
              />
            );
          })}
        </Stack>

        {isLoading && !templates.length ? (
          <AppLoader message="Loading goal templates…" />
        ) : filteredTemplates.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Success criteria</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTemplates.map((template) => {
                  const meta = getCategoryMeta(template.category);
                  const Icon = meta.Icon;
                  const accent = meta.accent(theme);
                  return (
                    <TableRow key={template.id} hover>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {template.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {template.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={<Icon sx={{ fontSize: '16px !important', color: `${accent.main} !important` }} />}
                          label={formatCategoryLabel(template.category)}
                          sx={{
                            fontWeight: 600,
                            bgcolor: accent.soft,
                            color: accent.main,
                            border: `1px solid ${accent.border}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Tooltip title={template.successCriteria}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {template.successCriteria}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditModal(template)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(template)}>
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState
            variant="noContent"
            message="No goal templates match the selected filters."
            minHeight={220}
          />
        )}
      </AppCard>

      <GoalTemplateModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        template={editingTemplate}
        categories={categories}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete goal template"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This won't affect goals already assigned from it.`
            : 'Are you sure you want to delete this template?'
        }
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
        loading={isDeleting}
      />
    </Box>
  );
};

export default GoalTemplateConfig;
