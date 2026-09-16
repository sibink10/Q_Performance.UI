import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import type { Goal } from '../../../types/goal';
import AppButton from '../AppButton';
import AppModal from '../AppModal';
import GoalCommentsPanel from './GoalCommentsPanel';

type GoalCommentsDialogProps = {
  open: boolean;
  goal: Goal | null;
  employeeName?: string;
  onClose: () => void;
};

const GoalCommentsDialog = ({ open, goal, employeeName, onClose }: GoalCommentsDialogProps) => (
  <AppModal
    open={open}
    onClose={onClose}
    title={goal?.title ?? 'Goal comments'}
    subtitle={employeeName}
    icon={<ChatBubbleOutlineOutlinedIcon />}
    maxWidth="sm"
    actions={
      <AppButton variant="outlined" onClick={onClose}>
        Close
      </AppButton>
    }
  >
    {goal && <GoalCommentsPanel goalId={goal.id} />}
  </AppModal>
);

export default GoalCommentsDialog;
