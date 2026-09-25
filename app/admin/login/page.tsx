"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginView } from "@/components/admin-login-view";
import { getAdminSession } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.replace("/admin");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen w-full bg-[#f6ebda] flex flex-col items-center justify-center font-serif text-[#55313c]">
        <div className="w-8 h-8 rounded-full border-2 border-[#bc965e] border-t-transparent animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest text-[#82704f]">Checking Credentials...</p>
      </div>
    );
  }

  return (
    <AdminLoginView
      onLoginSuccess={() => {
        router.replace("/admin");
      }}
    />
  );
}
