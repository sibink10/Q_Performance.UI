import { useCallback, useState } from 'react';
import type { GoalTemplate } from '../types/goalTemplate';
import goalTemplatesService, {
  type CreateGoalTemplatePayload,
  type UpdateGoalTemplatePatch,
} from '../services/goalTemplatesService';
import { getApiErrorMessage } from '../utils/helpers';

export default function useGoalTemplates() {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await goalTemplatesService.getGoalTemplates();
      setTemplates(result);
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to load goal templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (payload: CreateGoalTemplatePayload) => {
    setIsMutating(true);
    setError(null);
    try {
      const created = await goalTemplatesService.createGoalTemplate(payload);
      setTemplates((prev) => [...prev, created]);
      setSuccessMessage('Goal template created.');
      return created;
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to create goal template.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, patch: UpdateGoalTemplatePatch) => {
    setIsMutating(true);
    setError(null);
    try {
      const updated = await goalTemplatesService.updateGoalTemplate(id, patch);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSuccessMessage('Goal template updated.');
      return updated;
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to update goal template.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await goalTemplatesService.deleteGoalTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSuccessMessage('Goal template deleted.');
    } catch (e) {
      setError(getApiErrorMessage(e) || 'Failed to delete goal template.');
      throw e;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    templates,
    isLoading,
    isMutating,
    error,
    successMessage,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    clearError,
    clearSuccess,
  };
}
