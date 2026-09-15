import GoalHistoryTimeline from '../../employee/goals/GoalHistoryTimeline';
import AppButton from '../../common/AppButton';
import AppModal from '../../common/AppModal';

type GoalHistoryDialogProps = {
  open: boolean;
  goalId: string | null;
  goalTitle?: string;
  onClose: () => void;
};

const GoalHistoryDialog = ({ open, goalId, goalTitle, onClose }: GoalHistoryDialogProps) => (
  <AppModal
    open={open}
    onClose={onClose}
    title="Goal History"
    subtitle={goalTitle}
    maxWidth="sm"
    actions={<AppButton onClick={onClose}>Close</AppButton>}
  >
    {goalId ? <GoalHistoryTimeline goalId={goalId} /> : null}
  </AppModal>
);

export default GoalHistoryDialog;
