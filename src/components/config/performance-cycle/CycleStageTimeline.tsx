import { Box, Chip, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { CycleStage, PerformanceCycle } from '../../../types/performanceCycle';
import { CYCLE_STAGE_STATUS_PALETTE_KEY } from '../../../utils/statusColorTokens';
import AppButton from '../../common/AppButton';

const DATE_FORMAT = 'DD/MM/YYYY';

const STAGE_STATUS_LABELS: Record<CycleStage['status'], string> = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  LOCKED: 'Locked',
};

type PendingAction = {
  type: 'lock' | 'reopen';
  cycleId: string;
  stageId: string;
  stageName: string;
};

type CycleStageTimelineProps = {
  cycle: PerformanceCycle;
  isMutating?: boolean;
  onActivate: (cycleId: string, stageId: string) => void;
  onRequestLock: (action: PendingAction) => void;
  onRequestReopen: (action: PendingAction) => void;
};

const CycleStageTimeline = ({
  cycle,
  isMutating = false,
  onActivate,
  onRequestLock,
  onRequestReopen,
}: CycleStageTimelineProps) => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
      Cycle Stages — {cycle.name}
    </Typography>
    <Stack spacing={1.5}>
      {[...cycle.stages]
        .sort((a, b) => a.order - b.order)
        .map((stage) => {
          const chipColor = CYCLE_STAGE_STATUS_PALETTE_KEY[stage.status];
          const canActivate = stage.status === 'UPCOMING' || stage.status === 'LOCKED';
          const canLock = stage.status === 'ACTIVE' || stage.status === 'COMPLETED';
          const canReopen = stage.status === 'LOCKED';

          return (
            <Box
              key={stage.id}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 24 }}>
                {stage.order}.
              </Typography>
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {stage.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deadline: {dayjs(stage.endDate).format(DATE_FORMAT)}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={STAGE_STATUS_LABELS[stage.status]}
                color={chipColor}
              />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {canActivate && (
                  <AppButton
                    size="small"
                    onClick={() => onActivate(cycle.id, stage.id)}
                    disabled={isMutating}
                  >
                    Activate
                  </AppButton>
                )}
                {canLock && (
                  <AppButton
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      onRequestLock({
                        type: 'lock',
                        cycleId: cycle.id,
                        stageId: stage.id,
                        stageName: stage.name,
                      })
                    }
                    disabled={isMutating}
                  >
                    Lock
                  </AppButton>
                )}
                {canReopen && (
                  <AppButton
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      onRequestReopen({
                        type: 'reopen',
                        cycleId: cycle.id,
                        stageId: stage.id,
                        stageName: stage.name,
                      })
                    }
                    disabled={isMutating}
                  >
                    Reopen
                  </AppButton>
                )}
              </Stack>
            </Box>
          );
        })}
    </Stack>
  </Box>
);

export type { PendingAction };
export default CycleStageTimeline;
