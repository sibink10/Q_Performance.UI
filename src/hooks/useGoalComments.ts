import { useCallback, useState } from 'react';
import type { GoalComment } from '../types/goalComment';
import useAuth from './useAuth';
import goalCommentsService from '../services/goalCommentsService';
import { getMockUserById, resolveMockUserId } from '../utils/resolveMockUserId';

const useGoalComments = () => {
  const { user } = useAuth();
  const mockUserId = resolveMockUserId(user);
  const currentUser = getMockUserById(mockUserId);

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
      setError(e instanceof Error ? e.message : 'Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(
    async (goalId: string, text: string) => {
      if (!currentUser) {
        setError('Unable to identify the current user.');
        return;
      }
      setIsMutating(true);
      setError(null);
      try {
        const comment = await goalCommentsService.addComment(goalId, {
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          text,
        });
        setComments((prev) => [...prev, comment]);
        setSuccessMessage('Comment posted.');
        return comment;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to post comment.');
        throw e;
      } finally {
        setIsMutating(false);
      }
    },
    [currentUser],
  );

  const deleteComment = useCallback(async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await goalCommentsService.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete comment.');
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
