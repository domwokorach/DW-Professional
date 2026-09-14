import { getRedisClient } from "./client";

const PRESENCE_KEY_PREFIX = "presence:admin:";
const VISITOR_PRESENCE_KEY_PREFIX = "presence:visitor:";
const PRESENCE_TTL_SECONDS = 60;

export type AdminStatus = "online" | "away";

interface AdminPresenceRecord {
  status: AdminStatus;
  lastActivityAt: number;
}

/** In-memory fallback used when REDIS_URL isn't set — fine for the single-process socket server. */
const memoryPresence = new Map<string, AdminPresenceRecord>();
const memoryVisitorPresence = new Map<string, number>();

async function readAdminRecord(adminId: string): Promise<AdminPresenceRecord | null> {
  const redis = getRedisClient();
  if (!redis) return memoryPresence.get(adminId) ?? null;
  const raw = await redis.get(`${PRESENCE_KEY_PREFIX}${adminId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminPresenceRecord;
  } catch {
    return null;
  }
}

async function writeAdminRecord(adminId: string, record: AdminPresenceRecord): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryPresence.set(adminId, record);
    return;
  }
  await redis.set(`${PRESENCE_KEY_PREFIX}${adminId}`, JSON.stringify(record), "EX", PRESENCE_TTL_SECONDS);
}

export async function setAdminOnline(adminId: string): Promise<void> {
  await writeAdminRecord(adminId, { status: "online", lastActivityAt: Date.now() });
}

export async function setAdminAway(adminId: string): Promise<void> {
  const existing = await readAdminRecord(adminId);
  await writeAdminRecord(adminId, { status: "away", lastActivityAt: existing?.lastActivityAt ?? Date.now() });
}

/** Refreshes an admin's activity timestamp; flips them back to "online" if they were "away". */
export async function touchAdminActivity(adminId: string): Promise<boolean> {
  const existing = await readAdminRecord(adminId);
  const wasAway = existing?.status === "away";
  await writeAdminRecord(adminId, { status: "online", lastActivityAt: Date.now() });
  return wasAway;
}

/** Extends the Redis TTL only — does NOT count as user activity, so it must never reset lastActivityAt. */
export async function refreshAdminPresenceTtl(adminId: string): Promise<void> {
  const existing = await readAdminRecord(adminId);
  if (!existing) return;
  await writeAdminRecord(adminId, existing);
}

export async function setAdminOffline(adminId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryPresence.delete(adminId);
    return;
  }
  await redis.del(`${PRESENCE_KEY_PREFIX}${adminId}`);
}

export async function isAnyAdminOnline(): Promise<boolean> {
  const status = await getAdminAggregateStatus();
  return status !== "offline";
}

export async function getOnlineAdminIds(): Promise<string[]> {
  const redis = getRedisClient();
  if (!redis) return Array.from(memoryPresence.keys());
  const keys = await redis.keys(`${PRESENCE_KEY_PREFIX}*`);
  return keys.map((key) => key.slice(PRESENCE_KEY_PREFIX.length));
}

/** Admin ids whose presence record's lastActivityAt is older than `maxAgeMs` and are currently "online". */
export async function getStaleOnlineAdminIds(maxAgeMs: number): Promise<string[]> {
  const ids = await getOnlineAdminIds();
  const records = await Promise.all(ids.map(readAdminRecord));
  const stale: string[] = [];
  records.forEach((record, index) => {
    if (record && record.status === "online" && Date.now() - record.lastActivityAt > maxAgeMs) {
      stale.push(ids[index]);
    }
  });
  return stale;
}

export async function getAdminAggregateStatus(): Promise<"online" | "away" | "offline"> {
  const ids = await getOnlineAdminIds();
  if (ids.length === 0) return "offline";
  const records = await Promise.all(ids.map(readAdminRecord));
  let sawAway = false;
  for (const record of records) {
    if (record?.status === "online") return "online";
    if (record?.status === "away") sawAway = true;
  }
  return sawAway ? "away" : "online";
}

export async function setVisitorOnline(visitorId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryVisitorPresence.set(visitorId, Date.now());
    return;
  }
  await redis.set(`${VISITOR_PRESENCE_KEY_PREFIX}${visitorId}`, "1", "EX", PRESENCE_TTL_SECONDS);
}

export async function setVisitorOffline(visitorId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryVisitorPresence.delete(visitorId);
    return;
  }
  await redis.del(`${VISITOR_PRESENCE_KEY_PREFIX}${visitorId}`);
}

export async function isVisitorOnline(visitorId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return memoryVisitorPresence.has(visitorId);
  const value = await redis.get(`${VISITOR_PRESENCE_KEY_PREFIX}${visitorId}`);
  return value !== null;
}
