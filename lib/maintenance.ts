import { File } from "@/models/File";
import { ShareLink } from "@/models/ShareLink";

/**
 * Background housekeeping: expire trashed files/folders and expired share
 * links.
 *
 * Why this exists: trash expiry used to run only as a fire-and-forget side
 * effect of a user opening their trash page (`GET /api/trash`). Combined with
 * a Mongo TTL index on `trashExpiresAt` — which deletes rows without running
 * the Telegram/Blob cleanup — a file trashed by a user who never revisited
 * their trash page had its row deleted by the TTL monitor while its Telegram
 * document was orphaned permanently. There is no TTL index any more; this
 * sweep is the only thing that expires trash, so it must actually run.
 */

const FIRST_RUN_DELAY_MS = 60 * 1000;
const INTERVAL_MS = 60 * 60 * 1000;

// Module-level guard: Next dev re-evaluates modules on hot reload, which would
// otherwise stack a new interval on every edit.
declare global {
  // eslint-disable-next-line no-var
  var __freecloudsMaintenanceTimer: NodeJS.Timeout | undefined;
}

async function runMaintenance(): Promise<void> {
  try {
    const purgedTrash = await File.cleanupExpiredTrash();
    if (purgedTrash > 0) {
      console.log(`🧹 Purged ${purgedTrash} expired trash item(s)`);
    }
  } catch (error) {
    console.error("Trash cleanup failed:", error);
  }

  try {
    // Expired share links were never cleaned up: `expiresAt` has a plain index,
    // not a TTL, and is only evaluated when someone tries to download. The rows
    // accumulated forever.
    const result = await ShareLink.deleteMany({
      expiresAt: { $ne: null, $lte: new Date() },
    });
    if ((result.deletedCount ?? 0) > 0) {
      console.log(`🧹 Removed ${result.deletedCount} expired share link(s)`);
    }
  } catch (error) {
    console.error("Share link cleanup failed:", error);
  }
}

/**
 * Start the sweep. Idempotent, and safe to call from a request path: it is a
 * no-op once the timer exists. Not awaited by callers — housekeeping must never
 * block or fail a request.
 */
export function startMaintenance(): void {
  if (global.__freecloudsMaintenanceTimer) return;

  const timer = setInterval(() => {
    void runMaintenance();
  }, INTERVAL_MS);

  // Don't hold the process open just for housekeeping.
  timer.unref?.();
  global.__freecloudsMaintenanceTimer = timer;

  const firstRun = setTimeout(() => {
    void runMaintenance();
  }, FIRST_RUN_DELAY_MS);
  firstRun.unref?.();
}
