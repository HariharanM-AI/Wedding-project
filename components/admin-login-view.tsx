"use client";

import { useState } from "react";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { loginAdmin, AdminUser } from "@/lib/admin-auth";

interface AdminLoginViewProps {
  onLoginSuccess?: (user: AdminUser) => void;
}

export function AdminLoginView({ onLoginSuccess }: AdminLoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await loginAdmin(username, password);
      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        } else if (typeof window !== "undefined") {
          window.location.href = "/admin";
        }
      } else {
        setErrorMessage(result.error || "Authentication failed. Access is restricted to authorized studio owners.");
      }
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred during authorization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f6ebda] text-[#55313c] font-sans relative flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-[#ab8644] selection:text-[#fff8e9]">
      {/* Background artwork with temple and royal landscape */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/art/landscape.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.42,
          filter: "contrast(1.15) saturate(1.2)"
        }}
      />

      {/* Radiant warm golden glow backdrop overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-radial from-transparent via-[#f6ebda]/60 to-[#e8d7be]/90" />

      {/* Main Luxury Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#fffdf7]/95 backdrop-blur-md border-2 border-[#bc965e] ring-1 ring-[#bc965e]/40 p-6 sm:p-9 rounded-2xl shadow-2xl shadow-[#946f35]/25 animate-scale-up">
        {/* Top Emblem Frame */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl border-2 border-[#bc965e] bg-gradient-to-b from-[#fffcf5] via-[#fcf5e7] to-[#f5e7cd] p-1.5 shadow-lg shadow-[#946f35]/30 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-[#bc965e]/40 relative group mb-3.5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(251,243,227,0.5)_60%,_transparent_100%)] pointer-events-none" />
            <img
              src="/Hari_WEDDING_project_logo.png"
              alt="Hari Wedding Project Logo"
              className="w-full h-full object-contain scale-[1.22] filter drop-shadow-[0_2px_8px_rgba(188,150,94,0.45)] brightness-[1.06] contrast-[1.05] relative z-10"
            />
          </div>

          <h1 className="font-serif text-xl sm:text-2xl font-normal text-[#55313c] tracking-tight">
            Royal Wedding Invitation Studio
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#82704f] font-serif uppercase tracking-widest">
            <ShieldCheck size={14} className="text-[#946f35]" />
            <span>Owner & Administrator Portal</span>
          </div>

          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#bc965e] to-transparent mt-3.5" />
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50/90 border border-rose-200/80 text-rose-900 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1 font-serif leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
              Administrator Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#82704f]">
                <User size={15} />
              </div>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-[#fffaf0] border border-[#bc965e] pl-9 pr-3.5 py-2.5 text-sm text-[#55313c] rounded-md focus:outline-none focus:ring-1.5 focus:ring-[#946f35] focus:border-[#946f35] placeholder:text-[#ab9776]/70 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
              Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#82704f]">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                className="w-full bg-[#fffaf0] border border-[#bc965e] pl-9 pr-10 py-2.5 text-sm text-[#55313c] rounded-md focus:outline-none focus:ring-1.5 focus:ring-[#946f35] focus:border-[#946f35] placeholder:text-[#ab9776]/70 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#82704f] hover:text-[#55313c] transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="relative overflow-hidden w-full h-11 text-xs sm:text-sm font-serif font-semibold bg-gradient-to-r from-[#946f35] via-[#a77e3c] to-[#7f5d2b] hover:from-[#a77e3c] hover:via-[#b88c45] hover:to-[#8f6931] text-[#fff8e7] border border-[#6b4e23] hover:shadow-lg hover:shadow-[#946f35]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 rounded-md flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-75 disabled:pointer-events-none group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#fff8e7]" />
                  <span>Authorizing Studio Access...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Studio Portal</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-[#bc965e]/30 text-center">
          <p className="text-[11px] text-[#82704f] font-serif leading-relaxed">
            Restricted access. Dedicated to verified studio owners and credentialed wedding planners.
          </p>
        </div>
      </div>
    </div>
  );
}
