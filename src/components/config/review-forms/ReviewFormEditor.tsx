// @ts-nocheck
// Admin: Create / edit review form template UI

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Grid, Stack, Divider,
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert,
  Snackbar, Chip, Tooltip, CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import usePerformance from '../../../hooks/usePerformance';
import AppButton from '../../common/AppButton';
import { AppCard, AppLoader, ConfirmDialog, PageHeader } from '../../common/index';
import { WEIGHTAGE_OPTIONS } from '../../../utils/constants';

const newQuestion = () => ({ id: Date.now(), text: '', weightage: 1 });

const newFocusAreaEntry = (fa) => ({
  focusAreaId: fa.id,
  focusAreaName: fa.name,
  weightage: 1,
  questions: [newQuestion()],
});

const REVIEW_FORM_FOCUS_AREAS_PAGE_SIZE = 20;

const ReviewFormEditor = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const {
    activeFocusAreas, focusAreasPagination, isSaving, isLoading, error, successMessage,
    loadFocusAreas, loadReviewFormById, createReviewForm, editReviewForm, clearSuccess,
  } = usePerformance();

  const isEditMode = !!formId && formId !== 'new';
  const [form, setForm] = useState({
    name: '',
    period: '',
    sections: [],
  });
  const [errors, setErrors] = useState({});
  const [hydrating, setHydrating] = useState(isEditMode);
  /** When set, navigate to list after the success snackbar closes (so the snackbar stays visible first). */
  const [pendingNavAfterSnack, setPendingNavAfterSnack] = useState(false);
  const [loadingMoreFocusAreas, setLoadingMoreFocusAreas] = useState(false);
  const [questionDelete, setQuestionDelete] = useState(null);

  useEffect(() => {
    loadFocusAreas({ page: 1, pageSize: REVIEW_FORM_FOCUS_AREAS_PAGE_SIZE });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showLoadMoreFocusAreas = useMemo(() => {
    if (!focusAreasPagination) return false;
    const { page, totalPages } = focusAreasPagination;
    return Number(totalPages) > 0 && Number(page) < Number(totalPages);
  }, [focusAreasPagination]);

  const handleLoadMoreFocusAreas = async () => {
    if (!focusAreasPagination || loadingMoreFocusAreas) return;
    const { page, pageSize } = focusAreasPagination;
    setLoadingMoreFocusAreas(true);
    try {
      await loadFocusAreas({
        page: Number(page) + 1,
        pageSize: Number(pageSize) || REVIEW_FORM_FOCUS_AREAS_PAGE_SIZE,
        append: true,
      }).unwrap();
    } finally {
      setLoadingMoreFocusAreas(false);
    }
  };

  useEffect(() => {
    const loadEditForm = async () => {
      if (!isEditMode || !formId) {
        setHydrating(false);
        return;
      }
      setHydrating(true);
      const result = await loadReviewFormById(formId);
      if (result?.meta?.requestStatus === 'fulfilled') {
        setForm(result.payload);
      }
      setHydrating(false);
    };
    loadEditForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, isEditMode]);

  const toggleFocusArea = (fa) => {
    setForm((p) => {
      const currentSections = Array.isArray(p.sections) ? p.sections : [];
      const exists = currentSections.find((s) => s.focusAreaId === fa.id);
      return exists
        ? { ...p, sections: currentSections.filter((s) => s.focusAreaId !== fa.id) }
        : { ...p, sections: [...currentSections, newFocusAreaEntry(fa)] };
    });
  };

  const updateSection = (sectionIdx, field, value) => {
    setForm((p) => {
      const sections = [...p.sections];
      sections[sectionIdx] = { ...sections[sectionIdx], [field]: value };
      return { ...p, sections };
    });
  };

  const addQuestion = (sectionIdx) => {
    setForm((p) => {
      const sections = [...p.sections];
      sections[sectionIdx].questions = [...sections[sectionIdx].questions, newQuestion()];
      return { ...p, sections };
    });
  };

  const updateQuestion = (sectionIdx, qIdx, field, value) => {
    setForm((p) => {
      const sections = [...p.sections];
      sections[sectionIdx].questions[qIdx] = {
        ...sections[sectionIdx].questions[qIdx],
        [field]: value,
      };
      return { ...p, sections };
    });
  };

  const removeQuestion = (sectionIdx, qIdx) => {
    setForm((p) => {
      const sections = [...p.sections];
      sections[sectionIdx].questions = sections[sectionIdx].questions.filter(
        (_, i) => i !== qIdx
      );
      return { ...p, sections };
    });
  };

  const validate = () => {
    const e = {};
    const currentSections = Array.isArray(form.sections) ? form.sections : [];
    if (!form.name.trim()) e.name = 'Form name is required';
    if (!form.period.trim()) e.period = 'Period is required';
    if (!currentSections.length) e.sections = 'Select at least one focus area';
    currentSections.forEach((s, si) => {
      s.questions.forEach((q, qi) => {
        if (!q.text.trim()) e[`q_${si}_${qi}`] = 'Question text is required';
      });
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const result = isEditMode
      ? await editReviewForm(formId, form)
      : await createReviewForm(form);
    if (result?.meta?.requestStatus === 'fulfilled') {
      setPendingNavAfterSnack(true);
    }
  };

  const handleSaveSuccessSnackClose = () => {
    clearSuccess();
    setPendingNavAfterSnack((prev) => {
      if (prev) navigate('/config/performance/review-forms');
      return false;
    });
  };

  const currentSections = Array.isArray(form.sections) ? form.sections : [];

  if (hydrating) return <AppLoader />;

  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Review Form' : 'Create Review Form'}
        subtitle="Design a performance review template with focus areas and evaluation questions"
        startAdornment={
          <IconButton onClick={() => navigate(-1)} size="small" aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
        }
        actions={
          <AppButton loading={isSaving} startIcon={<SaveIcon />} onClick={handleSave}>
            {isEditMode ? 'Save Changes' : 'Save Form'}
          </AppButton>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <AppCard sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Form Details</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Form Name *"
              value={form.name}
              onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((po) => ({ ...po, name: '' })); }}
              fullWidth size="small"
              placeholder="e.g., Annual Review Form 2026"
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Applicable Period *"
              value={form.period}
              onChange={(e) => { setForm((p) => ({ ...p, period: e.target.value })); setErrors((po) => ({ ...po, period: '' })); }}
              fullWidth size="small"
              placeholder="e.g., FY 2025-2026"
              error={!!errors.period}
              helperText={errors.period}
            />
          </Grid>
        </Grid>
      </AppCard>

      <AppCard sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Select Focus Areas</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Choose from the configured focus areas. You can then add questions under each.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {errors.sections && <Alert severity="error" sx={{ mb: 2 }}>{errors.sections}</Alert>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {activeFocusAreas.map((fa) => {
            const selected = !!currentSections.find((s) => s.focusAreaId === fa.id);
            return (
              <Chip
                key={fa.id}
                label={fa.name}
                clickable
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => toggleFocusArea(fa)}
                sx={
                  selected
                    ? {
                        '&.MuiChip-clickable:hover': {
                          color: '#fff',
                        },
                        '&.MuiChip-clickable:hover .MuiChip-label': {
                          color: '#fff',
                        },
                      }
                    : undefined
                }
              />
            );
          })}
          {showLoadMoreFocusAreas && (
            <Chip
              label={
                loadingMoreFocusAreas ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CircularProgress size={14} thickness={5} sx={{ color: '#1565c0' }} />
                    Loading…
                  </Box>
                ) : (
                  'Load more'
                )
              }
              clickable={!loadingMoreFocusAreas && !isLoading}
              onClick={
                loadingMoreFocusAreas || isLoading ? undefined : handleLoadMoreFocusAreas
              }
              sx={{
                bgcolor: '#e3f2fd',
                color: '#1565c0',
                fontWeight: 600,
                border: '1px solid',
                borderColor: '#90caf9',
                '&:hover': {
                  bgcolor: loadingMoreFocusAreas ? '#e3f2fd' : '#bbdefb',
                },
              }}
            />
          )}
        </Box>
      </AppCard>

      {currentSections.map((section, sIdx) => (
        <AppCard
          key={section.focusAreaId}
          sx={{ mb: 2, overflow: 'hidden', p: 0 }}
        >
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Typography fontWeight={600}>{section.focusAreaName}</Typography>
                <Chip label={`${section.questions.length} questions`} size="small" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="body2" fontWeight={500}>Focus Area Weightage:</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={section.weightage}
                    onChange={(e) => updateSection(sIdx, 'weightage', e.target.value)}
                  >
                    {WEIGHTAGE_OPTIONS.map((w) => (
                      <MenuItem key={w} value={w}>{w}x</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" fontWeight={500} gutterBottom>Evaluation Questions</Typography>
              <Stack spacing={2}>
                {section.questions.map((q, qIdx) => (
                  <Box
                    key={q.id}
                    sx={{
                      display: 'flex', gap: 2, alignItems: 'flex-start',
                      p: 2, borderRadius: 1.5, border: '1px solid',
                      borderColor: errors[`q_${sIdx}_${qIdx}`] ? 'error.main' : 'divider',
                      bgcolor: 'grey.50',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ mt: 1.2, minWidth: 20, color: 'text.secondary', fontWeight: 700 }}
                    >
                      Q{qIdx + 1}
                    </Typography>
                    <TextField
                      value={q.text}
                      onChange={(e) => {
                        updateQuestion(sIdx, qIdx, 'text', e.target.value);
                        setErrors((p) => ({ ...p, [`q_${sIdx}_${qIdx}`]: '' }));
                      }}
                      fullWidth size="small"
                      placeholder="Enter evaluation question..."
                      error={!!errors[`q_${sIdx}_${qIdx}`]}
                      helperText={errors[`q_${sIdx}_${qIdx}`]}
                      multiline
                    />
                    <FormControl size="small" sx={{ minWidth: 90, flexShrink: 0 }}>
                      <InputLabel>Weight</InputLabel>
                      <Select
                        value={q.weightage}
                        label="Weight"
                        onChange={(e) => updateQuestion(sIdx, qIdx, 'weightage', e.target.value)}
                      >
                        {WEIGHTAGE_OPTIONS.map((w) => (
                          <MenuItem key={w} value={w}>{w}x</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Tooltip title="Remove question">
                      <IconButton
                        size="small"
                        onClick={() => setQuestionDelete({ sIdx, qIdx })}
                        disabled={section.questions.length === 1}
                        color="error"
                        sx={{ mt: 0.3 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
              <AppButton
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addQuestion(sIdx)}
                sx={{ mt: 2 }}
              >
                Add Question
              </AppButton>
            </AccordionDetails>
          </Accordion>
        </AppCard>
      ))}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleSaveSuccessSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleSaveSuccessSnackClose}>
          {successMessage}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={!!questionDelete}
        title="Remove question"
        message="Delete this evaluation question? You can add it again later if needed."
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="error"
        loading={false}
        onClose={() => setQuestionDelete(null)}
        onConfirm={() => {
          if (questionDelete) removeQuestion(questionDelete.sIdx, questionDelete.qIdx);
          setQuestionDelete(null);
        }}
      />
    </Box>
  );
};

export default ReviewFormEditor;
