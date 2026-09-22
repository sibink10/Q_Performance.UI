import { useEffect, useMemo, useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Alert,
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { GoalRevision } from '../../../types/goalRevision';
import type { GrowthConnectRevision } from '../../../types/growthConnectRevision';
import { GOAL_STATUS_LABELS } from '../../../utils/goalConstants';
import { REVISION_REASON_LABELS } from '../../../utils/revisionReasonConstants';
import { getGoalRevisionStatusColor, GOAL_REVISION_STATUS_LABELS } from '../../../utils/statusColorTokens';
import { formatProposedChanges, REVISION_FIELD_LABELS } from '../../../utils/goalRevisionFieldLabels';
import { AppCard, AppLoader, EmptyState, PageHeader } from '../../common';
import useGoalRevisions from '../../../hooks/useGoalRevisions';
import useGrowthConnectRevisions from '../../../hooks/useGrowthConnectRevisions';

type RequestKind = 'GOAL' | 'GROWTH_CONNECT';

type GrowthConnectRevisionRowProps = {
  revision: GrowthConnectRevision;
  expanded: boolean;
  onToggle: () => void;
};

const GrowthConnectRevisionRow = ({ revision, expanded, onToggle }: GrowthConnectRevisionRowProps) => {
  const theme = useTheme();
  const statusColors = getGoalRevisionStatusColor(theme, revision.status);

  return (
    <>
      <TableRow hover onClick={onToggle} sx={{ cursor: 'pointer' }}>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {revision.employeeName}
          </Typography>
        </TableCell>
        <TableCell>
          {revision.goalTitle} — {revision.cycleName}
        </TableCell>
        <TableCell>
          {revision.reason === 'OTHER' ? revision.otherReason : REVISION_REASON_LABELS[revision.reason]}
        </TableCell>
        <TableCell>{dayjs(revision.requestedAt).format('DD MMM YYYY')}</TableCell>
        <TableCell>
          <Chip
            size="small"
            label={GOAL_REVISION_STATUS_LABELS[revision.status]}
            sx={{ fontWeight: 600, backgroundColor: alpha(statusColors.main, 0.14), color: statusColors.dark }}
          />
        </TableCell>
        <TableCell>{revision.reviewedByName || '—'}</TableCell>
        <TableCell>{revision.reviewedAt ? dayjs(revision.reviewedAt).format('DD MMM YYYY') : '—'}</TableCell>
        <TableCell align="right">
          <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
            <ExpandMoreRoundedIcon sx={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, border: expanded ? undefined : 'none' }}>
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
                <Alert severity={revision.status === 'REJECTED' ? 'error' : 'success'}>{revision.reviewComment}</Alert>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const DATE_FORMAT = 'DD MMM YYYY';

type RevisionRowProps = {
  revision: GoalRevision;
  expanded: boolean;
  onToggle: () => void;
};

const RevisionRow = ({ revision, expanded, onToggle }: RevisionRowProps) => {
  const theme = useTheme();
  const statusColors = getGoalRevisionStatusColor(theme, revision.status);
  const changes = formatProposedChanges(revision.proposedChanges);
  const { goalHistory, getGoalHistory } = useGoalRevisions();

  useEffect(() => {
    if (expanded && revision.status === 'APPROVED') {
      getGoalHistory(revision.goalId);
    }
  }, [expanded, revision.status, revision.goalId, getGoalHistory]);

  const appliedChanges = useMemo(
    () =>
      goalHistory.filter(
        (entry) => entry.revisionRequestId === revision.id && entry.action === 'Goal Updated',
      ),
    [goalHistory, revision.id],
  );

  return (
    <>
      <TableRow hover onClick={onToggle} sx={{ cursor: 'pointer' }}>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {revision.employeeName}
          </Typography>
        </TableCell>
        <TableCell>{revision.goalTitle || revision.goalId}</TableCell>
        <TableCell>
          {revision.reason === 'OTHER' ? revision.otherReason : REVISION_REASON_LABELS[revision.reason]}
        </TableCell>
        <TableCell>{dayjs(revision.requestedAt).format(DATE_FORMAT)}</TableCell>
        <TableCell>
          {changes.length ? `${changes[0].label}${changes.length > 1 ? ` +${changes.length - 1} more` : ''}` : '—'}
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            label={GOAL_REVISION_STATUS_LABELS[revision.status]}
            sx={{
              fontWeight: 600,
              backgroundColor: alpha(statusColors.main, 0.14),
              color: statusColors.dark,
            }}
          />
        </TableCell>
        <TableCell>{revision.reviewedByName || '—'}</TableCell>
        <TableCell>{revision.reviewedAt ? dayjs(revision.reviewedAt).format(DATE_FORMAT) : '—'}</TableCell>
        <TableCell align="right">
          <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
            <ExpandMoreRoundedIcon
              sx={{
                transition: 'transform 0.2s ease',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, border: expanded ? undefined : 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Proposed changes
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5, mb: 1.5 }}>
                {changes.map((change) => (
                  <Typography key={change.field} variant="body2">
                    <strong>{change.label}:</strong> {change.value}
                  </Typography>
                ))}
              </Stack>

              {revision.status === 'APPROVED' && appliedChanges.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Original → Approved
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5, mb: 1.5 }}>
                    {appliedChanges.map((entry) => (
                      <Typography key={entry.id} variant="body2">
                        <strong>{REVISION_FIELD_LABELS[entry.field ?? ''] ?? entry.field}:</strong>{' '}
                        {entry.oldValue || '—'} → {entry.newValue || '—'}
                      </Typography>
                    ))}
                  </Stack>
                </>
              )}

              {revision.reviewComment && (
                <Alert severity={revision.status === 'REJECTED' ? 'error' : 'success'} sx={{ mt: 1 }}>
                  {revision.reviewComment}
                </Alert>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ManagerRevisionRequestsList = () => {
  const {
    managerRequests,
    isLoading,
    error,
    getManagerRevisionRequests,
    clearError,
  } = useGoalRevisions();
  const {
    managerRequests: growthConnectRequests,
    isLoading: isGrowthConnectLoading,
    error: growthConnectError,
    getManagerRevisionRequests: getGrowthConnectManagerRequests,
    clearError: clearGrowthConnectError,
  } = useGrowthConnectRevisions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [requestKind, setRequestKind] = useState<RequestKind>('GOAL');

  useEffect(() => {
    getManagerRevisionRequests();
    getGrowthConnectManagerRequests();
  }, [getManagerRevisionRequests, getGrowthConnectManagerRequests]);

  const sortedRequests = useMemo(
    () =>
      [...managerRequests].sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      ),
    [managerRequests],
  );

  const sortedGrowthConnectRequests = useMemo(
    () =>
      [...growthConnectRequests].sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      ),
    [growthConnectRequests],
  );

  return (
    <Box>
      <PageHeader
        title="My Requests"
        subtitle="Revision requests you've submitted for your direct reports' finalized goals and Growth Connect cycles."
      />

      <Tabs value={requestKind} onChange={(_e, value) => setRequestKind(value)} sx={{ mb: 2, minHeight: 40 }}>
        <Tab value="GOAL" label="Goal Requests" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
        <Tab
          value="GROWTH_CONNECT"
          label="Growth Connect Requests"
          sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
        />
      </Tabs>

      {requestKind === 'GOAL' && error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}
      {requestKind === 'GROWTH_CONNECT' && growthConnectError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearGrowthConnectError}>
          {growthConnectError}
        </Alert>
      )}

      {requestKind === 'GROWTH_CONNECT' ? (
        isGrowthConnectLoading && !sortedGrowthConnectRequests.length ? (
          <AppLoader message="Loading your requests…" />
        ) : sortedGrowthConnectRequests.length ? (
          <AppCard sx={{ overflow: 'hidden', p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                    <TableCell>Employee</TableCell>
                    <TableCell>Goal / Cycle</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reviewed By</TableCell>
                    <TableCell>Reviewed Date</TableCell>
                    <TableCell align="right"> </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedGrowthConnectRequests.map((revision) => (
                    <GrowthConnectRevisionRow
                      key={revision.id}
                      revision={revision}
                      expanded={expandedId === revision.id}
                      onToggle={() => setExpandedId((prev) => (prev === revision.id ? null : revision.id))}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AppCard>
        ) : (
          <AppCard sx={{ p: 3 }}>
            <EmptyState variant="noContent" message="You haven't submitted any Growth Connect revision requests yet." minHeight={220} />
          </AppCard>
        )
      ) : isLoading && !sortedRequests.length ? (
        <AppLoader message="Loading your requests…" />
      ) : sortedRequests.length ? (
        <AppCard sx={{ overflow: 'hidden', p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Goal</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Proposed Change</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reviewed By</TableCell>
                  <TableCell>Reviewed Date</TableCell>
                  <TableCell align="right"> </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRequests.map((revision) => (
                  <RevisionRow
                    key={revision.id}
                    revision={revision}
                    expanded={expandedId === revision.id}
                    onToggle={() => setExpandedId((prev) => (prev === revision.id ? null : revision.id))}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AppCard>
      ) : (
        <AppCard sx={{ p: 3 }}>
          <EmptyState variant="noContent" message="You haven't submitted any revision requests yet." minHeight={220} />
        </AppCard>
      )}
    </Box>
  );
};

export default ManagerRevisionRequestsList;
