"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/service/ui/store";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface SessionItem {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  expiresAt: string | Date;
}

let inFlightSessionsPromise: ReturnType<typeof authClient.listSessions> | null =
  null;

export function AdminSessionsCard() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      if (!inFlightSessionsPromise) {
        inFlightSessionsPromise = authClient.listSessions().finally(() => {
          inFlightSessionsPromise = null;
        });
      }
      const res = await inFlightSessionsPromise;
      if (res.data) {
        setSessions(res.data as unknown as SessionItem[]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load active sessions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (token: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await authClient.revokeSession({ token });
      if (res.error) {
        const msg = res.error.message || "Failed to revoke session";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Session revoked");
      await loadSessions();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to revoke session";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRevokeAllOther = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await authClient.revokeOtherSessions();
      if (res.error) {
        const msg = res.error.message || "Failed to revoke other sessions";
        setError(msg);
        toast.error(msg);
        return;
      }
      setConfirmRevokeAllOpen(false);
      toast.success("Signed out of all other devices");
      await loadSessions();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to revoke other sessions";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border line p-6 space-y-6">
      <div className="flex items-center justify-between border-b line pb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wider uppercase">
            Active Devices & Sessions
          </h2>
          <p className="mute text-xs mt-1">
            Review and terminate active browser sessions authenticated to your
            admin account.
          </p>
        </div>
        <div>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={() => setConfirmRevokeAllOpen(true)}
              disabled={actionLoading}
              className="text-xs text-red-600 border border-red-200 px-3 py-1.5 hover:bg-red-50 uppercase tracking-wider disabled:opacity-50"
            >
              Sign Out All Other Devices
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs mute py-4 text-center">
          Loading active sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-xs mute py-4 text-center">
          No active sessions found.
        </div>
      ) : (
        <div className="divide-y line">
          {sessions.map((s, index) => (
            <div
              key={s.id || s.token}
              className="py-3 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {s.userAgent
                      ? s.userAgent.slice(0, 50) + "..."
                      : "Unknown Browser"}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded-xs tracking-wider uppercase">
                      Current Session
                    </span>
                  )}
                </div>
                <div className="text-[11px] mute flex items-center gap-3">
                  <span>IP: {s.ipAddress || "127.0.0.1"}</span>
                  <span>•</span>
                  <span>Created: {new Date(s.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(s.token)}
                  disabled={actionLoading}
                  className="text-xs text-neutral-500 hover:text-red-600 uppercase underline text-[11px]"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmRevokeAllOpen}
        title="Sign Out Other Devices"
        message="Are you sure you want to sign out of all other active browser sessions?"
        confirmLabel="Sign Out All"
        cancelLabel="Cancel"
        isDanger
        isLoading={actionLoading}
        onConfirm={handleConfirmRevokeAllOther}
        onCancel={() => {
          if (!actionLoading) setConfirmRevokeAllOpen(false);
        }}
      />
    </div>
  );
}
