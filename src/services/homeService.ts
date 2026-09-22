// @ts-nocheck
// Home dashboard data composed from existing APIs. Each call is independent (allSettled):
// if one fails or returns nothing, only the matching UI section is hidden.
import api from './api';
import performanceService from './performanceService';
import { getGoalsByEmployee } from './goalsService';
import { fetchActiveCycles } from './growthConnectService';
import { fetchManagerRevisionRequests, fetchPendingRevisions } from './goalRevisionService';
import { getAllEmployees } from './employeeService';
import { normalizeManagedAssignmentsResponse } from '../utils/normalizeManagedAssignmentsResponse';
import {
  buildCurrentPeriod,
  goalStats,
  isSubmitted,
  mapCycles,
  mapProfile,
  phaseProgress,
  pickCurrentAssignment,
  unwrapItem,
  unwrapList,
} from '../utils/homeMappers';

const ok = (r) => (r.status === 'fulfilled' ? r.value : undefined);

async function loadActiveCycles() {
  return mapCycles(await fetchActiveCycles().catch(() => []));
}

const isPending = (r) => {
  const s = String(r?.status ?? 'PENDING').toUpperCase();
  return s === 'PENDING';
};

const pluralize = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ── Employee ────────────────────────────────────────────────────────────────
async function loadEmployee(user) {
  const [me, reviewsRes, goalsRes, resultsRes] = await Promise.allSettled([
    api.get(`/users/${user.id}`),
    performanceService.getMyReviews(),
    getGoalsByEmployee(user.id),
    performanceService.getMyResults(),
  ]);

  const assignments = unwrapList(ok(reviewsRes));
  const goals = ok(goalsRes) || [];
  const results = unwrapList(ok(resultsRes));
  const stats = [];

  if (ok(goalsRes)) {
    const g = goalStats(goals);
    stats.push({ id: 'goals', label: 'Active goals', value: String(g.active), hint: `${g.total} total`, tone: 'primary', path: '/performance/goals' });
    stats.push({ id: 'done', label: 'Completed goals', value: String(g.completed), hint: g.total ? `${g.percent}% of goals` : undefined, tone: 'success', path: '/performance/goals' });
  }
  if (ok(reviewsRes)) {
    const pending = assignments.filter((a) => !isSubmitted(a.selfEvaluationStatus ?? a.selfEvalStatus)).length;
    stats.push({ id: 'pending', label: 'Pending reviews', value: String(pending), hint: pending ? 'Self evaluation due' : 'All submitted', tone: pending ? 'warning' : 'success', path: '/performance' });
  }
  const latest = [...results]
    .filter((r) => r.overallRating != null)
    .sort((a, b) => new Date(b.publishedDate || 0) - new Date(a.publishedDate || 0))[0];
  if (latest) {
    stats.push({ id: 'rating', label: 'Latest rating', value: String(Number(latest.overallRating).toFixed(1)), hint: latest.financialYear || undefined, tone: 'info', path: '/performance/results' });
  }

  const g = goalStats(goals);
  return {
    profile: mapProfile(unwrapItem(ok(me)), user),
    stats,
    currentPeriod: buildCurrentPeriod(pickCurrentAssignment(assignments)),
    goalProgress: goals.length ? { completed: g.completed, total: g.total, percent: g.percent } : undefined,
    cycles: await loadActiveCycles(),
    needsAction: [],
    quickActions: [
      { id: 'q1', label: 'My reviews', description: 'Start or continue your evaluation', path: '/performance' },
      { id: 'q2', label: 'My goals', description: 'Track and update your goals', path: '/performance/goals' },
      { id: 'q3', label: 'My results', description: 'Ratings and feedback', path: '/performance/results' },
    ],
  };
}

// ── Manager ─────────────────────────────────────────────────────────────────
async function loadManager(user) {
  const [me, teamRes, mineRes, myReviewsRes] = await Promise.allSettled([
    api.get(`/users/${user.id}`),
    performanceService.getManagedAssignments({ page: 1, pageSize: 100 }),
    fetchManagerRevisionRequests(),
    performanceService.getMyReviews(),
  ]);

  const stats = [];
  const needsAction = [];
  let phases;

  if (ok(teamRes)) {
    const rows = normalizeManagedAssignmentsResponse(ok(teamRes)).rows;
    const mgrPending = rows.filter((r) => isSubmitted(r.selfEvalStatus) && !isSubmitted(r.managerReviewStatus));
    const mgrDone = rows.filter((r) => isSubmitted(r.managerReviewStatus)).length;

    if (rows.length) {
      stats.push({ id: 'mpend', label: 'Manager evaluations pending', value: String(mgrPending.length), hint: 'Self evaluation submitted', tone: 'warning', path: '/performance' });
      stats.push({ id: 'mdone', label: 'Manager evaluations done', value: `${mgrDone}/${rows.length}`, hint: `${Math.round((mgrDone / rows.length) * 100)}% complete`, tone: 'success' });
      phases = phaseProgress(
        rows.map((r) => ({
          self: isSubmitted(r.selfEvalStatus),
          manager: isSubmitted(r.managerReviewStatus),
          hr: isSubmitted(r.hrReviewStatus),
          published: isSubmitted(r.publishedStatus),
        })),
      );
    }
    mgrPending.slice(0, 5).forEach((r) =>
      needsAction.push({
        id: `m-${r.reviewId ?? r.id}`,
        title: `Manager evaluation – ${r.name}`,
        subtitle: r.formName || 'Performance review',
        dueLabel: 'Pending',
        path: '/performance',
      }),
    );
  }

  if (ok(mineRes)) {
    const pending = ok(mineRes).filter(isPending);
    if (pending.length) {
      needsAction.push({
        id: 'rev',
        title: pluralize(pending.length, 'goal revision request', 'goal revision requests'),
        subtitle: 'Awaiting HR approval',
        dueLabel: 'Pending',
        path: '/manager/performance/requests',
      });
    }
  }

  const myAssignments = unwrapList(ok(myReviewsRes));

  return {
    profile: mapProfile(unwrapItem(ok(me)), user),
    stats,
    // Managers are reviewed too — show their own review pipeline (self/manager/HR/published),
    // same as the employee dashboard, alongside the team's Growth Connect cycles below.
    currentPeriod: buildCurrentPeriod(pickCurrentAssignment(myAssignments)),
    phaseProgress: phases,
    needsAction,
    cycles: await loadActiveCycles(),
    quickActions: [
      { id: 'q1', label: 'Goal reviews', description: 'Review your team goals', path: '/manager/performance/goal-reviews' },
      { id: 'q2', label: 'My requests', description: 'Track revision requests', path: '/manager/performance/requests' },
      { id: 'q3', label: 'My goals', description: 'Your own goals', path: '/performance/goals' },
      { id: 'q4', label: 'My reviews', description: 'Your own evaluations', path: '/performance' },
    ],
  };
}

