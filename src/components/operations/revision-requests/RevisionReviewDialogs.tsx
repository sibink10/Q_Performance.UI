import { useEffect, useState } from 'react';
import { Alert, Box, Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import type { Goal } from '../../../types/goal';
import type { GoalRevision } from '../../../types/goalRevision';
import { REVISION_REASON_LABELS } from '../../../utils/revisionReasonConstants';
import { GOAL_REVISION_STATUS_LABELS } from '../../../utils/statusColorTokens';
import { formatProposedChanges, REVISION_FIELD_LABELS } from '../../../utils/goalRevisionFieldLabels';
import { formatDateOnly } from '../../../utils/helpers';
import AppButton from '../../common/AppButton';
import AppModal from '../../common/AppModal';

export function RevisionSummary({ revision, goal }: { revision: GoalRevision; goal: Goal | null }) {
  const changes = formatProposedChanges(revision.proposedChanges);

  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">
            Employee
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {revision.employeeName}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">
            Goal
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {revision.goalTitle || revision.goalId}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">
            Requester
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {revision.requestedByName}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">
            Reason
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {revision.reason === 'OTHER' ? revision.otherReason : REVISION_REASON_LABELS[revision.reason]}
          </Typography>
        </Grid>
      </Grid>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Current vs Proposed
        </Typography>
        <Stack spacing={1}>
          {changes.map((change) => {
            const currentValue = goal ? (goal as unknown as Record<string, unknown>)[
              change.field === 'measurementCriteria'
                ? 'successCriteria'
                : change.field === 'dueDate'
                  ? 'targetDate'
                  : change.field
            ] : undefined;

            return (
              <Box key={change.field}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {REVISION_FIELD_LABELS[change.field] ?? change.field}
                </Typography>
                <Typography variant="body2">
                  <span style={{ opacity: 0.6 }}>
                    {currentValue !== undefined && currentValue !== null && currentValue !== ''
                      ? change.field === 'dueDate'
                        ? formatDateOnly(currentValue as string)
                        : String(currentValue)
                      : '—'}
                  </span>
                  {'  →  '}
                  <strong>{change.value}</strong>
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}

type ApproveRevisionDialogProps = {
  open: boolean;
  revision: GoalRevision | null;
  goal: Goal | null;
  isMutating: boolean;
  onApprove: (comment: string) => void;
  onClose: () => void;
};

export function ApproveRevisionDialog({
  open,
  revision,
  goal,
  isMutating,
  onApprove,
  onClose,
}: ApproveRevisionDialogProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) setComment('');
  }, [open, revision?.id]);

  if (!revision) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Approve Revision Request"
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose} disabled={isMutating}>
            Cancel
          </AppButton>
          <AppButton color="success" onClick={() => onApprove(comment)} loading={isMutating}>
            Approve
          </AppButton>
        </>
      }
    >
      <Stack spacing={2.5}>
        <RevisionSummary revision={revision} goal={goal} />
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          label="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Alert severity="info">
          Approving will apply the proposed changes to the goal immediately and record this
          decision in the goal's audit history.
        </Alert>
      </Stack>
    </AppModal>
  );
}

type RejectRevisionDialogProps = {
  open: boolean;
  revision: GoalRevision | null;
  goal: Goal | null;
  isMutating: boolean;
  onReject: (comment: string) => void;
  onClose: () => void;
};

export function RejectRevisionDialog({
  open,
  revision,
  goal,
  isMutating,
  onReject,
  onClose,
}: RejectRevisionDialogProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) setComment('');
  }, [open, revision?.id]);

  if (!revision) return null;

  const trimmed = comment.trim();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Reject Revision Request"
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="outlined" onClick={onClose} disabled={isMutating}>
            Cancel
          </AppButton>
          <AppButton color="error" onClick={() => onReject(trimmed)} disabled={!trimmed} loading={isMutating}>
            Reject
          </AppButton>
        </>
      }
    >
      <Stack spacing={2.5}>
        <RevisionSummary revision={revision} goal={goal} />
        <TextField
          fullWidth
          required
          size="small"
          multiline
          minRows={2}
          label="Reason for rejection *"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          error={!trimmed}
          helperText={!trimmed ? 'A rejection comment is required.' : ' '}
        />
        <Alert severity="warning">The goal will not be changed if this request is rejected.</Alert>
      </Stack>
    </AppModal>
  );
}

type ViewRevisionDetailsDialogProps = {
  open: boolean;
  revision: GoalRevision | null;
  goal: Goal | null;
  onClose: () => void;
};

/** Read-only detail view for an already-reviewed (Approved/Rejected) or Pending request. */
export function ViewRevisionDetailsDialog({
  open,
  revision,
  goal,
  onClose,
}: ViewRevisionDetailsDialogProps) {
  if (!revision) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Revision Request Details"
      subtitle={`Status: ${GOAL_REVISION_STATUS_LABELS[revision.status]}`}
      maxWidth="md"
      actions={<AppButton onClick={onClose}>Close</AppButton>}
    >
      <Stack spacing={2.5}>
        <RevisionSummary revision={revision} goal={goal} />
        {revision.reviewedByName && (
          <Box>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              Reviewed by
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {revision.reviewedByName}
            </Typography>
          </Box>
        )}
        {revision.reviewComment && (
          <Alert severity={revision.status === 'REJECTED' ? 'error' : 'success'}>
            {revision.reviewComment}
          </Alert>
        )}
      </Stack>
    </AppModal>
  );
}
