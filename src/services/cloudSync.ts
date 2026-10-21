import { DateSubmissionRecord, AdminStats, ProposalStatus } from '../types';
import { ADMIN_CONFIG } from '../adminConfig';

const CLOUD_CHANNEL = 'jana_mazen_proposal_live_61006b6f';
const NTFY_BASE_URL = 'https://ntfy.sh';

export interface CloudSyncResult {
  submissions: DateSubmissionRecord[];
  stats: AdminStats;
  isCloudConnected: boolean;
}

// Compute aggregate stats from a list of records
export function calculateStats(list: DateSubmissionRecord[]): AdminStats {
  const confirmed = list.filter((r) => (r.status || 'Confirmed') === 'Confirmed').length;
  const planning = list.filter((r) => r.status === 'Planning').length;
  const completed = list.filter((r) => r.status === 'Completed').length;
  const archived = list.filter((r) => r.status === 'Archived').length;
  const totalRejections = list.reduce((sum, r) => sum + (r.rejectionAttempts || 0), 0);

  return {
    totalAccepted: list.length,
    statusCounts: {
      Confirmed: confirmed,
      Planning: planning,
      Completed: completed,
      Archived: archived,
    },
    totalRejectionsPrevented: totalRejections,
    latestSubmission: list[0]?.submittedAt || null,
  };
}

/**
 * Fetch all date proposals submitted across any device.
 * Syncs seamlessly between Cloud Relay, Local Server API, and Browser Storage.
 */
