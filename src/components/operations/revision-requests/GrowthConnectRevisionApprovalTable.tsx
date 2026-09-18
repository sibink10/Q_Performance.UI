import { Fragment, useMemo, useState } from 'react';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import {
  Alert,
  Box,
  Chip,
  Collapse,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { GrowthConnectRevision } from '../../../types/growthConnectRevision';
import { GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { REVISION_REASON_LABELS } from '../../../utils/revisionReasonConstants';
import { getGoalRevisionStatusColor, GOAL_REVISION_STATUS_LABELS } from '../../../utils/statusColorTokens';
import { AppCard, AppLoader, EmptyState } from '../../common';
import AppButton from '../../common/AppButton';

const DATE_FORMAT = 'DD MMM YYYY';

type DialogState = { kind: 'approve' | 'reject'; revision: GrowthConnectRevision } | null;

type GrowthConnectRevisionApprovalTableProps = {
  revisions: GrowthConnectRevision[];
  isLoading?: boolean;
  approveRevision: (id: string, reviewComment: string) => Promise<GrowthConnectRevision>;
  rejectRevision: (id: string, reviewComment: string) => Promise<GrowthConnectRevision>;
  isMutating: boolean;
  error: string | null;
  successMessage: string | null;
  clearError: () => void;
  clearSuccess: () => void;
};

const GrowthConnectRevisionApprovalTable = ({
  revisions,
  isLoading = false,
  approveRevision,
  rejectRevision,
  isMutating,
  error,
  successMessage,
  clearError,
  clearSuccess,
}: GrowthConnectRevisionApprovalTableProps) => {
  const theme = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [comment, setComment] = useState('');

  const sorted = useMemo(
    () => [...revisions].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [revisions],
  );

  const closeDialog = () => {
    setDialog(null);
    setComment('');
  };

  const handleConfirm = async () => {
    if (!dialog) return;
    try {
      if (dialog.kind === 'approve') {
        await approveRevision(dialog.revision.id, comment.trim() || 'Approved.');
      } else {
        await rejectRevision(dialog.revision.id, comment.trim());
      }
      closeDialog();
    } catch {
      // error surfaced via the `error` prop
    }
  };

  return (
    <>
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

      {isLoading && !sorted.length ? (
        <AppLoader message="Loading Growth Connect revision requests…" />
      ) : sorted.length ? (
        <AppCard sx={{ overflow: 'hidden', p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Goal / Cycle</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((revision) => {
                  const statusColors = getGoalRevisionStatusColor(theme, revision.status);
                  const expanded = expandedId === revision.id;
                  return (
                    <Fragment key={revision.id}>
                      <TableRow hover onClick={() => setExpandedId(expanded ? null : revision.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {revision.employeeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {revision.goalTitle} — {revision.cycleName}
                        </TableCell>
                        <TableCell>{revision.requestedByName}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(revision.requestedAt).format(DATE_FORMAT)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {revision.reason === 'OTHER' ? revision.otherReason : REVISION_REASON_LABELS[revision.reason]}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={GOAL_REVISION_STATUS_LABELS[revision.status]}
                            sx={{ fontWeight: 700, backgroundColor: alpha(statusColors.main, 0.14), color: statusColors.dark }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                          {revision.status === 'PENDING' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton size="small" color="success" onClick={() => setDialog({ kind: 'approve', revision })} aria-label="Approve revision">
                                  <CheckCircleOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton size="small" color="error" onClick={() => setDialog({ kind: 'reject', revision })} aria-label="Reject revision">
                                  <HighlightOffRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <IconButton size="small" onClick={() => setExpandedId(expanded ? null : revision.id)} aria-label={expanded ? 'Collapse' : 'Expand'}>
                            <ExpandMoreRoundedIcon sx={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, border: expanded ? undefined : 'none' }}>
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2 }}>
                              <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                                {revision.proposedManagerStatus && (
                                  <Typography variant="body2">
                                    <strong>Proposed status:</strong> {GOAL_STATUS_LABELS[revision.proposedManagerStatus]}
                                  </Typography>
                                )}
                                {revision.proposedManagerFeedback && (
                                  <Typography variant="body2">
                                    <strong>Proposed feedback:</strong> {revision.proposedManagerFeedback}
                                  </Typography>
                                )}
                              </Stack>
                              {revision.reviewComment && (
                                <Alert severity={revision.status === 'REJECTED' ? 'error' : 'success'}>
                                  {revision.reviewComment}
                                </Alert>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AppCard>
      ) : (
        <AppCard sx={{ p: 3 }}>
          <EmptyState variant="noContent" message="No Growth Connect revision requests match the current filters." minHeight={220} />
        </AppCard>
      )}

      <Dialog open={Boolean(dialog)} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.kind === 'approve' ? 'Approve revision request?' : 'Reject revision request?'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            label={dialog?.kind === 'reject' ? 'Reason (required)' : 'Comment (optional)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <AppButton variant="outlined" onClick={closeDialog} disabled={isMutating}>
            Cancel
          </AppButton>
          <AppButton
            color={dialog?.kind === 'reject' ? 'error' : 'primary'}
            onClick={handleConfirm}
            disabled={isMutating || (dialog?.kind === 'reject' && !comment.trim())}
            loading={isMutating}
          >
            {dialog?.kind === 'approve' ? 'Approve' : 'Reject'}
          </AppButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GrowthConnectRevisionApprovalTable;
