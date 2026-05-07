import api from './api';

/** Manager block from `/users/entra` — sent as `manager` on each assignment row. */
export interface EntraManagerDetails {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
}

export interface EntraUserOption {
  id: string;
  code: string;
  name: string;
  designation: string;
  /** Mail or UPN — used when building assign payload `email`. */
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: string;
  /** Populated when the directory row includes nested `manager`. */
  manager?: EntraManagerDetails | null;
  managerId?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Rows from API envelope `{ success, data: { data: Row[], nextPageUrl, ... } }` or simpler shapes */
function coerceItems(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  const inner = asRecord(root.data);
  if (inner && Array.isArray(inner.data)) {
    return inner.data;
  }

  const direct = root.items ?? root.value ?? root.users ?? root.data;
  return Array.isArray(direct) ? direct : [];
}

/** Continuation URL or token — nested under `data` per Encra payload */
function readNextPageReference(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;

  const inner = asRecord(root.data);
  const fromInner = inner?.nextPageUrl ?? inner?.nextLink;
  if (typeof fromInner === 'string' && fromInner.length > 0) return fromInner;

  const flat = root.nextPageUrl ?? root.nextLink ?? root.nextPageLink ?? root.continuationToken;
  if (typeof flat === 'string' && flat.length > 0) return flat;

  return null;
}

/** Page-based pagination metadata from `data` block */
function readEntraPagingMeta(payload: unknown): {
  page: number | null;
  totalPages: number | null;
} {
  const root = asRecord(payload);
  const inner = root ? asRecord(root.data) : null;
  if (!inner) return { page: null, totalPages: null };

  const page = typeof inner.page === 'number' ? inner.page : null;
  const totalPages = typeof inner.totalPages === 'number' ? inner.totalPages : null;
  return { page, totalPages };
}

function str(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && typeof v === 'string' && v.trim() !== '') return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
}

/** Fill missing names from display string: first segment → first name, rest → last name. */
function fillNamesFromDisplayName(
  displayName: string,
  firstName: string,
  lastName: string
): { firstName: string; lastName: string } {
  let nextFirst = firstName;
  let nextLast = lastName;
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if ((!nextFirst || !nextLast) && parts.length > 0) {
    if (!nextFirst) nextFirst = parts[0];
    if (!nextLast && parts.length > 1) nextLast = parts.slice(1).join(' ');
  }
  return { firstName: nextFirst, lastName: nextLast };
}

function mapRawManager(raw: Record<string, unknown>): EntraManagerDetails | null {
  const mid = raw.id ?? raw.userId ?? raw.objectId;
  if (mid == null || String(mid).trim() === '') return null;
  const id = String(mid).trim();
  const displayName =
    str(raw, 'displayName', 'name', 'fullName', 'display_name') || id;
  const userPrincipalName = str(
    raw,
    'userPrincipalName',
    'userPrincipal',
    'upn',
    'user_principal_name'
  );
  const mail = str(raw, 'mail', 'email') || userPrincipalName;
  return {
    id,
    displayName,
    userPrincipalName: userPrincipalName || mail,
    mail: mail || userPrincipalName,
  };
}

function mapRawUser(raw: Record<string, unknown>, index: number): EntraUserOption {
  const id =
    (raw.id ?? raw.userId ?? raw.objectId ?? raw.employeeId ?? raw.azureAdObjectId) as
      | string
      | number
      | undefined;
  const displayForSplit = String(
    raw.displayName ?? raw.name ?? raw.fullName ?? raw.display_name ?? ''
  ).trim();
  const name = displayForSplit || 'Unnamed user';
  const code =
    (raw.userPrincipalName ?? raw.mail ?? raw.email ?? raw.userPrincipal ?? raw.employeeCode ?? '') + '';
  const email = str(raw, 'mail', 'email', 'userPrincipalName', 'userPrincipal') || code;
  let firstName = str(raw, 'givenName', 'firstName', 'firstname');
  let lastName = str(raw, 'surname', 'lastName', 'lastname');
  ({ firstName, lastName } = fillNamesFromDisplayName(displayForSplit, firstName, lastName));
  const employeeCode = str(raw, 'employeeId', 'employeeCode', 'employeeNumber', 'code');
  const department = str(raw, 'department', 'departmentName');
  const designationRaw = str(raw, 'jobTitle', 'title', 'designation');

  const managerRec = asRecord(raw.manager ?? raw.Manager);
  const manager = managerRec ? mapRawManager(managerRec) : null;
  const managerId = str(raw, 'managerId');

  return {
    id: id !== undefined && id !== null ? String(id) : `row-${index}`,
    code,
    name,
    designation: designationRaw || '—',
    email,
    firstName,
    lastName,
    employeeCode,
    department,
    manager,
    managerId: manager?.id || managerId || undefined,
  };
}

