import { useEffect, useMemo, useState } from 'react';
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
import type { GoalStatus } from '../../../types/goal';
import type { GoalGrowthConnectEntry } from '../../../types/growthConnect';
import { GOAL_STATUS, GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { REVISION_REASON, REVISION_REASON_LABELS, type RevisionReasonKey } from '../../../utils/revisionReasonConstants';
import useGrowthConnectRevisions from '../../../hooks/useGrowthConnectRevisions';
import AppButton from '../../common/AppButton';
import AppModal from '../../common/AppModal';

const STATUS_OPTIONS: GoalStatus[] = [
  GOAL_STATUS.ON_TRACK,
  GOAL_STATUS.NEEDS_ATTENTION,
  GOAL_STATUS.OFF_TRACK,
  GOAL_STATUS.COMPLETED,
];

type GrowthConnectRevisionRequestModalProps = {
  open: boolean;
  entry: GoalGrowthConnectEntry | null;
  onClose: () => void;
};

const GrowthConnectRevisionRequestModal = ({ open, entry, onClose }: GrowthConnectRevisionRequestModalProps) => {
  const theme = useTheme();
  const { submitRevisionRequest, isMutating, error, successMessage, clearError, clearSuccess } =
    useGrowthConnectRevisions();

  const [reason, setReason] = useState<RevisionReasonKey | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [proposedStatus, setProposedStatus] = useState<GoalStatus | ''>('');
  const [proposedFeedback, setProposedFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open && entry) {
      setReason('');
      setOtherReason('');
      setProposedStatus('');
      setProposedFeedback('');
      setSubmitted(false);
      clearError();
      clearSuccess();
    }
  }, [open, entry?.id]);

  const hasProposedChanges = useMemo(() => {
    if (!entry) return false;
    const statusChanged = proposedStatus !== '' && proposedStatus !== entry.managerStatus;
    const feedbackChanged = proposedFeedback.trim() !== '' && proposedFeedback.trim() !== (entry.managerFeedback ?? '');
    return statusChanged || feedbackChanged;
  }, [entry, proposedStatus, proposedFeedback]);

  const otherReasonRequired = reason === REVISION_REASON.OTHER;
  const canSubmit =
    !!entry && !!reason && (!otherReasonRequired || otherReason.trim().length > 0) && hasProposedChanges && !isMutating;

  const handleSubmit = async () => {
    if (!entry || !reason) return;
    try {
      await submitRevisionRequest({
        entryId: entry.id,
        reason,
        otherReason: otherReasonRequired ? otherReason.trim() : undefined,
        proposedManagerStatus: proposedStatus !== '' && proposedStatus !== entry.managerStatus ? proposedStatus : undefined,
        proposedManagerFeedback:
          proposedFeedback.trim() && proposedFeedback.trim() !== (entry.managerFeedback ?? '')
            ? proposedFeedback.trim()
            : undefined,
      });
      setSubmitted(true);
    } catch {
      // error surfaced via the hook's `error` state
    }
  };

  if (!entry) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Request Growth Connect Revision"
      subtitle={`${entry.cycleName} — proposed changes require Admin approval before they take effect.`}
      maxWidth="sm"
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
              Current Status &amp; Feedback
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2">
                  {entry.managerStatus ? GOAL_STATUS_LABELS[entry.managerStatus] : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="caption" color="text.secondary">
                  Feedback
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {entry.managerFeedback || '—'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Revision Reason
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="gc-revision-reason-label">Reason</InputLabel>
              <Select
                labelId="gc-revision-reason-label"
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
                helperText={otherReasonRequired && !otherReason.trim() ? 'Other Reason is required.' : ' '}
              />
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Proposed Changes
            </Typography>

            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="gc-proposed-status-label">Proposed status (optional)</InputLabel>
                <Select
                  labelId="gc-proposed-status-label"
                  label="Proposed status (optional)"
                  displayEmpty
                  value={proposedStatus}
                  onChange={(e: SelectChangeEvent<string>) => setProposedStatus(e.target.value as GoalStatus | '')}
                >
                  <MenuItem value="">No change</MenuItem>
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {GOAL_STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                label="Proposed feedback (optional)"
                placeholder="New overall feedback for this cycle"
                value={proposedFeedback}
                onChange={(e) => setProposedFeedback(e.target.value)}
              />
            </Stack>

            {!hasProposedChanges && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Propose a different status and/or feedback text above.
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
              You are requesting a change to your own submitted status/feedback for this Growth
              Connect cycle. This will not take effect until it is approved by Admin.
            </Typography>
          </Box>
        </Stack>
      )}
    </AppModal>
  );
};

export default GrowthConnectRevisionRequestModal;
