import { useEffect, useMemo, useState } from 'react';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { GoalComment } from '../../../types/goalComment';
import type { UserRole } from '../../../types/user';
import AppButton from '../AppButton';
import ConfirmDialog from '../ConfirmDialog';
import useGoalComments from '../../../hooks/useGoalComments';

const DATE_FORMAT = 'DD MMM YYYY, h:mm A';

const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  HR: 'HR',
  ADMIN: 'Admin',
};

const ROLE_COLOR: Record<UserRole, 'info' | 'primary' | 'success' | 'secondary'> = {
  EMPLOYEE: 'info',
  MANAGER: 'primary',
  HR: 'success',
  ADMIN: 'secondary',
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

type GoalCommentsPanelProps = {
  goalId: string;
  onChanged?: () => void;
};

const GoalCommentsPanel = ({ goalId, onChanged }: GoalCommentsPanelProps) => {
  const theme = useTheme();
  const {
    comments,
    currentUser,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadComments,
    addComment,
    deleteComment,
    clearError,
    clearSuccess,
  } = useGoalComments();

  const [draft, setDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GoalComment | null>(null);

  useEffect(() => {
    loadComments(goalId);
  }, [loadComments, goalId]);

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()),
    [comments],
  );

  const handlePost = async () => {
    const text = draft.trim();
    if (!text) return;
    await addComment(goalId, text);
    setDraft('');
    onChanged?.();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteComment(deleteTarget.id);
    setDeleteTarget(null);
    onChanged?.();
  };

  const canDelete = (comment: GoalComment) =>
    currentUser?.id === comment.authorId || currentUser?.role === 'ADMIN';

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

      {currentUser && (
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.8rem',
              fontWeight: 700,
              bgcolor: alpha(theme.palette[ROLE_COLOR[currentUser.role]].main, 0.14),
              color: theme.palette[ROLE_COLOR[currentUser.role]].dark,
              flexShrink: 0,
            }}
          >
            {getInitials(currentUser.name)}
          </Avatar>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isMutating}
            />
            <Stack direction="row" justifyContent="flex-end">
              <AppButton
                size="small"
                startIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={handlePost}
                loading={isMutating}
                disabled={!draft.trim()}
              >
                Post comment
              </AppButton>
            </Stack>
          </Stack>
        </Stack>
      )}

      {isLoading && !sortedComments.length ? (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : sortedComments.length ? (
        <Stack spacing={2}>
          {sortedComments.map((comment) => {
            const roleColor = theme.palette[ROLE_COLOR[comment.authorRole]];
            return (
              <Box
                key={comment.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  '&:hover .comment-delete': { opacity: 1 },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    bgcolor: alpha(roleColor.main, 0.14),
                    color: roleColor.dark,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(comment.authorName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {comment.authorName}
                    </Typography>
                    <Chip
                      size="small"
                      color={ROLE_COLOR[comment.authorRole]}
                      label={ROLE_LABELS[comment.authorRole]}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(comment.createdAt).format(DATE_FORMAT)}
                    </Typography>
                    {canDelete(comment) && (
                      <Tooltip title="Delete comment">
                        <IconButton
                          className="comment-delete"
                          size="small"
                          onClick={() => setDeleteTarget(comment)}
                          sx={{ ml: 'auto', opacity: 0, transition: 'opacity 0.15s ease' }}
                          aria-label="Delete comment"
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                  >
                    {comment.text}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Box
          sx={{
            py: 3,
            textAlign: 'center',
            borderRadius: 2.5,
            border: '1px dashed',
            borderColor: alpha(theme.palette.grey[500], 0.3),
          }}
        >
          <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            No comments yet — start the conversation.
          </Typography>
        </Box>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete comment"
        message="Delete this comment? This action can't be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={isMutating}
      />
    </Stack>
  );
};

export default GoalCommentsPanel;