// ── Admin / HR ──────────────────────────────────────────────────────────────
async function loadAdmin(user) {
  const [me, fyRes, employeesRes, revisionsRes] = await Promise.allSettled([
    api.get(`/users/${user.id}`),
    performanceService.getFinancialYears(),
    getAllEmployees({ page: 1, pageSize: 1 }),
    fetchPendingRevisions(),
  ]);

  const years = unwrapList(ok(fyRes));
  const activeYear =
    [...years].filter((y) => y.isActive).sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0] || years[0];

  const [assignmentsRes, cycles] = await Promise.all([
    activeYear ? performanceService.getDashboard(activeYear.id).catch(() => undefined) : Promise.resolve(undefined),
    loadActiveCycles(),
  ]);

  const stats = [];
  const needsAction = [];
  let phases;

  if (ok(employeesRes)) {
    stats.push({ id: 'emp', label: 'Employees', value: String(ok(employeesRes).totalCount), tone: 'primary', path: '/config/performance/employees' });
  }

  const assignments = assignmentsRes ? unwrapList(assignmentsRes) : undefined;
  if (assignments?.length) {
    const rows = assignments.map((a) => ({
      self: isSubmitted(a.selfEvaluationStatus ?? a.selfEvalStatus),
      manager: isSubmitted(a.managerEvalStatus),
      hr: isSubmitted(a.hrEvaluationStatus ?? a.hrReviewStatus),
      published: isSubmitted(a.publishedStatus),
    }));
    const published = rows.filter((r) => r.published).length;
    phases = phaseProgress(rows);
    stats.push({ id: 'pub', label: 'Results published', value: `${published}/${rows.length}`, hint: `${Math.round((published / rows.length) * 100)}% of reviews`, tone: 'info', path: '/operations/performance' });

    const awaitingHr = rows.filter((r) => r.manager && !r.hr).length;
    const readyToPublish = rows.filter((r) => r.self && r.manager && r.hr && !r.published).length;
    if (awaitingHr) needsAction.push({ id: 'hr', title: pluralize(awaitingHr, 'review', 'reviews') + ' awaiting HR review', subtitle: 'Manager evaluation submitted', dueLabel: 'Pending', path: '/operations/performance' });
    if (readyToPublish) needsAction.push({ id: 'pub', title: pluralize(readyToPublish, 'review', 'reviews') + ' ready to publish', subtitle: 'All evaluations submitted', dueLabel: 'Action needed', urgent: true, path: '/operations/performance' });
  }

  if (ok(revisionsRes)) {
    const pending = ok(revisionsRes).filter(isPending);
    stats.push({ id: 'rev', label: 'Pending revision requests', value: String(pending.length), tone: 'warning', path: '/operations/performance/revision-requests' });
    if (pending.length) {
      needsAction.unshift({ id: 'rev', title: pluralize(pending.length, 'goal revision request', 'goal revision requests'), subtitle: 'Awaiting your approval', dueLabel: 'Pending', path: '/operations/performance/revision-requests' });
    }
  }

  if (cycles.length) {
    stats.push({ id: 'cyc', label: 'Open cycles', value: String(cycles.filter((c) => c.status === 'ACTIVE').length), hint: activeYear?.name, tone: 'success', path: '/config/performance/financial-years' });
  }

  return {
    profile: mapProfile(unwrapItem(ok(me)), user),
    stats,
    phaseProgress: phases,
    needsAction,
    cycles,
    quickActions: [
      { id: 'q1', label: 'Assign review forms', description: 'Assign forms to employees', path: '/operations/performance/assign' },
      { id: 'q2', label: 'Review periods', description: 'Manage financial years and cycles', path: '/config/performance/financial-years' },
      { id: 'q3', label: 'Revision requests', description: 'Approve goal revisions', path: '/operations/performance/revision-requests' },
      { id: 'q4', label: 'Performance dashboard', description: 'Operations overview', path: '/operations/performance' },
    ],
  };
}

export const getHomeData = async (role, user) => {
  if (role === 'ADMIN') return loadAdmin(user);
  if (role === 'MANAGER') return loadManager(user);
  return loadEmployee(user);
};
