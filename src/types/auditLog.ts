export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  details: Record<string, unknown>;
}
