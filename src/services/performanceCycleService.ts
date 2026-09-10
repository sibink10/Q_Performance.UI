import type { CycleStageStatus, PerformanceCycle } from '../types/performanceCycle';
import { resolveMock } from './mock/mockClient';
import { buildDefaultStages } from './mock/mockData/cycleStageBuilder';
import { mockPerformanceCycles } from './mock/mockData/performanceCycles';

export interface CreateCyclePayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateStagePatch {
  status: CycleStageStatus;
}

export interface AssignEmployeesResult {
  cycleId: string;
  employeeIds: string[];
}

let cycles: PerformanceCycle[] = structuredClone(mockPerformanceCycles);
const employeeAssignments: Record<string, string[]> = {};
let nextCycleCounter = cycles.length + 1;

function findCycle(cycleId: string): PerformanceCycle {
  const cycle = cycles.find((c) => c.id === cycleId);
  if (!cycle) {
    throw new Error('Performance cycle not found');
  }
  return cycle;
}

function findStage(cycle: PerformanceCycle, stageId: string) {
  const stage = cycle.stages.find((s) => s.id === stageId);
  if (!stage) {
    throw new Error('Cycle stage not found');
  }
  return stage;
}

function applyStageTransition(
  cycle: PerformanceCycle,
  stageId: string,
  nextStatus: CycleStageStatus,
): PerformanceCycle {
  const stage = findStage(cycle, stageId);
  const current = stage.status;

  if (nextStatus === 'ACTIVE') {
    if (current !== 'UPCOMING' && current !== 'LOCKED' && current !== 'COMPLETED') {
      throw new Error('Only upcoming, locked, or completed stages can be activated');
    }
    cycle.stages = cycle.stages.map((s) => {
      if (s.id === stageId) return { ...s, status: 'ACTIVE' };
      if (s.status === 'ACTIVE') return { ...s, status: 'COMPLETED' };
      return s;
    });
    if (cycle.status === 'DRAFT') {
      cycle.status = 'ACTIVE';
    }
    return { ...cycle, stages: [...cycle.stages] };
  }

  if (nextStatus === 'LOCKED') {
    if (current !== 'ACTIVE' && current !== 'COMPLETED') {
      throw new Error('Only active or completed stages can be locked');
    }
    cycle.stages = cycle.stages.map((s) =>
      s.id === stageId ? { ...s, status: 'LOCKED' } : s,
    );
    return { ...cycle, stages: [...cycle.stages] };
  }

  if (nextStatus === 'UPCOMING' && current === 'LOCKED') {
    throw new Error('Use activate to reopen a locked stage');
  }

  if (nextStatus !== current) {
    throw new Error('Invalid stage transition');
  }

  return cycle;
}

function replaceCycle(updated: PerformanceCycle): PerformanceCycle {
  cycles = cycles.map((c) => (c.id === updated.id ? updated : c));
  return updated;
}

const performanceCycleService = {
  getCycles: (): Promise<PerformanceCycle[]> =>
    resolveMock([...cycles.map((c) => ({ ...c, stages: [...c.stages] }))]),

  getCycleById: (id: string): Promise<PerformanceCycle> => {
    const cycle = findCycle(id);
    return resolveMock({ ...cycle, stages: [...cycle.stages] });
  },

  createCycle: (payload: CreateCyclePayload): Promise<PerformanceCycle> => {
    const id = `cycle-${nextCycleCounter++}`;
    const startDate = payload.startDate.slice(0, 10);
    const endDate = payload.endDate.slice(0, 10);

    if (new Date(endDate) < new Date(startDate)) {
      return Promise.reject(new Error('End date must be on or after start date'));
    }

    const cycle: PerformanceCycle = {
      id,
      name: payload.name.trim(),
      startDate,
      endDate,
      status: 'DRAFT',
      stages: buildDefaultStages(id, startDate, endDate),
    };

    cycles = [...cycles, cycle];
    return resolveMock({ ...cycle, stages: [...cycle.stages] });
  },

  updateStage: (
    cycleId: string,
    stageId: string,
    patch: UpdateStagePatch,
  ): Promise<PerformanceCycle> => {
    const cycle = structuredClone(findCycle(cycleId));
    const updated = applyStageTransition(cycle, stageId, patch.status);
    return resolveMock(replaceCycle(updated));
  },

  assignEmployees: (cycleId: string, employeeIds: string[]): Promise<AssignEmployeesResult> => {
    findCycle(cycleId);
    employeeAssignments[cycleId] = [...employeeIds];
    return resolveMock({ cycleId, employeeIds: [...employeeIds] });
  },

  getEmployeeAssignments: (): Promise<Record<string, string[]>> =>
    resolveMock({ ...employeeAssignments }),
};

export default performanceCycleService;