export async function fetchProposals(): Promise<CloudSyncResult> {
  const recordsMap = new Map<string, DateSubmissionRecord>();
  const deletedIds = new Set<string>();
  let isCloudConnected = false;

  // 1. Fetch from Global Cloud Relay
  try {
    const cloudRes = await fetch(`${NTFY_BASE_URL}/${CLOUD_CHANNEL}/json?poll=1&since=all`, {
      method: 'GET',
      headers: {
        Accept: 'application/x-ndjson, application/json',
      },
    });

    if (cloudRes.ok) {
      isCloudConnected = true;
      const text = await cloudRes.text();
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const envelope = JSON.parse(line.trim());
          if (envelope.event === 'message' && envelope.message) {
            let payload: any;
            try {
              payload = JSON.parse(envelope.message);
            } catch {
              continue;
            }

            if (payload.type === 'DELETE') {
              if (payload.id) {
                deletedIds.add(payload.id);
                recordsMap.delete(payload.id);
              }
            } else if (payload.type === 'UPDATE') {
              const existing = recordsMap.get(payload.id);
              if (existing) {
                recordsMap.set(payload.id, {
                  ...existing,
                  ...payload.updates,
                  updatedAt: payload.timestamp || new Date().toISOString(),
                });
              }
            } else if (payload.type === 'SUBMISSION' && payload.record) {
              const item = payload.record;
              if (item.id && !deletedIds.has(item.id)) {
                recordsMap.set(item.id, item);
              }
            } else if (payload.id && (payload.date || payload.partnerName)) {
              if (!deletedIds.has(payload.id)) {
                recordsMap.set(payload.id, payload as DateSubmissionRecord);
              }
            }
          }
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch (err) {
    console.warn('Cloud sync temporarily unavailable, checking local storage:', err);
  }

  // 2. Fetch from Local Express API if reachable (e.g. during local dev or proxy)
  try {
    const localToken = localStorage.getItem(ADMIN_CONFIG.tokenStorageKey) || ADMIN_CONFIG.fallbackPassword;
    const apiRes = await fetch('/api/admin/submissions?limit=100', {
      headers: {
        Authorization: `Bearer ${localToken}`,
      },
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.submissions && Array.isArray(data.submissions)) {
        for (const sub of data.submissions) {
          if (sub.id && !deletedIds.has(sub.id) && !recordsMap.has(sub.id)) {
            recordsMap.set(sub.id, sub);
            // Sync this to cloud so other devices immediately get it too!
            saveProposalToCloud(sub).catch(() => {});
          }
        }
      }
    }
  } catch {
    // Local Express endpoint may not be present on static preview, which is expected
  }

  // 3. Merge with localStorage backup
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const localList: DateSubmissionRecord[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of localList) {
        if (item && item.id && !deletedIds.has(item.id)) {
          if (!recordsMap.has(item.id)) {
            recordsMap.set(item.id, item);
            // Upload local submission to cloud relay so Mazen's other devices see it
            saveProposalToCloud(item).catch(() => {});
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // Sort newest first
  const submissions = Array.from(recordsMap.values()).sort((a, b) => {
    const timeA = new Date(a.submittedAt || 0).getTime();
    const timeB = new Date(b.submittedAt || 0).getTime();
    return timeB - timeA;
  });

  // Keep localStorage up to date with full consolidated list
  try {
    localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(submissions));
  } catch {
    // ignore quota
  }

  const stats = calculateStats(submissions);

  return {
    submissions,
    stats,
    isCloudConnected,
  };
}

/**
 * Save a newly confirmed date proposal to Cloud Relay, Local API, and Local Storage.
 * Called when Jana clicks "Lock In Our Date! ❤️"
 */
export async function saveProposalToCloud(record: DateSubmissionRecord): Promise<boolean> {
  // 1. Immediately cache locally
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
    const list: DateSubmissionRecord[] = raw ? JSON.parse(raw) : [];
    if (!list.some((r) => r.id === record.id)) {
      list.unshift(record);
      localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  let cloudSuccess = false;

  // 2. Publish to Global Cloud Relay (accessible across all mobile and desktop devices)
  try {
    const res = await fetch(`${NTFY_BASE_URL}/${CLOUD_CHANNEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: `Date Confirmed by ${record.partnerName || 'Jana'}! 💖`,
        Priority: 'urgent',
        Tags: 'heart,love,calendar',
      },
      body: JSON.stringify({
        type: 'SUBMISSION',
        record,
      }),
    });
    if (res.ok) {
      cloudSuccess = true;
    }
  } catch (err) {
    console.warn('Could not post to cloud relay:', err);
  }

  // 3. Also post to local backend if available
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // ignore
  }

  return cloudSuccess;
}

/**
 * Update proposal status or internal admin notes.
 * Syncs the update across all devices in real-time.
 */
export async function updateProposalInCloud(
  id: string,
  updates: Partial<DateSubmissionRecord>
): Promise<boolean> {
  // Update in localStorage
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
    if (raw) {
      const list: DateSubmissionRecord[] = JSON.parse(raw);
      const index = list.findIndex((r) => r.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(list));
      }
    }
  } catch {
    // ignore
  }

  // Publish update to Cloud Relay
  try {
    await fetch(`${NTFY_BASE_URL}/${CLOUD_CHANNEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: 'Proposal Updated',
        Tags: 'pencil',
      },
      body: JSON.stringify({
        type: 'UPDATE',
        id,
        updates,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('Failed to broadcast proposal update:', err);
  }

  // Update in local server API if running
  try {
    const token = localStorage.getItem(ADMIN_CONFIG.tokenStorageKey) || ADMIN_CONFIG.fallbackPassword;
    await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  } catch {
    // ignore
  }

  return true;
}

/**
 * Delete a proposal from the cloud sync.
 */
export async function deleteProposalFromCloud(id: string): Promise<boolean> {
  // Remove from localStorage
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
    if (raw) {
      const list: DateSubmissionRecord[] = JSON.parse(raw);
      const filtered = list.filter((r) => r.id !== id);
      localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  // Broadcast deletion to Cloud Relay
  try {
    await fetch(`${NTFY_BASE_URL}/${CLOUD_CHANNEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: 'Proposal Removed',
        Tags: 'wastebasket',
      },
      body: JSON.stringify({
        type: 'DELETE',
        id,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // ignore
  }

  // Call local server API if reachable
  try {
    const token = localStorage.getItem(ADMIN_CONFIG.tokenStorageKey) || ADMIN_CONFIG.fallbackPassword;
    await fetch(`/api/admin/submissions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // ignore
  }

  return true;
}

/**
 * Subscribe to real-time live events.
 * Uses SSE and a 5-second polling fallback to ensure Mazen's dashboard
 * updates the second Jana confirms on her phone.
 */
export function subscribeToLiveProposals(
  onUpdate: (result: CloudSyncResult) => void
): () => void {
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(`${NTFY_BASE_URL}/${CLOUD_CHANNEL}/sse`);
    eventSource.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'message') {
          // Re-fetch full consolidated list to guarantee state consistency
          const res = await fetchProposals();
          onUpdate(res);
        }
      } catch {
        // ignore
      }
    };
  } catch (err) {
    console.warn('SSE subscription error:', err);
  }

  // Also set up a 5-second heartbeat poll so mobile tab waking instantly refreshes
  const intervalId = setInterval(async () => {
    try {
      const res = await fetchProposals();
      onUpdate(res);
    } catch {
      // ignore
    }
  }, 5000);

  // Return unsubscribe cleanup function
  return () => {
    if (eventSource) {
      eventSource.close();
    }
    clearInterval(intervalId);
  };
}
