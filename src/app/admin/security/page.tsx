"use client";

import { AdminTwoFactorCard } from "@/components/admin/security/AdminTwoFactorCard";
import { AdminSessionsCard } from "@/components/admin/security/AdminSessionsCard";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="serif text-2xl mb-1">Account Security & Access</h1>
        <p className="mute text-xs">
          Manage two-factor authentication, active login sessions, and credential protections.
        </p>
      </div>

      <AdminTwoFactorCard />
      <AdminSessionsCard />
    </div>
  );
}

