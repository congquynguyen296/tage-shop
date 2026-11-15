"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/service/ui/store";
import { Field } from "@/components/ui/Field";

type SetupStep = "idle" | "password" | "verify" | "disable_confirm" | "regen_codes";

export function AdminTwoFactorCard() {
  const [session, setSession] = useState<{
    user?: { email?: string; role?: string | null; twoFactorEnabled?: boolean | null };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup Flow States
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [password, setPassword] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clipboard & Download Feedback
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Extract clean secret from totpURI (e.g. otpauth://totp/...?secret=XXXX)
  const extractSecret = (uri: string): string => {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret") || "";
    } catch {
      const match = uri.match(/[?&]secret=([A-Z0-9]+)/i);
      return match ? match[1] : "";
    }
  };

  // Format secret with spaces every 4 characters
  const formatSecret = (secret: string): string => {
    return secret.replace(/(.{4})/g, "$1 ").trim();
  };

  // Load current session & 2FA status
  const refreshStatus = async () => {
    try {
      const res = await authClient.getSession();
      if (res.data) {
        setSession(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleStartEnable = () => {
    setSetupStep("password");
    setPassword("");
    setError(null);
    setSuccessMsg(null);
  };

  // Step 1 -> Step 2: Authenticate and request TOTP secret & QR code
  const handleRequestTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your current administrator password to continue");
      return;
    }

    setError(null);
    setActionLoading(true);

    try {
      const res = await authClient.twoFactor.enable({
        password,
        issuer: "TAGE",
      });

      if (res.error) {
        setError(res.error.message || "Failed to initialize 2FA. Verify your password.");
        setActionLoading(false);
        return;
      }

      if (res.data && res.data.method === "totp") {
        const uri = res.data.totpURI;
        setTotpUri(uri);
        setTotpSecret(extractSecret(uri));
        setBackupCodes(res.data.backupCodes || []);

        // Generate crisp, high-contrast QR Code Data URL
        const dataUrl = await QRCode.toDataURL(uri, {
          width: 240,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrCodeUrl(dataUrl);
        setSetupStep("verify");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2 -> Confirm: Verify 6-digit TOTP code and finalize enabling
  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setError("Please enter the complete 6-digit code from your authenticator app");
      return;
    }

    setError(null);
    setActionLoading(true);

    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: cleanCode,
      });

      if (res.error) {
        setError(res.error.message || "Invalid or expired verification code. Try again.");
        setActionLoading(false);
        return;
      }

      setSuccessMsg("Two-Factor Authentication (TOTP) has been successfully activated and enforced!");
      toast.success("Two-Factor Authentication activated");
      setSetupStep("idle");
      setPassword("");
      setVerifyCode("");
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Disable 2FA flow
  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password to confirm disabling 2FA");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const res = await authClient.twoFactor.disable({ password });
      if (res.error) {
        setError(res.error.message || "Failed to disable 2FA. Verify your password.");
        setActionLoading(false);
        return;
      }

      setSuccessMsg("Two-Factor Authentication has been successfully disabled.");
      toast.info("Two-Factor Authentication disabled");
      setSetupStep("idle");
      setPassword("");
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate Backup Codes flow
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password to regenerate backup codes");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const res = await authClient.twoFactor.generateBackupCodes({ password });
      if (res.error) {
        setError(res.error.message || "Failed to regenerate backup codes. Verify your password.");
        setActionLoading(false);
        return;
      }

      if (res.data && res.data.backupCodes) {
        setBackupCodes(res.data.backupCodes);
        setSuccessMsg("New emergency backup codes generated. Old codes are now invalidated.");
        toast.success("New backup codes generated");
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate backup codes");
    } finally {
      setActionLoading(false);
    }
  };

  // Copy secret key to clipboard
  const handleCopySecret = async () => {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret);
      setCopiedKey(true);
      toast.success("TOTP secret key copied");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy all backup codes to clipboard
  const handleCopyAllCodes = async () => {
    if (backupCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedCodes(true);
      toast.success("Backup codes copied to clipboard");
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download backup codes as .txt file
  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const content = `==========================================================\nTAGE STUDIO - EMERGENCY RECOVERY BACKUP CODES\n==========================================================\nAdministrator: ${session?.user?.email || "Admin"}\nGenerated: ${new Date().toLocaleString()}\n\nKeep these 10 one-time recovery codes in a secure password vault.\nEach code can only be used once if you lose access to your\nmobile authenticator application.\n\n${backupCodes.map((code, idx) => `[${idx + 1}] ${code}`).join("\n")}\n\n==========================================================\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tage-admin-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isEnabled = Boolean(session?.user?.twoFactorEnabled);

  return (
    <div className="bg-white border line p-6 md:p-8 space-y-6">
      {/* Header section with Security Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b line pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-neutral-900">
              Two-Factor Authentication (TOTP)
            </h2>
          </div>
          <p className="mute text-xs mt-1.5 leading-relaxed max-w-xl">
            Enforce Time-based One-Time Password (TOTP) verification using Google Authenticator,
            1Password, or similar apps for all administrator logins.
          </p>
        </div>
        <div>
          {loading ? (
            <span className="text-xs mute animate-pulse">Checking status...</span>
          ) : isEnabled ? (
            <span className="inline-flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active & Protected
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs bg-amber-50 text-amber-800 px-3 py-1.5 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Not Configured
            </span>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 ml-4 font-mono font-bold"
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 ml-4 font-mono font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* STATE 1: 2FA IS ENABLED & ACTIVE */}
      {/* =================================================================== */}
      {isEnabled && setupStep === "idle" && (
        <div className="space-y-6">
          <div className="bg-neutral-50 p-4 border line space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-semibold text-xs uppercase tracking-wider">
                Shield Active
              </span>
              <span className="text-xs mute">• Mandatory Admin Policy Satisfied</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every sign-in to the TAGE Admin Studio requires your primary email credentials plus a
              real-time 6-digit TOTP security token or emergency backup recovery code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setSetupStep("regen_codes");
                setPassword("");
                setError(null);
                setSuccessMsg(null);
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-xs border line hover:bg-neutral-50 uppercase tracking-wider"
            >
              Regenerate Backup Codes
            </button>
            <button
              onClick={() => {
                setSetupStep("disable_confirm");
                setPassword("");
                setError(null);
                setSuccessMsg(null);
              }}
              disabled={actionLoading}
              className="text-xs text-red-600 border border-red-200 px-4 py-2 hover:bg-red-50 uppercase tracking-wider"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STATE 2: 2FA IS NOT ENABLED (CALL TO ACTION) */}
      {/* =================================================================== */}
      {!isEnabled && setupStep === "idle" && (
        <div className="space-y-6">
          <div className="bg-amber-50/60 border border-amber-200 p-4 space-y-2">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider block">
              Required Security Protocol
            </span>
            <p className="text-xs text-amber-800 leading-relaxed">
              Administrative accounts have elevated privileges over store inventory, customer orders,
              and settings. Enabling Two-Factor Authentication is required to safeguard against
              unauthorized access.
            </p>
          </div>

          <div>
            <button
              onClick={handleStartEnable}
              className="btn uppercase tracking-wider text-xs px-6 py-2.5"
            >
              Setup Two-Factor Authentication
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 1: CONFIRM PASSWORD BEFORE GENERATING QR */}
      {/* =================================================================== */}
      {setupStep === "password" && (
        <form onSubmit={handleRequestTotp} className="space-y-5 max-w-md pt-2">
          <div className="border-l-2 border-neutral-900 pl-3">
            <span className="text-xs uppercase tracking-widest font-semibold block text-neutral-900">
              Step 1 of 2: Confirm Password
            </span>
            <p className="text-xs mute mt-0.5">
              Enter your current administrator password to authorize TOTP configuration.
            </p>
          </div>

          <Field
            label="Current Administrator Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••••••"
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading || !password}
              className="btn text-xs tracking-wider uppercase px-5 py-2.5 disabled:opacity-50"
            >
              {actionLoading ? "Generating Secret..." : "Proceed to Scan QR Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupStep("idle");
                setPassword("");
              }}
              className="px-4 py-2 text-xs border line hover:bg-neutral-50 uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* STEP 2: SCAN QR CODE, SAVE BACKUP CODES, AND VERIFY */}
      {/* =================================================================== */}
      {setupStep === "verify" && (
        <div className="space-y-8 pt-2">
          <div className="border-l-2 border-neutral-900 pl-3">
            <span className="text-xs uppercase tracking-widest font-semibold block text-neutral-900">
              Step 2 of 2: Scan QR & Confirm TOTP
            </span>
            <p className="text-xs mute mt-0.5">
              Scan the visual QR code with your authenticator app, record your recovery backup codes,
              and enter the current 6-digit code to activate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: QR Code & Manual Secret */}
            <div className="border line p-6 bg-neutral-50 space-y-4 flex flex-col items-center text-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900">
                1. Scan with Mobile App
              </span>
              <p className="text-[11px] mute">
                Open Google Authenticator, 1Password, or Bitwarden and scan this barcode:
              </p>

              {qrCodeUrl ? (
                <div className="p-3 bg-white border line shadow-xs">
                  <img
                    src={qrCodeUrl}
                    alt="TAGE Admin 2FA QR Code"
                    className="w-48 h-48 block"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 border line bg-white flex items-center justify-center text-xs mute">
                  Rendering QR...
                </div>
              )}

              {/* Manual Entry Fallback */}
              <div className="w-full pt-2 border-t line text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-neutral-700">
                    Cannot scan barcode?
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-[11px] text-neutral-900 font-semibold hover:underline"
                  >
                    {copiedKey ? "Copied!" : "Copy Key"}
                  </button>
                </div>
                <div className="p-2.5 bg-white border line font-mono text-[11px] text-center tracking-widest text-neutral-800 break-all select-all">
                  {totpSecret ? formatSecret(totpSecret) : "Loading..."}
                </div>
              </div>
            </div>

            {/* Right Column: Emergency Recovery Backup Codes */}
            <div className="border line p-6 bg-neutral-50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900">
                  2. Emergency Backup Codes
                </span>
                <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-wider">
                  Save Now
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                If you ever lose your phone or authenticator access, each backup code can be used
                once to log in. They will <strong className="text-neutral-900">never be displayed again</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-white p-3.5 border line">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-1 text-center tracking-widest text-neutral-800 bg-neutral-50/80 border border-neutral-100"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyAllCodes}
                  className="px-3 py-1.5 text-[11px] border line bg-white hover:bg-neutral-100 uppercase tracking-wider"
                >
                  {copiedCodes ? "Codes Copied!" : "Copy All Codes"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="px-3 py-1.5 text-[11px] border line bg-white hover:bg-neutral-100 uppercase tracking-wider"
                >
                  Download (.txt)
                </button>
              </div>
            </div>
          </div>

          {/* Verification Code Form */}
          <div className="border-t line pt-6">
            <form onSubmit={handleConfirmTotp} className="max-w-md space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-900 mb-1.5">
                  3. Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000 000"
                  className="input font-mono text-center text-lg tracking-[0.3em] font-semibold w-full max-w-xs"
                />
                <p className="text-[11px] mute mt-1">
                  Enter the 6-digit number currently showing in your authenticator app.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading || verifyCode.trim().length !== 6}
                  className="btn text-xs tracking-wider uppercase px-6 py-2.5 disabled:opacity-50"
                >
                  {actionLoading ? "Verifying..." : "Verify & Enable 2FA"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupStep("idle");
                    setPassword("");
                    setVerifyCode("");
                  }}
                  className="px-4 py-2 text-xs border line hover:bg-neutral-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DIALOG: DISABLE 2FA CONFIRMATION */}
      {/* =================================================================== */}
      {setupStep === "disable_confirm" && (
        <form onSubmit={handleConfirmDisable} className="space-y-4 max-w-md pt-2">
          <div className="border-l-2 border-red-600 pl-3">
            <span className="text-xs uppercase tracking-widest font-semibold block text-red-700">
              Disable Two-Factor Authentication
            </span>
            <p className="text-xs mute mt-0.5">
              This will remove the secondary verification layer from your administrator account.
            </p>
          </div>

          <Field
            label="Confirm Administrator Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••••••"
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading || !password}
              className="text-xs text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 uppercase tracking-wider disabled:opacity-50"
            >
              {actionLoading ? "Disabling..." : "Confirm Disable"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupStep("idle");
                setPassword("");
              }}
              className="px-4 py-2 text-xs border line hover:bg-neutral-50 uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* DIALOG: REGENERATE BACKUP CODES */}
      {/* =================================================================== */}
      {setupStep === "regen_codes" && (
        <div className="space-y-6 max-w-lg pt-2">
          <div className="border-l-2 border-neutral-900 pl-3">
            <span className="text-xs uppercase tracking-widest font-semibold block text-neutral-900">
              Regenerate Backup Codes
            </span>
            <p className="text-xs mute mt-0.5">
              Confirm your password to generate 10 new emergency backup codes. All prior codes will be
              permanently revoked.
            </p>
          </div>

          {backupCodes.length === 0 ? (
            <form onSubmit={handleRegenerateCodes} className="space-y-4">
              <Field
                label="Administrator Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="••••••••••••"
              />
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading || !password}
                  className="btn text-xs tracking-wider uppercase px-5 py-2.5 disabled:opacity-50"
                >
                  {actionLoading ? "Generating..." : "Generate New Codes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupStep("idle");
                    setPassword("");
                  }}
                  className="px-4 py-2 text-xs border line hover:bg-neutral-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 border line p-4 bg-neutral-50">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900">
                  New Emergency Backup Codes
                </span>
                <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-white p-3.5 border line">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-1 text-center tracking-widest text-neutral-800 bg-neutral-50/80 border border-neutral-100"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyAllCodes}
                  className="px-3 py-1.5 text-[11px] border line bg-white hover:bg-neutral-100 uppercase tracking-wider"
                >
                  {copiedCodes ? "Codes Copied!" : "Copy All Codes"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="px-3 py-1.5 text-[11px] border line bg-white hover:bg-neutral-100 uppercase tracking-wider"
                >
                  Download (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupStep("idle");
                    setBackupCodes([]);
                  }}
                  className="ml-auto text-xs underline text-neutral-600 hover:text-neutral-900"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
