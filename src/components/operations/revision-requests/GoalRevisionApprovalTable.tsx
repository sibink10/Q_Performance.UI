import { useMemo, useState } from 'react';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal } from '../../../types/goal';
import type { GoalRevision } from '../../../types/goalRevision';
import { REVISION_REASON_LABELS } from '../../../utils/revisionReasonConstants';
import { getGoalRevisionStatusColor, GOAL_REVISION_STATUS_LABELS } from '../../../utils/statusColorTokens';
import { formatProposedChanges } from '../../../utils/goalRevisionFieldLabels';
import { AppCard, AppLoader, AppPagination, EmptyState } from '../../common';
import { ApproveRevisionDialog, RejectRevisionDialog, ViewRevisionDetailsDialog } from './RevisionReviewDialogs';
import GoalHistoryDialog from './GoalHistoryDialog';

const DATE_FORMAT = 'DD MMM YYYY';
const PAGE_SIZE = 10;

type GoalRevisionApprovalTableProps = {
  revisions: GoalRevision[];
  goals: Goal[];
  isLoading?: boolean;
  approveRevision: (id: string, reviewComment: string) => Promise<GoalRevision>;
  rejectRevision: (id: string, reviewComment: string) => Promise<GoalRevision>;
  isMutating: boolean;
  error: string | null;
  successMessage: string | null;
  clearError: () => void;
  clearSuccess: () => void;
};

type DialogState =
  | { kind: 'approve' | 'reject' | 'history' | 'details'; revision: GoalRevision }
  | null;

const GoalRevisionApprovalTable = ({
  revisions,
  goals,
  isLoading = false,
  approveRevision,
  rejectRevision,
  isMutating,
  error,
  successMessage,
  clearError,
  clearSuccess,
}: GoalRevisionApprovalTableProps) => {
  const theme = useTheme();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () => [...revisions].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [revisions],
  );

  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  const goalFor = (goalId: string): Goal | null => goals.find((g) => g.id === goalId) ?? null;

  const closeDialog = () => setDialog(null);

  const handleApprove = async (comment: string) => {
    if (dialog?.kind !== 'approve') return;
    try {
      await approveRevision(dialog.revision.id, comment || 'Approved.');
      closeDialog();
    } catch {
      // error surfaced via the `error` prop
    }
  };

  const handleReject = async (comment: string) => {
    if (dialog?.kind !== 'reject') return;
    try {
      await rejectRevision(dialog.revision.id, comment);
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
        <AppLoader message="Loading revision requests…" />
      ) : sorted.length ? (
        <AppCard sx={{ overflow: 'hidden', p: 0 }}>
          <TableContainer>
            <Table
              size="small"
              sx={{
                tableLayout: 'fixed',
                '& th, & td': { verticalAlign: 'top', py: 1.25 },
              }}
            >
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                  <TableCell sx={{ width: '12%' }}>Employee</TableCell>
                  <TableCell sx={{ width: '15%' }}>Goal</TableCell>
                  <TableCell sx={{ width: '11%' }}>Manager / Requester</TableCell>
                  <TableCell sx={{ width: '9%' }}>Requested Date</TableCell>
                  <TableCell sx={{ width: '20%' }}>Reason</TableCell>
                  <TableCell sx={{ width: '13%' }}>Proposed Change</TableCell>
                  <TableCell align="center" sx={{ width: '8%' }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ width: '12%', whiteSpace: 'nowrap' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((revision) => {
                  const statusColors = getGoalRevisionStatusColor(theme, revision.status);
                  const changes = formatProposedChanges(revision.proposedChanges);
                  const goal = goalFor(revision.goalId);

                  return (
                    <TableRow key={revision.id} hover>
                      <TableCell sx={{ wordBreak: 'break-word' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {revision.employeeName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{revision.goalTitle || revision.goalId}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{revision.requestedByName}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {dayjs(revision.requestedAt).format(DATE_FORMAT)}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>
                        <Typography variant="caption" color="text.secondary">
                          {revision.reason === 'OTHER'
                            ? revision.otherReason
                            : REVISION_REASON_LABELS[revision.reason]}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>
                        {changes.length
                          ? `${changes[0].label}${changes.length > 1 ? ` +${changes.length - 1} more` : ''}`
                          : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={GOAL_REVISION_STATUS_LABELS[revision.status]}
                          sx={{
                            fontWeight: 700,
                            backgroundColor: alpha(statusColors.main, 0.14),
                            color: statusColors.dark,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {revision.status === 'PENDING' ? (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setDialog({ kind: 'approve', revision })}
                                aria-label="Approve revision"
                              >
                                <CheckCircleOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDialog({ kind: 'reject', revision })}
                                aria-label="Reject revision"
                              >
                                <HighlightOffRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : null}
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ kind: 'details', revision })}
                            aria-label="View details"
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View history">
                          <IconButton
                            size="small"
                            onClick={() => setDialog({ kind: 'history', revision })}
                            aria-label="View history"
                          >
                            <HistoryRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <AppPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={sorted.length}
            onPageChange={setPage}
            sx={{ px: 2, pb: 1.5 }}
          />
        </AppCard>
      ) : (
        <AppCard sx={{ p: 3 }}>
          <EmptyState variant="noContent" message="No revision requests match the current filters." minHeight={220} />
        </AppCard>
      )}

      <ApproveRevisionDialog
        open={dialog?.kind === 'approve'}
        revision={dialog?.kind === 'approve' ? dialog.revision : null}
        goal={dialog?.kind === 'approve' ? goalFor(dialog.revision.goalId) : null}
        isMutating={isMutating}
        onApprove={handleApprove}
        onClose={closeDialog}
      />
      <RejectRevisionDialog
        open={dialog?.kind === 'reject'}
        revision={dialog?.kind === 'reject' ? dialog.revision : null}
        goal={dialog?.kind === 'reject' ? goalFor(dialog.revision.goalId) : null}
        isMutating={isMutating}
        onReject={handleReject}
        onClose={closeDialog}
      />
      <ViewRevisionDetailsDialog
        open={dialog?.kind === 'details'}
        revision={dialog?.kind === 'details' ? dialog.revision : null}
        goal={dialog?.kind === 'details' ? goalFor(dialog.revision.goalId) : null}
        onClose={closeDialog}
      />
      <GoalHistoryDialog
        open={dialog?.kind === 'history'}
        goalId={dialog?.kind === 'history' ? dialog.revision.goalId : null}
        goalTitle={dialog?.kind === 'history' ? dialog.revision.goalTitle : undefined}
        onClose={closeDialog}
      />
    </>
  );
};

export default GoalRevisionApprovalTable;