function mapPayloadToResult(payload: unknown): {
  users: EntraUserOption[];
  nextLink: string | null;
  page: number | null;
  totalPages: number | null;
} {
  const items = coerceItems(payload).map((row, i) =>
    mapRawUser((row && typeof row === 'object' ? row : {}) as Record<string, unknown>, i)
  );
  const paging = readEntraPagingMeta(payload);
  return {
    users: items,
    nextLink: readNextPageReference(payload),
    page: paging.page,
    totalPages: paging.totalPages,
  };
}

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/**
 * GET /users/entra — Entra-linked users for assignment picker (local state only).
 * Parses `{ data: { data: [], nextPageUrl, page, ... } }` envelope.
 */
export async function fetchEntraUsers(params: {
  search?: string;
  top?: number;
  /** Continuation — full URL from `nextPageUrl` or opaque token/query value */
  nextLink?: string;
  /** Alias for callers that mirror API naming */
  nextPageUrl?: string;
}): Promise<{ users: EntraUserOption[]; nextLink: string | null; page: number | null; totalPages: number | null }> {
  const continuation = (params.nextPageUrl ?? params.nextLink)?.trim() ?? '';

  let payload: unknown;

  if (continuation && isAbsoluteHttpUrl(continuation)) {
    payload = await api.get(continuation);
  } else {
    const queryParams: Record<string, string | number> = {
      top: params.top ?? 100,
    };
    if (params.search != null && params.search !== '') {
      queryParams.search = params.search;
    }
    if (continuation) {
      queryParams.nextPageUrl = continuation;
    }
    payload = await api.get('/users/entra', { params: queryParams });
  }

  return mapPayloadToResult(payload);
}

/** Shape for POST /performance/assignments `entraEmployees[]`. */
export function entraUserToAssignmentPayload(user: EntraUserOption): {
  entraObjectId: string;
  manager?: EntraManagerDetails;
  managerId?: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: string;
  designation: string;
} {
  const designation =
    user.designation && user.designation !== '—' ? user.designation : '';
  const mgr = user.manager;
  return {
    entraObjectId: user.id,
    ...(mgr != null && String(mgr.id).trim() !== '' ? { manager: mgr } : {}),
    ...(user.managerId ? { managerId: user.managerId } : {}),
    email: user.email ?? user.code ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    employeeCode: user.employeeCode ?? '',
    department: user.department ?? '',
    designation,
  };
}

export interface EntraEmployeeAssignmentDto {
  entraObjectId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  managerId?: string;
  manager?: { id?: string };
}

export interface EntraImportRowError {
  index?: number;
  entraObjectId?: string;
  message?: string;
}

export interface EntraStudentsImportResult {
  addedCount: number;
  updatedCount: number;
  errors: EntraImportRowError[];
}

function readNumber(input: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function readArray(input: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = input[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

export async function importStudentsFromEntra(
  rows: EntraEmployeeAssignmentDto[]
): Promise<EntraStudentsImportResult> {
  const payload = await api.post('/users/entra/students', rows);
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  return {
    addedCount: readNumber(data, ['addedCount', 'added', 'createdCount']),
    updatedCount: readNumber(data, ['updatedCount', 'updated']),
    errors: readArray(data, ['errors', 'rowErrors']).map((row) => {
      const rec = asRecord(row) ?? {};
      return {
        index: typeof rec.index === 'number' ? rec.index : undefined,
        entraObjectId: str(rec, 'entraObjectId', 'id'),
        message: str(rec, 'message', 'error'),
      };
    }),
  };
}

/**
 * POST /users/entra/students (no body) — server-triggered sync/import from Entra.
 * Matches curl: POST https://<host>/api/users/entra/students -d ''
 */
export async function syncStudentsFromEntra(): Promise<EntraStudentsImportResult> {
  const payload = await api.post('/users/entra/students');
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  return {
    addedCount: readNumber(data, ['addedCount', 'added', 'createdCount']),
    updatedCount: readNumber(data, ['updatedCount', 'updated']),
    errors: readArray(data, ['errors', 'rowErrors']).map((row) => {
      const rec = asRecord(row) ?? {};
      return {
        index: typeof rec.index === 'number' ? rec.index : undefined,
        entraObjectId: str(rec, 'entraObjectId', 'id'),
        message: str(rec, 'message', 'error'),
      };
    }),
  };
}
