// @ts-nocheck
// Admin: Create / edit review form template UI

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Grid, Stack, Divider,
  Accordion, AccordionSummary, AccordionDetails, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert,
  Snackbar, Chip, Tooltip, CircularProgress, Fab,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import usePerformance from '../../../hooks/usePerformance';
import usePerformanceApi from '../../../hooks/usePerformanceApi';
import AppButton from '../../common/AppButton';
import { AppCard, AppLoader, ConfirmDialog, PageHeader, RichTextEditor } from '../../common/index';
import { WEIGHTAGE_OPTIONS } from '../../../utils/constants';
import { normalizeQuestionTextToHtml, richTextHtmlToPlainText } from '../../../utils/richText';

const newQuestion = () => ({ id: Date.now(), text: '', weightage: '' });

const questionAltSx = (qIdx) => {
  const isOdd = qIdx % 2 === 1;
  return {
    bgcolor: isOdd ? 'rgba(2, 136, 209, 0.06)' : 'rgba(46, 125, 50, 0.05)',
    borderLeft: '4px solid',
    borderLeftColor: isOdd ? 'info.light' : 'success.light',
  };
};

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
    loadFocusAreas, createReviewForm, editReviewForm, clearSuccess,
  } = usePerformance();
  const { getReviewFormById } = usePerformanceApi();

  const isEditMode = !!formId && formId !== 'new';
  const [form, setForm] = useState({
    name: '',
    sections: [],
  });
  const [errors, setErrors] = useState({});
  const [hydrating, setHydrating] = useState(isEditMode);
  /** When set, navigate to list after the success snackbar closes (so the snackbar stays visible first). */
  const [pendingNavAfterSnack, setPendingNavAfterSnack] = useState(false);
  const [loadingMoreFocusAreas, setLoadingMoreFocusAreas] = useState(false);
  const [questionDelete, setQuestionDelete] = useState(null);
  const [pendingScrollFocusAreaId, setPendingScrollFocusAreaId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef({});

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
      try {
        const data = await getReviewFormById(formId);
        setForm({
          name: data?.name ?? '',
          sections: Array.isArray(data?.sections)
            ? data.sections.map((s) => ({
                ...s,
                questions: Array.isArray(s?.questions)
                  ? s.questions.map((q) => ({ ...q, text: normalizeQuestionTextToHtml(q?.text) }))
                  : [],
              }))
            : [],
        });
      } catch {
        // UI uses `error` from Redux for mutations; load errors can be reflected via existing alert.
      }
      setHydrating(false);
    };
    loadEditForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, isEditMode]);

  const currentSections = Array.isArray(form.sections) ? form.sections : [];

  const toggleFocusArea = (fa) => {
    setForm((p) => {
      const currentSections = Array.isArray(p.sections) ? p.sections : [];
      const exists = currentSections.find((s) => s.focusAreaId === fa.id);
      return exists
        ? { ...p, sections: currentSections.filter((s) => s.focusAreaId !== fa.id) }
        : { ...p, sections: [...currentSections, newFocusAreaEntry(fa)] };
    });
  };

  const scrollToFocusAreaSection = useCallback((focusAreaId) => {
    const el = sectionRefs.current?.[focusAreaId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleFocusAreaChipClick = (fa) => {
    const alreadySelected = !!currentSections.find((s) => s.focusAreaId === fa.id);
    toggleFocusArea(fa);
    if (alreadySelected) {
      scrollToFocusAreaSection(fa.id);
    } else {
      setPendingScrollFocusAreaId(fa.id);
    }
  };

  useEffect(() => {
    if (!pendingScrollFocusAreaId) return;
    const nowExists = !!currentSections.find((s) => s.focusAreaId === pendingScrollFocusAreaId);
    if (!nowExists) return;

    // Ensure the new card has mounted before scrolling.
    requestAnimationFrame(() => {
      scrollToFocusAreaSection(pendingScrollFocusAreaId);
      setPendingScrollFocusAreaId(null);
    });
  }, [currentSections, pendingScrollFocusAreaId, scrollToFocusAreaSection]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop((window.scrollY || 0) > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const questionPlainText = useCallback((q) => richTextHtmlToPlainText(String(q?.text || '')), []);

  const isQuestionComplete = useCallback(
    (q) => {
      const plain = questionPlainText(q);
      const hasText = !!plain.trim();
      const hasWeightage = q?.weightage !== '' && q?.weightage !== null && q?.weightage !== undefined;
      return hasText && hasWeightage;
    },
    [questionPlainText]
  );

  const canAddNextQuestion = useCallback(
    (section) => {
      const qs = Array.isArray(section?.questions) ? section.questions : [];
      if (!qs.length) return true;
      return isQuestionComplete(qs[qs.length - 1]);
    },
    [isQuestionComplete]
  );

  const canSaveForm = useMemo(() => {
    const currentSections = Array.isArray(form.sections) ? form.sections : [];
    if (!form.name.trim()) return false;
    if (!currentSections.length) return false;
    for (const s of currentSections) {
      const qs = Array.isArray(s?.questions) ? s.questions : [];
      if (!qs.length) return false;
      for (const q of qs) {
        if (!isQuestionComplete(q)) return false;
      }
    }
    return true;
  }, [form.name, form.sections, isQuestionComplete]);

  const validate = () => {
    const e = {};
    const currentSections = Array.isArray(form.sections) ? form.sections : [];
    if (!form.name.trim()) e.name = 'Form name is required';
    if (!currentSections.length) e.sections = 'Select at least one focus area';
    currentSections.forEach((s, si) => {
      s.questions.forEach((q, qi) => {
        const plain = questionPlainText(q);
        if (!plain.trim()) e[`q_${si}_${qi}`] = 'Question text is required';
        if (q?.weightage === '' || q?.weightage === null || q?.weightage === undefined) {
          e[`qw_${si}_${qi}`] = 'Weightage is required';
        }
      });
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    // Backend may still return legacy fields (e.g., `period`) in edit mode; do not persist them.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { period, ...payload } = form;
    const result = isEditMode
      ? await editReviewForm(formId, payload)
      : await createReviewForm(payload);
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
          <AppButton
            loading={isSaving}
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!canSaveForm || isSaving}
          >
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
                onClick={() => handleFocusAreaChipClick(fa)}
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
        <Box
          key={section.focusAreaId}
          ref={(el) => {
            sectionRefs.current[section.focusAreaId] = el;
          }}
          sx={{ scrollMarginTop: 96 }}
        >
          <AppCard sx={{ mb: 2, overflow: 'hidden', p: 0 }}>
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
                        ...questionAltSx(qIdx),
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ mt: 1.2, minWidth: 20, color: 'text.secondary', fontWeight: 700 }}
                      >
                        Q{qIdx + 1}
                      </Typography>
                      <RichTextEditor
                        value={q.text}
                        onChange={(nextHtml) => {
                          updateQuestion(sIdx, qIdx, 'text', nextHtml);
                          setErrors((p) => ({ ...p, [`q_${sIdx}_${qIdx}`]: '' }));
                        }}
                        placeholder="Enter evaluation question..."
                        error={!!errors[`q_${sIdx}_${qIdx}`]}
                        helperText={errors[`q_${sIdx}_${qIdx}`]}
                        minHeight={84}
                      />
                      <FormControl
                        size="small"
                        sx={{ minWidth: 90, flexShrink: 0 }}
                        error={!!errors[`qw_${sIdx}_${qIdx}`]}
                      >
                        <InputLabel
                          id={`q-weightage-label-${sIdx}-${qIdx}`}
                          shrink
                        >
                          Weight
                        </InputLabel>
                        <Select
                          id={`q-weightage-${sIdx}-${qIdx}`}
                          labelId={`q-weightage-label-${sIdx}-${qIdx}`}
                          value={q.weightage}
                          label="Weight"
                          onChange={(e) => {
                            updateQuestion(sIdx, qIdx, 'weightage', e.target.value);
                            setErrors((p) => ({ ...p, [`qw_${sIdx}_${qIdx}`]: '' }));
                          }}
                          displayEmpty
                          renderValue={(selected) => (selected === '' ? 'Select' : `${selected}x`)}
                        >
                          {WEIGHTAGE_OPTIONS.map((w) => (
                            <MenuItem key={w} value={w}>{w}x</MenuItem>
                          ))}
                        </Select>
                        {!!errors[`qw_${sIdx}_${qIdx}`] && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            {errors[`qw_${sIdx}_${qIdx}`]}
                          </Typography>
                        )}
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
                  disabled={!canAddNextQuestion(section)}
                  sx={{ mt: 2 }}
                >
                  Add Question
                </AppButton>
              </AccordionDetails>
            </Accordion>
          </AppCard>
        </Box>
      ))}

      <Fab
        size="small"
        aria-label="Scroll to top"
        onClick={handleScrollToTop}
        sx={{
          position: 'fixed',
          right: 22,
          bottom: 22,
          zIndex: 1400,
          display: showScrollTop ? 'inline-flex' : 'none',
          bgcolor: 'primary.light',
          color: 'primary.dark',
          boxShadow: (t) => `0 10px 24px rgba(15, 157, 120, 0.25)`,
          '&:hover': {
            bgcolor: 'primary.main',
            color: '#fff',
          },
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>

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
