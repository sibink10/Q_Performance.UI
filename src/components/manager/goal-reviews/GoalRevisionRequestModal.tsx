import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Goal, GoalCategory } from '../../../types/goal';
import type { ProposedGoalChanges } from '../../../types/goalRevision';
import type { AssignableEmployee } from '../../../types/user';
import { GOAL_CATEGORY, GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';
import { REVISION_REASON, REVISION_REASON_LABELS, type RevisionReasonKey } from '../../../utils/revisionReasonConstants';
import { findEmployee } from '../../../utils/resolveEmployee';
import { formatDateOnly } from '../../../utils/helpers';
import useGoalRevisions from '../../../hooks/useGoalRevisions';
import AppButton from '../../common/AppButton';
import AppModal from '../../common/AppModal';

type GoalRevisionRequestModalProps = {
  open: boolean;
  goal: Goal | null;
  employees: AssignableEmployee[];
  onClose: () => void;
};

type FieldRowProps = {
  label: string;
  current: string;
  children: ReactNode;
};

function FieldRow({ label, current, children }: FieldRowProps) {
  return (
    <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
      <Grid item xs={12} sm={5}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label} — Current
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {current || '—'}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={7}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Proposed
        </Typography>
        <Box sx={{ mt: 0.5 }}>{children}</Box>
      </Grid>
    </Grid>
  );
}

const GoalRevisionRequestModal = ({ open, goal, employees, onClose }: GoalRevisionRequestModalProps) => {
  const theme = useTheme();
  const { submitRevisionRequest, isMutating, error, successMessage, clearError, clearSuccess } =
    useGoalRevisions();

  const [reason, setReason] = useState<RevisionReasonKey | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [measurementCriteria, setMeasurementCriteria] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<GoalCategory | ''>('');
  const [submitted, setSubmitted] = useState(false);

  const employee = goal ? findEmployee(employees, goal.employeeId) : null;
  const manager = employee?.managerId ? findEmployee(employees, employee.managerId) : null;

  useEffect(() => {
    if (open && goal) {
      setReason('');
      setOtherReason('');
      setTitle('');
      setDescription('');
      setTargetValue('');
      setMeasurementCriteria('');
      setDueDate('');
      setCategory('');
      setSubmitted(false);
      clearError();
      clearSuccess();
    }
  }, [open, goal?.id]);

  const proposedChanges: ProposedGoalChanges = useMemo(() => {
    if (!goal) return {};
    const changes: ProposedGoalChanges = {};
    if (title.trim() && title.trim() !== goal.title) changes.title = title.trim();
    if (description.trim() && description.trim() !== goal.description) {
      changes.description = description.trim();
    }
    if (targetValue.trim() && targetValue.trim() !== (goal.targetValue ?? '')) {
      changes.targetValue = targetValue.trim();
    }
    if (measurementCriteria.trim() && measurementCriteria.trim() !== goal.successCriteria) {
      changes.measurementCriteria = measurementCriteria.trim();
    }
    if (dueDate && dueDate !== goal.targetDate) changes.dueDate = dueDate;
    if (category && category !== goal.category) changes.category = category;
    return changes;
  }, [goal, title, description, targetValue, measurementCriteria, dueDate, category]);

  const hasProposedChanges = Object.keys(proposedChanges).length > 0;
  const otherReasonRequired = reason === REVISION_REASON.OTHER;
  const canSubmit =
    !!goal &&
    !!reason &&
    (!otherReasonRequired || otherReason.trim().length > 0) &&
    hasProposedChanges &&
    !isMutating;

  const handleSubmit = async () => {
    if (!goal || !reason) return;
    try {
      await submitRevisionRequest({
        goalId: goal.id,
        employeeId: goal.employeeId,
        reason,
        otherReason: otherReasonRequired ? otherReason.trim() : undefined,
        proposedChanges,
      });
      setSubmitted(true);
    } catch {
      // error surfaced via the hook's `error` state
    }
  };

  if (!goal || !employee) {
    return null;
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Request Goal Revision"
      subtitle="This goal is finalized. Proposed changes require Admin/HR approval before they take effect."
      maxWidth="md"
      actions={
        submitted ? (
          <AppButton onClick={onClose}>Close</AppButton>
        ) : (
          <>
            <AppButton variant="outlined" onClick={onClose} disabled={isMutating}>
              Cancel
            </AppButton>
            <AppButton onClick={handleSubmit} disabled={!canSubmit} loading={isMutating}>
              Submit Revision Request
            </AppButton>
          </>
        )
      }
    >
      {submitted && successMessage ? (
        <Alert severity="success">{successMessage}</Alert>
      ) : (
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Employee Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Employee Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {employee.name}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Employee ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {employee.employeeId || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {employee.email}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Manager
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {manager?.name ?? '—'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Current Goal
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Goal Title
                </Typography>
                <Typography variant="body2">{goal.title}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body2">{formatDateOnly(goal.targetDate)}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Revision Reason
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="revision-reason-label">Reason</InputLabel>
              <Select
                labelId="revision-reason-label"
                label="Reason"
                value={reason}
                onChange={(e: SelectChangeEvent<string>) => setReason(e.target.value as RevisionReasonKey)}
              >
                {Object.values(REVISION_REASON).map((key) => (
                  <MenuItem key={key} value={key}>
                    {REVISION_REASON_LABELS[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {otherReasonRequired && (
              <TextField
                sx={{ mt: 2 }}
                fullWidth
                size="small"
                required
                multiline
                minRows={2}
                label="Other Reason *"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                error={otherReasonRequired && !otherReason.trim()}
                helperText={
                  otherReasonRequired && !otherReason.trim() ? 'Other Reason is required.' : ' '
                }
              />
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Proposed Changes
            </Typography>

            <FieldRow label="Title" current={goal.title}>
              <TextField
                fullWidth
                size="small"
                placeholder="New title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Description" current={goal.description}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                placeholder="New description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Target" current={goal.targetValue || '—'}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. 150 customer onboarding cases"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Measurement Criteria" current={goal.successCriteria}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                placeholder="New measurement criteria"
                value={measurementCriteria}
                onChange={(e) => setMeasurementCriteria(e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Due Date" current={formatDateOnly(goal.targetDate)}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Category" current={GOAL_CATEGORY_LABELS[goal.category]}>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={category}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setCategory(e.target.value as GoalCategory | '')
                  }
                >
                  <MenuItem value="">No change</MenuItem>
                  {Object.values(GOAL_CATEGORY).map((key) => (
                    <MenuItem key={key} value={key}>
                      {GOAL_CATEGORY_LABELS[key]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FieldRow>

            {!hasProposedChanges && (
              <Typography variant="caption" color="text.secondary">
                Enter at least one proposed change above.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.info.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.25),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              You are requesting a revision to this employee&apos;s finalized goal. This change
              will not take effect until it is approved by Admin/HR.
            </Typography>
          </Box>
        </Stack>
      )}
    </AppModal>
  );
};

export default GoalRevisionRequestModal;
