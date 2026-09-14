import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import { Box, Chip, Drawer, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { PerformanceCycle } from '../../../types/performanceCycle';
import AppButton from '../../common/AppButton';
import CycleStageTimeline, { type PendingAction } from './CycleStageTimeline';
import { getCycleCompletionPercent } from './PerformanceCyclesTable';

const DATE_FORMAT = 'DD MMM YYYY';
const DRAWER_WIDTH = 640;

const CYCLE_STATUS_LABELS: Record<PerformanceCycle['status'], string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

const CYCLE_STATUS_COLORS: Record<PerformanceCycle['status'], 'default' | 'success' | 'warning'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  CLOSED: 'warning',
};

type CycleStagesDrawerProps = {
  open: boolean;
  cycle: PerformanceCycle | null;
  isMutating?: boolean;
  onActivate: (cycleId: string, stageId: string) => void;
  onRequestLock: (action: PendingAction) => void;
  onRequestReopen: (action: PendingAction) => void;
  onClose: () => void;
};

const CycleStagesDrawer = ({
  open,
  cycle,
  isMutating = false,
  onActivate,
  onRequestLock,
  onRequestReopen,
  onClose,
}: CycleStagesDrawerProps) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: DRAWER_WIDTH },
          borderLeft: '1px solid',
          borderColor: 'divider',
          backgroundColor: theme.palette.background.default,
          boxShadow: 'none',
        },
      }}
    >
      {cycle && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header band */}
          <Box
            sx={{
              px: 3,
              pt: 3,
              pb: 2.5,
              backgroundColor: theme.palette.background.paper,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Performance Cycle
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', pr: 1 }}>
                  {cycle.name}
                </Typography>
              </Box>
              <IconButton
                onClick={onClose}
                aria-label="Close cycle stages"
                sx={{
                  backgroundColor: alpha(theme.palette.grey[900], 0.04),
                  '&:hover': { backgroundColor: alpha(theme.palette.grey[900], 0.08) },
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
              <Chip
                size="small"
                label={CYCLE_STATUS_LABELS[cycle.status]}
                color={CYCLE_STATUS_COLORS[cycle.status]}
              />
              <Chip
                size="small"
                variant="outlined"
                icon={<EventRoundedIcon sx={{ fontSize: 16 }} />}
                label={`${dayjs(cycle.startDate).format(DATE_FORMAT)} – ${dayjs(cycle.endDate).format(DATE_FORMAT)}`}
              />
            </Stack>

            <Box sx={{ mt: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Completion
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {getCycleCompletionPercent(cycle.stages)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={getCycleCompletionPercent(cycle.stages)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>

          {/* Scrollable body */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
            <CycleStageTimeline
              cycle={cycle}
              isMutating={isMutating}
              onActivate={onActivate}
              onRequestLock={onRequestLock}
              onRequestReopen={onRequestReopen}
            />
          </Box>

          {/* Footer */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <AppButton variant="outlined" fullWidth onClick={onClose}>
              Close
            </AppButton>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default CycleStagesDrawer;
