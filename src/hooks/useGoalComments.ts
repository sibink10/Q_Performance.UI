import { useCallback, useState } from 'react';
import type { GoalComment } from '../types/goalComment';
import type { UserRole } from '../types/user';
import useAuth from './useAuth';
import goalCommentsService from '../services/goalCommentsService';
import { getApiErrorMessage } from '../utils/helpers';

const useGoalComments = () => {
  const { user } = useAuth();
  const currentUser = user
    ? {
        id: user.employeeId ?? '',
        name: user.name ?? '',
        role: String(user.role ?? 'EMPLOYEE').toUpperCase() as UserRole,
      }
    : null;

  const [comments, setComments] = useState<GoalComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadComments = useCallback(async (goalId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setComments(await goalCommentsService.getCommentsByGoal(goalId));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(
    async (goalId: string, text: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const comment = await goalCommentsService.addComment(goalId, { text });
        setComments((prev) => [...prev, comment]);
        setSuccessMessage('Comment posted.');
        return comment;
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to post comment.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const deleteComment = useCallback(async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await goalCommentsService.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to delete comment.');
    } finally {
      setIsMutating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  return {
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
  };
};

export default useGoalComments;
