import { useEffect, useState, type ReactNode } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Goal } from '../../../types/goal';
import type { GoalGrowthConnectEntry } from '../../../types/growthConnect';
import { GOAL_CATEGORY_LABELS } from '../../../utils/goalConstants';
import { GOAL_CATEGORY_META } from '../../../utils/goalCategoryMeta';
import AppButton from '../../common/AppButton';
import GrowthConnectPanel from '../../common/growth-connect/GrowthConnectPanel';
import GoalHistoryTimeline from './GoalHistoryTimeline';
import GoalStatusBadge from './GoalStatusBadge';

const DATE_FORMAT = 'DD MMM YYYY';
const DRAWER_WIDTH = 640;

type GoalDetailDrawerProps = {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  /** Which tab to show when the drawer opens (or the goal/tab request changes). Defaults to 'details'. */
  initialTab?: 'details' | 'growthConnect' | 'history';
  /** Shown above the goal title — used by manager/admin views to identify whose goal this is. */
  employeeName?: string;
  /** Forwarded to the Growth Connect tab; omit to hide the "Request revision" action there. */
  onRequestRevision?: (entry: GoalGrowthConnectEntry) => void;
};

type DetailSectionProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  muted?: boolean;
};

function DetailSection({ icon, title, children, muted = false }: DetailSectionProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: muted ? alpha(theme.palette.grey[500], 0.2) : 'divider',
        backgroundColor: muted
          ? alpha(theme.palette.grey[500], 0.04)
          : alpha(theme.palette.background.paper, 0.9),
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

const GoalDetailDrawer = ({
  open,
  goal,
  onClose,
  initialTab,
  employeeName,
  onRequestRevision,
}: GoalDetailDrawerProps) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'details' | 'growthConnect' | 'history'>(initialTab ?? 'details');

  useEffect(() => {
    if (open && goal) {
      setActiveTab(initialTab ?? 'details');
    }
  }, [open, goal?.id, initialTab]);

  if (!goal) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: DRAWER_WIDTH },
            boxShadow: 'none',
          },
        }}
      />
    );
  }

  const categoryMeta = GOAL_CATEGORY_META[goal.category];
  const CategoryIcon = categoryMeta.Icon;
  const categoryAccent = categoryMeta.accent(theme);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header band */}
        <Box
          sx={{
            position: 'relative',
            px: 3,
            pt: 3,
            pb: 2.5,
            backgroundColor: theme.palette.background.paper,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: categoryAccent.soft,
                  border: '1px solid',
                  borderColor: categoryAccent.border,
                  color: categoryAccent.main,
                  flexShrink: 0,
                }}
              >
                <CategoryIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                {employeeName && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    {employeeName}
                  </Typography>
                )}
                <Typography variant="overline" sx={{ fontWeight: 600, color: categoryAccent.main }}>
                  {GOAL_CATEGORY_LABELS[goal.category]}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.35,
                    pr: 1,
                  }}
                >
                  {goal.title}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={onClose}
              aria-label="Close goal details"
              sx={{
                backgroundColor: alpha(theme.palette.grey[900], 0.04),
                '&:hover': { backgroundColor: alpha(theme.palette.grey[900], 0.08) },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            <GoalStatusBadge status={goal.status} size="small" />
          </Stack>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_e, value) => setActiveTab(value)}
          sx={{
            px: 3,
            minHeight: 40,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Tab value="details" label="Details" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
          <Tab
            value="growthConnect"
            label="Growth Connect"
            sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
          />
          <Tab value="history" label="History" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {/* Scrollable body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          {activeTab === 'history' ? (
            <GoalHistoryTimeline goalId={goal.id} />
          ) : activeTab === 'growthConnect' ? (
            <GrowthConnectPanel goal={goal} onRequestRevision={onRequestRevision} />
          ) : (
          <Stack spacing={2}>
            <DetailSection
              icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />}
              title="Description"
            >
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {goal.description}
              </Typography>
            </DetailSection>

            <DetailSection icon={<FlagOutlinedIcon sx={{ fontSize: 18 }} />} title="Success criteria">
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {goal.successCriteria}
              </Typography>
            </DetailSection>

            <DetailSection icon={<ScheduleOutlinedIcon sx={{ fontSize: 18 }} />} title="Timeline">
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                divider={<Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Start date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {dayjs(goal.startDate).format(DATE_FORMAT)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Target date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {dayjs(goal.targetDate).format(DATE_FORMAT)}
                  </Typography>
                </Box>
              </Stack>
            </DetailSection>

            <DetailSection
              icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 18 }} />}
              title="Evidence"
              muted
            >
              <Box
                sx={{
                  py: 2,
                  px: 2,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: alpha(theme.palette.grey[500], 0.35),
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Attach and review supporting evidence in a future update.
                </Typography>
              </Box>
            </DetailSection>
          </Stack>
          )}
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
            Close details
          </AppButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default GoalDetailDrawer;
