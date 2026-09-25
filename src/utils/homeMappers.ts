// @ts-nocheck
// Pure helpers that turn raw API payloads into Home dashboard data.
import dayjs from 'dayjs';

const pick = (o, ...keys) => {
  for (const k of keys) {
    if (o?.[k] != null && o[k] !== '') return o[k];
  }
  return undefined;
};

/** Rows from `{ data: [...] }`, `{ data: { data: [...] } }` or a bare array. */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  const l1 = payload?.data ?? payload?.Data;
  if (Array.isArray(l1)) return l1;
  const l2 = l1?.data ?? l1?.Data ?? l1?.items ?? l1?.Items;
  return Array.isArray(l2) ? l2 : [];
}

/** Total row count from a paged envelope, falling back to the list length. */
export function unwrapTotal(payload) {
  const inner = payload?.data ?? payload;
  const n = Number(inner?.totalCount ?? inner?.TotalCount ?? payload?.totalCount);
  return Number.isFinite(n) && n > 0 ? n : unwrapList(payload).length;
}

export function unwrapItem(payload) {
  const d = payload?.data ?? payload;
  return d && typeof d === 'object' && !Array.isArray(d) ? d : null;
}

export const isSubmitted = (status) => /^(submitted|completed|published)$/i.test(String(status ?? '').trim());

export const cycleStatusFromApi = (status) => {
  const s = String(status ?? '').toUpperCase();
  if (s === 'OPEN') return 'ACTIVE';
  if (s === 'CLOSED') return 'CLOSED';
  return 'UPCOMING';
};

export const mapCycles = (rawList) =>
  (rawList || [])
    .map((c) => ({
      id: String(c.id),
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      status: cycleStatusFromApi(c.status),
    }))
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

export const roleLabel = (role) => {
  const r = String(role ?? '').toUpperCase();
  if (r === 'ADMIN') return 'Admin';
  if (r === 'HR') return 'HR';
  if (r === 'MANAGER') return 'Manager';
  return 'Employee';
};

export const mapProfile = (user, fallback) => {
  const name = pick(user, 'fullName') || fallback?.name || '';
  return {
    name,
    employeeId: pick(user, 'employeeId') || fallback?.employeeId,
    title: pick(user, 'designation'),
    roleLabel: roleLabel(pick(user, 'role') || fallback?.role),
    reportingManager: pick(user, 'managerName'),
    email: pick(user, 'email') || fallback?.email,
    phone: pick(user, 'phoneNumber'),
    joinedOn: pick(user, 'dateOfJoining'),
  };
};

export function goalStats(goals) {
  const total = goals.length;
  const completed = goals.filter((g) => String(g.status).toUpperCase() === 'COMPLETED').length;
  return { total, completed, active: total - completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

const STEPS = ['Self evaluation', 'Manager evaluation', 'HR review', 'Published'];

/** Employee's most relevant assignment: the first one still in progress, else the latest. */
export function pickCurrentAssignment(assignments) {
  if (!assignments?.length) return null;
  const inProgress = assignments.find((a) => !isSubmitted(a.publishedStatus ?? a.PublishedStatus));
  return inProgress || assignments[0];
}

export function buildCurrentPeriod(a) {
  if (!a) return undefined;
  const done = [
    isSubmitted(a.selfEvaluationStatus ?? a.selfEvalStatus),
    isSubmitted(a.managerEvalStatus),
    isSubmitted(a.hrEvaluationStatus ?? a.hrReviewStatus),
    isSubmitted(a.publishedStatus),
  ];
  const idx = done.findIndex((d) => !d);
  const currentStep = idx === -1 ? STEPS.length : idx;
  const dueDate = [a.selfEvalEnd, a.managerEvalEnd, a.hrReviewEnd][currentStep];
  return {
    name: [a.reviewFormName, a.financialYear].filter(Boolean).join(' · ') || 'Performance review',
    dueDate,
    daysLeft: dueDate ? Math.max(0, dayjs(dueDate).startOf('day').diff(dayjs().startOf('day'), 'day')) : undefined,
    currentStep,
    steps: STEPS,
  };
}

/** Done/pending per phase from normalized assignment rows `{ self, manager, hr, published }` (booleans). */
export function phaseProgress(rows) {
  const count = (key) => rows.filter((r) => r[key]).length;
  return [
    ['Self evaluation', 'self'],
    ['Manager evaluation', 'manager'],
    ['HR review', 'hr'],
    ['Published', 'published'],
  ].map(([name, key]) => ({ name, done: count(key), pending: rows.length - count(key) }));
}

export const dueLabel = (date) => {
  if (!date) return { label: 'No due date', urgent: false };
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days < 0) return { label: 'Overdue', urgent: true };
  if (days === 0) return { label: 'Due today', urgent: true };
  return { label: `Due in ${days} day${days === 1 ? '' : 's'}`, urgent: days <= 2 };
};
