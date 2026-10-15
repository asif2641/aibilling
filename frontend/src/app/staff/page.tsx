"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=staff");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-xs text-slate-500 font-semibold animate-pulse">
        Redirecting to Settings → Staff Management...
      </div>
    </div>
  );
}
