import { useCallback, useState } from 'react';
import type { GoalCategoryDto, CreateGoalCategoryPayload, UpdateGoalCategoryPayload } from '../types/goalCategory';
import goalCategoriesService from '../services/goalCategoriesService';
import { getApiErrorMessage } from '../utils/helpers';

export default function useGoalCategories() {
  const [categories, setCategories] = useState<GoalCategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await goalCategoriesService.getGoalCategories();
      setCategories(result);
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load goal categories.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (payload: CreateGoalCategoryPayload) => {
    setIsMutating(true);
    setError(null);
    try {
      const created = await goalCategoriesService.createGoalCategory(payload);
      setCategories((prev) => [...prev, created]);
      setSuccessMessage('Goal category created.');
      return created;
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to create goal category.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, payload: UpdateGoalCategoryPayload) => {
    setIsMutating(true);
    setError(null);
    try {
      const updated = await goalCategoriesService.updateGoalCategory(id, payload);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSuccessMessage('Goal category updated.');
      return updated;
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to update goal category.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await goalCategoriesService.deleteGoalCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage('Goal category deleted.');
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to delete goal category.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    categories,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    clearSuccess,
  };
}
