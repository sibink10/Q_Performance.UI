import type { PerformanceCycle } from '../../../types/performanceCycle';
import { CYCLE_STAGE_LABELS, CYCLE_STAGE_ORDER } from '../../../utils/cycleStageConstants';

const CYCLE_ID = 'cycle-2026-27';

function buildSeededStages(): PerformanceCycle['stages'] {
  const stageWindows: Array<{ start: string; end: string; status: PerformanceCycle['stages'][0]['status'] }> = [
    { start: '2026-04-01', end: '2026-05-15', status: 'COMPLETED' },
    { start: '2026-07-01', end: '2026-07-31', status: 'COMPLETED' },
    { start: '2026-10-01', end: '2026-10-31', status: 'ACTIVE' },
    { start: '2027-01-01', end: '2027-01-31', status: 'UPCOMING' },
    { start: '2027-02-01', end: '2027-02-28', status: 'UPCOMING' },
    { start: '2027-03-01', end: '2027-03-15', status: 'UPCOMING' },
    { start: '2027-03-16', end: '2027-03-22', status: 'UPCOMING' },
    { start: '2027-03-23', end: '2027-03-27', status: 'UPCOMING' },
    { start: '2027-03-28', end: '2027-03-31', status: 'UPCOMING' },
  ];

  return CYCLE_STAGE_ORDER.map((stageKey, index) => ({
    id: `${CYCLE_ID}-stage-${index + 1}`,
    cycleId: CYCLE_ID,
    stageKey,
    name: CYCLE_STAGE_LABELS[stageKey],
    startDate: stageWindows[index].start,
    endDate: stageWindows[index].end,
    status: stageWindows[index].status,
    order: index + 1,
  }));
}

export const mockPerformanceCycles: PerformanceCycle[] = [
  {
    id: CYCLE_ID,
    name: '2026-27 Performance Cycle',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    status: 'ACTIVE',
    stages: buildSeededStages(),
  },
];

export const ACTIVE_CYCLE_ID = CYCLE_ID;
