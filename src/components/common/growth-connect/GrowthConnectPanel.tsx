import { useEffect, useState } from 'react';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import {
  Alert,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal, GoalStatus } from '../../../types/goal';
import type { GoalGrowthConnectEntry } from '../../../types/growthConnect';
import { GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { getGoalStatusColors } from '../../../utils/statusColorTokens';
import AppButton from '../AppButton';
import AppLoader from '../AppLoader';
import EmptyState from '../EmptyState';
import useGoalGrowthConnect from '../../../hooks/useGoalGrowthConnect';
import useAuth from '../../../hooks/useAuth';

const DATE_FORMAT = 'DD MMM YYYY';

const STATUS_OPTIONS: GoalStatus[] = [
  GOAL_STATUS.ON_TRACK,
  GOAL_STATUS.NEEDS_ATTENTION,
  GOAL_STATUS.OFF_TRACK,
  GOAL_STATUS.COMPLETED,
];

type DisplayCycleStatus = 'LOCKED' | 'OPEN' | 'CLOSED';

const DISPLAY_STATUS_LABELS: Record<DisplayCycleStatus, string> = {
  LOCKED: 'Locked',
  OPEN: 'Open',
  CLOSED: 'Closed',
};

const DISPLAY_STATUS_COLOR: Record<DisplayCycleStatus, 'default' | 'success' | 'warning'> = {
  LOCKED: 'default',
  OPEN: 'success',
  CLOSED: 'warning',
};

/** Cycle chip: DRAFT reads as "Locked"; a fully-submitted entry reads as "Closed" even if the
 *  admin hasn't manually closed the cycle yet — the cycle is functionally done for this goal. */
function getDisplayStatus(entry: GoalGrowthConnectEntry): DisplayCycleStatus {
  const fullySubmitted = Boolean(entry.employeeSubmittedAt && entry.managerSubmittedAt);
  if (entry.cycleStatus === 'CLOSED' || fullySubmitted) return 'CLOSED';
  if (entry.cycleStatus === 'OPEN') return 'OPEN';
  return 'LOCKED';
}

type GrowthConnectPanelProps = {
  goal: Goal;
  onRequestRevision?: (entry: GoalGrowthConnectEntry) => void;
};

const GrowthConnectPanel = ({ goal, onRequestRevision }: GrowthConnectPanelProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? '';
  const currentRole = String(user?.role ?? '').toUpperCase();

  const isOwnGoal = currentUserId === goal.employeeId;
  const canActAsManager = currentRole === 'MANAGER' || currentRole === 'ADMIN';

  const {
    entries,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadEntries,
    submitEmployeeUpdate,
    submitManagerFeedback,
    clearError,
    clearSuccess,
  } = useGoalGrowthConnect();

  useEffect(() => {
    loadEntries(goal.id);
  }, [loadEntries, goal.id]);

  const [employeeDraft, setEmployeeDraft] = useState('');
  const [managerStatusDraft, setManagerStatusDraft] = useState<GoalStatus | ''>('');
  const [managerFeedbackDraft, setManagerFeedbackDraft] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const handleSubmitEmployeeUpdate = async (entryId: string) => {
    if (!employeeDraft.trim()) return;
    setActiveEntryId(entryId);
    try {
      await submitEmployeeUpdate(entryId, employeeDraft.trim());
      setEmployeeDraft('');
    } catch {
      // error surfaced via hook's `error` state
    } finally {
      setActiveEntryId(null);
    }
  };

  const handleSubmitManagerFeedback = async (entryId: string) => {
    if (!managerStatusDraft || !managerFeedbackDraft.trim()) return;
    setActiveEntryId(entryId);
    try {
      await submitManagerFeedback(entryId, managerStatusDraft, managerFeedbackDraft.trim());
      setManagerStatusDraft('');
      setManagerFeedbackDraft('');
    } catch {
      // error surfaced via hook's `error` state
    } finally {
      setActiveEntryId(null);
    }
  };

  if (isLoading && !entries.length) {
    return <AppLoader message="Loading Growth Connect cycles…" size={28} minHeight={140} />;
  }

  if (!entries.length) {
    return (
      <EmptyState
        variant="box"
        message="No Growth Connect cycles have been added to this review period yet."
        minHeight={160}
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      {(error || successMessage) && (
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => {
            clearError();
            clearSuccess();
          }}
        >
          {error || successMessage}
        </Alert>
      )}

      {entries.map((entry) => {
        const statusColors = entry.managerStatus ? getGoalStatusColors(theme, entry.managerStatus) : null;
        const busy = isMutating && activeEntryId === entry.id;

        return (
          <Box
            key={entry.id}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TimelineOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {entry.cycleName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(entry.cycleStartDate).format(DATE_FORMAT)} – {dayjs(entry.cycleEndDate).format(DATE_FORMAT)}
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={DISPLAY_STATUS_LABELS[getDisplayStatus(entry)]}
                color={DISPLAY_STATUS_COLOR[getDisplayStatus(entry)]}
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Employee update
            </Typography>
            {entry.employeeSubmittedAt ? (
              <Box sx={{ mt: 0.5, mb: 1.5 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {entry.employeeUpdate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted by {entry.employeeSubmittedByName} on {dayjs(entry.employeeSubmittedAt).format(DATE_FORMAT)}
                </Typography>
              </Box>
            ) : isOwnGoal && entry.isEmployeeEditable ? (
              <Stack spacing={1} sx={{ mt: 0.5, mb: 1.5 }}>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder="Share your progress and updates for this Growth Connect cycle…"
                  value={employeeDraft}
                  onChange={(e) => setEmployeeDraft(e.target.value)}
                  disabled={busy}
                />
                <Stack direction="row" justifyContent="flex-end">
                  <AppButton
                    size="small"
                    loading={busy}
                    disabled={!employeeDraft.trim()}
                    onClick={() => handleSubmitEmployeeUpdate(entry.id)}
                  >
                    Submit update
                  </AppButton>
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5, fontStyle: 'italic' }}>
                {isOwnGoal
                  ? 'Not open for submission yet.'
                  : 'Waiting for the employee to submit their update.'}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Manager status &amp; overall feedback
            </Typography>
            {entry.managerSubmittedAt ? (
              <Box sx={{ mt: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Chip
                    size="small"
                    label={GOAL_STATUS_LABELS[entry.managerStatus as GoalStatus]}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: statusColors ? alpha(statusColors.main, 0.14) : undefined,
                      color: statusColors?.dark,
                    }}
                  />
                  {canActAsManager && onRequestRevision && (
                    <Tooltip title="Request a revision to this status/feedback">
                      <IconButton size="small" onClick={() => onRequestRevision(entry)} aria-label="Request revision">
                        <RateReviewOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {entry.managerFeedback}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  By {entry.managerSubmittedByName} on {dayjs(entry.managerSubmittedAt).format(DATE_FORMAT)}
                </Typography>
              </Box>
            ) : canActAsManager && entry.isManagerEditable ? (
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id={`gc-status-${entry.id}`}>Status</InputLabel>
                  <Select
                    labelId={`gc-status-${entry.id}`}
                    label="Status"
                    value={managerStatusDraft}
                    disabled={busy}
                    onChange={(e: SelectChangeEvent<string>) => setManagerStatusDraft(e.target.value as GoalStatus)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        {GOAL_STATUS_LABELS[status]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder="Overall feedback for this cycle…"
                  value={managerFeedbackDraft}
                  onChange={(e) => setManagerFeedbackDraft(e.target.value)}
                  disabled={busy}
                />
                <Stack direction="row" justifyContent="flex-end">
                  <AppButton
                    size="small"
                    loading={busy}
                    disabled={!managerStatusDraft || !managerFeedbackDraft.trim()}
                    onClick={() => handleSubmitManagerFeedback(entry.id)}
                  >
                    Submit feedback
                  </AppButton>
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                {entry.employeeSubmittedAt
                  ? 'Waiting for the manager to submit status and feedback.'
                  : 'Available once the employee submits their update.'}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default GrowthConnectPanel;
