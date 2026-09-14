import { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { AppCard, PageHeader } from '../../common';
import AppButton from '../../common/AppButton';
import usePerformanceCycle from '../../../hooks/usePerformanceCycle';
import goalsService from '../../../services/goalsService';
import type { MockUser } from '../../../types/user';
import AssignGoalModal, { type AssignGoalSubmitPayload } from './AssignGoalModal';

const GoalConfig = () => {
  const { cycles } = usePerformanceCycle();

  const [employees, setEmployees] = useState<MockUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    goalsService.getAssignableEmployees().then(setEmployees);
  }, []);

  const handleSubmit = async (payload: AssignGoalSubmitPayload) => {
    const { employeeIds, ...sharedFields } = payload;
    setIsSubmitting(true);
    setError(null);
    try {
      await Promise.all(
        employeeIds.map((employeeId) => goalsService.createGoal({ ...sharedFields, employeeId })),
      );
      setSuccessMessage(
        `Goal assigned to ${employeeIds.length} ${employeeIds.length === 1 ? 'person' : 'people'}.`,
      );
      setIsModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Goal Configuration"
        subtitle="Create performance goals and assign them to employees and managers."
        actions={
          <AppButton startIcon={<AddRoundedIcon />} onClick={() => setIsModalOpen(true)}>
            Assign Goal
          </AppButton>
        }
      />

      {(error || successMessage) && (
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => {
            setError(null);
            setSuccessMessage(null);
          }}
        >
          {error || successMessage}
        </Alert>
      )}

      <AppCard sx={{ p: 3 }}>
        <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
          Use "Assign Goal" to create a goal and assign it to one or more employees or managers.
        </Box>
      </AppCard>

      <AssignGoalModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employees={employees}
        cycles={cycles}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
};

export default GoalConfig;
