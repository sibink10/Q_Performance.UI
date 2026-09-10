import type { CycleStage, CycleStageStatus } from '../../../types/performanceCycle';
import { CYCLE_STAGE_LABELS, CYCLE_STAGE_ORDER } from '../../../utils/cycleStageConstants';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Splits a cycle date range into equal windows for each of the 9 standard stages.
 */
export function buildDefaultStages(
  cycleId: string,
  startDate: string,
  endDate: string,
  defaultStatus: CycleStageStatus = 'UPCOMING',
): CycleStage[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const stageCount = CYCLE_STAGE_ORDER.length;
  const daysPerStage = Math.max(1, Math.floor(totalDays / stageCount));

  return CYCLE_STAGE_ORDER.map((stageKey, index) => {
    const stageStart = addDays(start, index * daysPerStage);
    const isLast = index === stageCount - 1;
    const stageEnd = isLast ? end : addDays(stageStart, daysPerStage - 1);

    return {
      id: `${cycleId}-stage-${index + 1}`,
      cycleId,
      stageKey,
      name: CYCLE_STAGE_LABELS[stageKey],
      startDate: toIsoDate(stageStart),
      endDate: toIsoDate(stageEnd),
      status: defaultStatus,
      order: index + 1,
    };
  });
}
