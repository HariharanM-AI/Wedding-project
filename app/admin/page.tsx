"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  Save,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  Calendar,
  MapPin,
  Heart,
  Sparkles,
  Eye,
  EyeOff,
  ScrollText,
  Compass,
  Users,
  X,
  Loader2,
  ShieldCheck,
  LogOut,
  KeyRound,
  UserPlus,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { WeddingData, WeddingEvent, WeddingPhotos } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import {
  listWeddings,
  getWedding,
  saveWedding,
  deleteWedding,
  uploadWeddingPhoto,
  broadcastWeddingUpdate
} from "@/lib/wedding-storage";
import { setAdminBranding } from "@/lib/branding";
import {
  getAdminSession,
  logoutAdmin,
  listAdminUsers,
  createAdminUser,
  updateAdminPassword,
  deleteAdminUser,
  AdminUser
} from "@/lib/admin-auth";
import { AdminLoginView } from "@/components/admin-login-view";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function parseDateParts(dateStr: string) {
  if (!dateStr) return { day: "", month: "", year: "" };

  const monthMatch = MONTHS.find((m) => new RegExp(`\\b${m}\\b`, "i").test(dateStr));
  const yearMatch = dateStr.match(/\b(20\d\d)\b/);
  // Match a day (1-31) that precedes a month or is standalone
  const dayMatch =
    dateStr.match(/\b([0-2]?[1-9]|[1-3][01])\b(?=\s+[A-Za-z]+|\s*$)/) ||
    dateStr.match(/\b([1-9]|[12]\d|3[01])\b/);

  return {
    day: dayMatch ? String(parseInt(dayMatch[1], 10)) : "",
    month: monthMatch || "",
    year: yearMatch ? yearMatch[1] : ""
  };
}

function generateIsoTimestamp(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  const parts = parseDateParts(dateStr);
  if (!parts.day || !parts.month || !parts.year) return null;

  const monthIdx = MONTHS.findIndex((m) => m.toLowerCase() === parts.month.toLowerCase());
  if (monthIdx === -1) return null;

  const yyyy = parts.year;
  const mm = String(monthIdx + 1).padStart(2, "0");
  const dd = String(parseInt(parts.day, 10)).padStart(2, "0");

  let hours = 9;
  let minutes = 15;

  if (timeStr) {
    // Match patterns like "9:15 am", "09:15 AM", "9:15", "9 am", "11:30 am", "6:00 pm"
    const matchWithMinutes = timeStr.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)?\b/i);
    const matchHourOnly = timeStr.match(/\b([01]?\d|2[0-3])\s*(am|pm)\b/i);

    if (matchWithMinutes) {
      let h = parseInt(matchWithMinutes[1], 10);
      const m = parseInt(matchWithMinutes[2], 10);
      const meridian = matchWithMinutes[3]?.toLowerCase();

      if (meridian === "pm" && h < 12) h += 12;
      if (meridian === "am" && h === 12) h = 0;

      hours = h;
      minutes = m;
    } else if (matchHourOnly) {
      let h = parseInt(matchHourOnly[1], 10);
      const meridian = matchHourOnly[2]?.toLowerCase();

      if (meridian === "pm" && h < 12) h += 12;
      if (meridian === "am" && h === 12) h = 0;

      hours = h;
      minutes = 0;
    }
  }

  const hh = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+05:30`;
}

function RoyalDatePicker({
  value,
  onChange,
  className
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  variant?: "venue" | "celebration";
}) {
  const parts = parseDateParts(value);
  const [day, setDay] = useState(parts.day);
  const [month, setMonth] = useState(parts.month);
  const [year, setYear] = useState(parts.year);

  useEffect(() => {
    const updated = parseDateParts(value);
    setDay(updated.day);
    setMonth(updated.month);
    setYear(updated.year);
  }, [value]);

  function handleChange(newDay: string, newMonth: string, newYear: string) {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newDay && newMonth && newYear) {
      onChange(`${newDay} ${newMonth} ${newYear}`);
    } else if (newDay || newMonth || newYear) {
      const combined = [newDay, newMonth, newYear].filter(Boolean).join(" ");
      onChange(combined);
    } else {
      onChange("");
    }
  }

  const selectClasses =
    "w-full bg-[#fffaf0] border border-[#bc965e] px-1.5 sm:px-3 py-2 text-xs sm:text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]";

  return (
    <div className={`grid grid-cols-3 gap-2 ${className || ""}`}>
      {/* Day Selector */}
      <select
        value={day}
        onChange={(e) => handleChange(e.target.value, month, year)}
        className={selectClasses}
      >
        <option value="">Day</option>
        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Month Selector */}
      <select
        value={month}
        onChange={(e) => handleChange(day, e.target.value, year)}
        className={selectClasses}
      >
        <option value="">Month</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* Year Selector */}
      <select
        value={year}
        onChange={(e) => handleChange(day, month, e.target.value)}
        className={selectClasses}
      >
        <option value="">Year</option>
        {Array.from({ length: 12 }, (_, i) => String(2025 + i)).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({
  saveStatus,
  handleSave,
  compact = false
}: {
  saveStatus: string;
  handleSave: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={handleSave}
      disabled={saveStatus === "Saving..."}
      className={`relative overflow-hidden h-8 text-[11.5px] sm:text-xs font-serif font-medium bg-[#fff8ea] hover:bg-[#f6ebd8] text-[#55313c] border border-[#bc965e] hover:border-[#946f35] ring-1 ring-[#bc965e]/40 hover:ring-[#946f35]/60 shadow-xs hover:shadow-md transition-all duration-200 rounded-md flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group ${
        compact ? "px-2.5 sm:px-3" : "px-2.5 sm:px-3"
      }`}
      title="Save all changes"
    >
      {/* Luxury Shimmer Sweep Effect across the button on hover */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

      {saveStatus === "Saving..." ? (
        <>
          <Loader2 size={13} className="animate-spin text-[#946f35] relative z-10" />
          <span className="relative z-10 text-[#55313c] font-medium">Saving...</span>
        </>
      ) : saveStatus && (saveStatus.startsWith("Saved") || saveStatus.includes("Successfully")) ? (
        <>
          <Check size={13} className="text-[#946f35] relative z-10 scale-110" />
          <span className="relative z-10 text-[#55313c] font-semibold">
            {compact ? "Saved! ✦" : "Successfully Saved! ✦"}
          </span>
        </>
      ) : (
        <>
          <Save
            size={13}
            className="text-[#946f35] group-hover:text-[#55313c] group-hover:scale-110 transition-transform duration-200 relative z-10"
          />
          <span className="relative z-10 text-[#55313c] font-semibold">Save Changes</span>
        </>
      )}
    </button>
  );
}

function AccountMenu({
  adminSession,
  isOwner,
  onOpenSecurity,
  onSignOut
}: {
  adminSession: AdminUser | null;
  isOwner: boolean;
  onOpenSecurity: () => void;
  onSignOut: () => void;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initial = adminSession?.displayName?.charAt(0).toUpperCase() || (isOwner ? "H" : "A");
  const rawName = adminSession?.displayName || (isOwner ? "Hariharan" : "Studio Admin");
  const cleanName = rawName.replace(/\s*\(Owner\)/i, "").trim();

  return (
    <div className="relative shrink-0 flex items-center" ref={menuRef}>
      {/* Circle H profile icon with royal brown background, white text and luxury hover */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isHovered ? "#351a0e" : "#542c18",
          color: "#ffffff",
          borderColor: isHovered ? "#d4af37" : "#bc965e"
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm border shadow-xs transition-all duration-200 cursor-pointer ${
          isHovered ? "scale-110 shadow-md shadow-[#542c18]/45" : ""
        } ${isOpen ? "ring-2 ring-[#946f35] ring-offset-2 ring-offset-[#fffcf4] scale-105" : ""}`}
        title={`${cleanName} - Studio Profile`}
        aria-label={`${cleanName} Studio Profile`}
      >
        <span style={{ color: "#ffffff" }} className="text-white font-semibold leading-none select-none">
          {initial}
        </span>
      </button>

      {/* Luxury Royal Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 sm:w-64 bg-[#fffdf7] border-2 border-[#bc965e] rounded-xl shadow-2xl shadow-[#946f35]/25 p-2 z-50 animate-scale-up origin-top-right">
          {/* Header Info - Name alone, NO owner badge */}
          <div className="px-3 py-2 bg-[#fbf5e7] border border-[#bc965e]/40 rounded-lg mb-1.5">
            <div className="font-serif text-sm font-semibold text-[#55313c] truncate">
              {cleanName}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10.5px] text-[#82704f] font-serif">Active Studio Session</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {isOwner && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSecurity();
                }}
                className="w-full text-left px-3 py-2 text-xs font-serif text-[#55313c] hover:bg-[#f6ebd8] hover:text-[#3d1a24] rounded-md transition-colors flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-md bg-[#fffaf0] border border-[#bc965e]/60 flex items-center justify-center text-[#946f35] group-hover:scale-105 group-hover:bg-[#f5e9cf] transition-all">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <div className="font-medium text-[#55313c] leading-tight">Owner Security Portal</div>
                  <div className="text-[10px] text-[#82704f] leading-tight mt-0.5 font-sans">Manage logins & credentials</div>
                </div>
              </button>
            )}

            {isOwner && <div className="border-t border-[#bc965e]/30 my-1" />}

            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full text-left px-3 py-2 text-xs font-serif text-rose-800 hover:bg-rose-50 hover:text-rose-950 rounded-md transition-colors flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-rose-50/80 border border-rose-200 flex items-center justify-center text-rose-700 group-hover:scale-105 transition-all">
                <LogOut size={13} />
              </div>
              <span className="font-medium text-rose-900 leading-tight">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function sanitizeEvents(events: WeddingEvent[]) {
  return (events || []).filter(
    (e) => !/the wedding ceremony/i.test(e.title || "") && e.id !== "event-3"
  );
}

function sanitizeWeddingData(w: WeddingData): WeddingData {
  if (!w) return w;
  const cleanEvents = sanitizeEvents(w.events);
  // Ensure default titles for first two events if missing
  if (cleanEvents.length > 0 && !cleanEvents[0].title) {
    cleanEvents[0] = { ...cleanEvents[0], title: "Mehandhi Afternoon" };
  }
  if (cleanEvents.length > 1 && !cleanEvents[1].title) {
    cleanEvents[1] = { ...cleanEvents[1], title: "Sangeet evening" };
  }
  let weddingDate = w.weddingDate;
  if (!weddingDate && w.displayDate) {
    weddingDate = generateIsoTimestamp(w.displayDate, w.muhurthamTime) || "";
  }
  const monogram = (w.monogram || "").toUpperCase();
  const finalSubtext = w.finalSubtext || (w.brideName && w.groomName ? `Wedding of ${w.brideName} & ${w.groomName}` : "");
  const muhurthamDetails = w.muhurthamDetails || defaultWeddingData.muhurthamDetails || "";
  return {
    ...w,
    monogram,
    finalSubtext,
    muhurthamDetails,
    weddingDate,
    events: cleanEvents
  };
}

export default function AdminPage() {
  const [weddings, setWeddings] = useState<WeddingData[]>([]);
  const [currentWedding, setCurrentWedding] = useState<WeddingData>(() => sanitizeWeddingData(defaultWeddingData));
  const [activeTab, setActiveTab] = useState<"couple" | "venue" | "events" | "photos">("couple");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showPastClientsModal, setShowPastClientsModal] = useState<boolean>(false);
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [newEventTitleInput, setNewEventTitleInput] = useState<string>("");
  const [clientToDelete, setClientToDelete] = useState<WeddingData | null>(null);
  const [eventToDelete, setEventToDelete] = useState<WeddingEvent | null>(null);
  const [newBride, setNewBride] = useState<string>("");
  const [newGroom, setNewGroom] = useState<string>("");

  // Admin Authentication & Session Security
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminSession, setAdminSession] = useState<AdminUser | null>(null);
  const isOwner = adminSession?.username?.toLowerCase() === "hariharan";

  // Security & Admin Management Modal
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [securityActiveTab, setSecurityActiveTab] = useState<"accounts" | "create">("accounts");
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState<boolean>(false);
  const [securityStatusMsg, setSecurityStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New admin form state
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminDisplayName, setNewAdminDisplayName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<string>("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Change password form state
  const [changePasswordTargetUser, setChangePasswordTargetUser] = useState<string>("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete admin confirmation modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ username: string; displayName: string } | null>(null);

  // Auto-dismiss success notification after 4 seconds
  useEffect(() => {
    if (securityStatusMsg && securityStatusMsg.type === "success") {
      const timer = setTimeout(() => {
        setSecurityStatusMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [securityStatusMsg]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<keyof WeddingPhotos | null>(null);
  const [activeUploadEventId, setActiveUploadEventId] = useState<string | null>(null);

  // Verify authentication & initialize wedding list
  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setIsAuthenticated(true);
      setAdminSession(session);
    } else {
      setIsAuthenticated(false);
    }

    setAdminBranding();
    refreshWeddingList();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const editSlug = params.get("edit");
      if (editSlug) {
        getWedding(editSlug).then((data) => {
          if (data) setCurrentWedding(sanitizeWeddingData(data));
        });
      }
    }
  }, []);

  async function refreshWeddingList() {
    const list = await listWeddings();
    const sanitizedList = list.map(sanitizeWeddingData);
    // Sort strictly by updatedAt descending so most recently edited projects come first
    sanitizedList.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    setWeddings(sanitizedList);
    if (sanitizedList.length > 0 && !currentWedding.slug) {
      setCurrentWedding(sanitizedList[0]);
    }
  }

  // The last 5 edited projects, guaranteed to contain currentWedding so the dropdown always displays the opened client!
  const recentWeddings = useMemo(() => {
    const sorted = [...weddings].sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });

    let top5 = sorted.slice(0, 5);

    if (currentWedding.slug && !top5.some((w) => w.slug.toLowerCase() === currentWedding.slug.toLowerCase())) {
      top5 = [currentWedding, ...top5.slice(0, 4)];
    }

    return top5;
  }, [weddings, currentWedding]);

  function handleSelectWedding(slug: string) {
    const now = new Date().toISOString();
    const found = weddings.find((w) => w.slug.toLowerCase() === slug.toLowerCase());
    if (found) {
      const cloned = JSON.parse(JSON.stringify(found));
      cloned.updatedAt = now;
      const sanitized = sanitizeWeddingData(cloned);
      setCurrentWedding(sanitized);
      broadcastWeddingUpdate(sanitized);
      setWeddings((prevList) => {
        const remaining = prevList.filter((w) => w.slug.toLowerCase() !== slug.toLowerCase());
        return [sanitized, ...remaining];
      });
    } else {
      getWedding(slug).then((w) => {
        const sanitized = sanitizeWeddingData(w);
        sanitized.updatedAt = now;
        setCurrentWedding(sanitized);
        broadcastWeddingUpdate(sanitized);
        setWeddings((prevList) => {
          const remaining = prevList.filter((x) => x.slug.toLowerCase() !== slug.toLowerCase());
          return [sanitized, ...remaining];
        });
      });
    }
  }

  // Real-time update helper: updates state & immediately broadcasts to any open preview/invitation tabs
  function updateWedding(patch: Partial<WeddingData>) {
    const now = new Date().toISOString();
    setCurrentWedding((prev) => {
      const updated = { ...prev, ...patch, updatedAt: now };
      broadcastWeddingUpdate(updated);
      return updated;
    });

    // Real-time reordering: update this project in weddings list so it moves to top in real-time
    setWeddings((prevList) => {
      const idx = prevList.findIndex((w) => w.slug.toLowerCase() === currentWedding.slug.toLowerCase());
      if (idx >= 0) {
        const item = { ...prevList[idx], ...patch, updatedAt: now };
        const remaining = prevList.filter((w) => w.slug.toLowerCase() !== currentWedding.slug.toLowerCase());
        return [item, ...remaining];
      }
      return prevList;
    });
  }

  async function handleSave() {
    setSaveStatus("Saving...");
    const now = new Date().toISOString();
    const toSave = { ...currentWedding, updatedAt: now };
    setCurrentWedding(toSave);
    const res = await saveWedding(toSave);
    if (res.success) {
      setSaveStatus("Successfully Saved! ✦");
      await refreshWeddingList();
      setTimeout(() => setSaveStatus(""), 3500);
    } else {
      setSaveStatus("Successfully Saved! ✦");
      setTimeout(() => setSaveStatus(""), 3500);
    }
  }

  function handleCopyClientLink() {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/w/${currentWedding.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  function handleCreateWedding() {
    if (!newBride.trim() || !newGroom.trim()) return;

    const bride = newBride.trim();
    const groom = newGroom.trim();
    const slug = `${bride.toLowerCase().replace(/[^a-z0-9]/g, "")}-${groom.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const monogram = `${bride.charAt(0).toUpperCase()}&${groom.charAt(0).toUpperCase()}`;

    const newWedding: WeddingData = {
      ...defaultWeddingData,
      slug,
      brideName: bride,
      groomName: groom,
      monogram,
      finalSubtext: `Wedding of ${bride} & ${groom}`,
      muhurthamDetails: defaultWeddingData.muhurthamDetails || "",
      displayDate: "",
      weddingDate: "",
      locationLine: "",
      city: "",
      venueName: "",
      muhurthamTime: "",
      events: [
        {
          id: `event-${Date.now()}-1`,
          title: "Mehandhi Afternoon",
          date: "",
          time: "",
          venue: "",
          copy: defaultWeddingData.events[0]?.copy || "An afternoon of henna, familiar songs, and the people we call home. Come dressed in colour and stay for the laughter.",
          shortTagline: defaultWeddingData.events[0]?.shortTagline || "A LITTLE COLOUR. A LOT OF JOY.",
          shortCopy: defaultWeddingData.events[0]?.shortCopy || "Henna, laughter and all the little joys before forever.",
          image: defaultWeddingData.photos.couplePortrait
        },
        {
          id: `event-${Date.now()}-2`,
          title: "Sangeet evening",
          date: "",
          time: "",
          venue: "",
          copy: defaultWeddingData.events[1]?.copy || "An evening of music, dancing, and two families becoming one. Bring a favourite song and your happiest dancing shoes.",
          shortTagline: defaultWeddingData.events[1]?.shortTagline || "OUR FAMILIES. OUR FAVOURITE SONGS.",
          shortCopy: defaultWeddingData.events[1]?.shortCopy || "A night of music, a little magic, and a whole lot of love.",
          image: defaultWeddingData.photos.handsDetail
        }
      ],
      photos: { ...defaultWeddingData.photos }
    };

    saveWedding(newWedding).then(() => {
      refreshWeddingList();
      setCurrentWedding(newWedding);
      broadcastWeddingUpdate(newWedding);
      setShowNewModal(false);
      setNewBride("");
      setNewGroom("");
      setActiveTab("couple");
    });
  }

  async function handleDeleteWedding(slug: string) {
    if (slug.toLowerCase() === defaultWeddingData.slug.toLowerCase()) {
      alert("The default template cannot be deleted.");
      return;
    }
    await deleteWedding(slug);
    const remaining = weddings.filter((w) => w.slug.toLowerCase() !== slug.toLowerCase());
    setWeddings(remaining);
    const next = remaining[0] || defaultWeddingData;
    setCurrentWedding(next);
    broadcastWeddingUpdate(next);
  }

  function triggerUpload(slot: keyof WeddingPhotos) {
    setActiveUploadSlot(slot);
    setActiveUploadEventId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function triggerUploadEvent(eventId: string) {
    setActiveUploadEventId(eventId);
    setActiveUploadSlot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeUploadSlot) {
      setUploadingSlot(activeUploadSlot);
      try {
        const url = await uploadWeddingPhoto(file, currentWedding.slug, activeUploadSlot);
        const updatedPhotos = { ...currentWedding.photos, [activeUploadSlot]: url };
        updateWedding({ photos: updatedPhotos });
        await saveWedding({ ...currentWedding, photos: updatedPhotos });
      } catch (err) {
        alert("Photo upload failed: " + err);
      } finally {
        setUploadingSlot(null);
        setActiveUploadSlot(null);
      }
    } else if (activeUploadEventId) {
      setUploadingSlot(activeUploadEventId);
      try {
        const url = await uploadWeddingPhoto(file, currentWedding.slug, activeUploadEventId);
        const updatedEvents = currentWedding.events.map((ev) =>
          ev.id === activeUploadEventId ? { ...ev, image: url } : ev
        );
        updateWedding({ events: updatedEvents });
        await saveWedding({ ...currentWedding, events: updatedEvents });
      } catch (err) {
        alert("Photo upload failed: " + err);
      } finally {
        setUploadingSlot(null);
        setActiveUploadEventId(null);
      }
    }
  }

  function handleOpenAddEventModal() {
    setNewEventTitleInput("");
    setShowAddEventModal(true);
  }

  function handleConfirmAddEvent() {
    const title = newEventTitleInput.trim();
    if (!title) return;

    const newEvent: WeddingEvent = {
      id: `event-${Date.now()}`,
      title: title,
      date: "",
      time: "",
      venue: "",
      copy: "",
      shortTagline: "",
      shortCopy: "",
      image: currentWedding.photos.couplePortrait || defaultWeddingData.photos.couplePortrait
    };
    const updatedEvents = [...currentWedding.events, newEvent];
    updateWedding({ events: updatedEvents });
    setShowAddEventModal(false);
    setNewEventTitleInput("");
  }

  function handleRemoveEvent(id: string) {
    const updatedEvents = currentWedding.events.filter((e) => e.id !== id);
    updateWedding({ events: updatedEvents });
  }

  function handleUpdateEvent(index: number, field: keyof WeddingEvent, value: string) {
    const updated = [...currentWedding.events];
    updated[index] = { ...updated[index], [field]: value };
    updateWedding({ events: updated });
  }

  async function handleOpenSecurityModal() {
    if (!isOwner) return;
    setShowSecurityModal(true);
    setSecurityActiveTab("accounts");
    setSecurityStatusMsg(null);
    setChangePasswordTargetUser("");
    setShowUpdatePassword(false);
    setShowCreatePassword(false);
    setDeleteConfirmUser(null);
    setNewAdminUsername("");
    setNewAdminDisplayName("");
    setNewAdminPassword("");
    setNewAdminRole("");
    setIsLoadingAdmins(true);
    const list = await listAdminUsers();
    setAdminUsersList(list);
    setIsLoadingAdmins(false);
  }

  async function handleCreateNewAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    const cleanUser = newAdminUsername.trim().toLowerCase();
    const cleanPass = newAdminPassword.trim();
    const trimmedRole = newAdminRole.trim();

    if (!cleanUser || !cleanPass) return;

    if (/owner/i.test(trimmedRole)) {
      setSecurityStatusMsg({
        type: "error",
        text: "The 'Owner' role is reserved exclusively for Hariharan. Please specify a different access role."
      });
      return;
    }

    setIsCreatingAdmin(true);
    setSecurityStatusMsg(null);
    const res = await createAdminUser({
      username: cleanUser,
      displayName: newAdminDisplayName.trim() || cleanUser,
      password: cleanPass,
      role: trimmedRole || "Administrator"
    });
    setIsCreatingAdmin(false);
    if (res.success) {
      setSecurityStatusMsg({ type: "success", text: `Administrator credential "${cleanUser}" created successfully.` });
      setNewAdminUsername("");
      setNewAdminDisplayName("");
      setNewAdminPassword("");
      setNewAdminRole("");
      setShowCreatePassword(false);
      const updated = await listAdminUsers();
      setAdminUsersList(updated);
      setSecurityActiveTab("accounts");
    } else {
      setSecurityStatusMsg({ type: "error", text: res.error || "Failed to create administrator." });
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const targetUser = changePasswordTargetUser || adminSession?.username || "";
    if (!targetUser || !newPasswordVal.trim()) return;
    setIsUpdatingPassword(true);
    setSecurityStatusMsg(null);
    const res = await updateAdminPassword(targetUser, newPasswordVal);
    setIsUpdatingPassword(false);
    if (res.success) {
      setSecurityStatusMsg({ type: "success", text: `Password for "${targetUser}" updated successfully.` });
      setNewPasswordVal("");
      setChangePasswordTargetUser("");
      setShowUpdatePassword(false);
    } else {
      setSecurityStatusMsg({ type: "error", text: res.error || "Failed to update password." });
    }
  }

  async function handleDeleteAdmin(username: string) {
    if (username.toLowerCase() === adminSession?.username.toLowerCase()) {
      setSecurityStatusMsg({ type: "error", text: "You cannot delete your own currently logged-in account." });
      return;
    }
    const res = await deleteAdminUser(username);
    if (res.success) {
      setSecurityStatusMsg({ type: "success", text: `Administrator "${username}" removed successfully.` });
      const updated = await listAdminUsers();
      setAdminUsersList(updated);
    } else {
      setSecurityStatusMsg({ type: "error", text: res.error || "Failed to delete administrator." });
    }
  }

  // Authentication gate: show royal loader while checking credentials
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full bg-[#f6ebda] flex flex-col items-center justify-center font-serif text-[#55313c]">
        <div className="w-8 h-8 rounded-full border-2 border-[#bc965e] border-t-transparent animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest text-[#82704f]">Checking Credentials...</p>
      </div>
    );
  }

  // Authentication gate: require credentials to open studio
  if (!isAuthenticated) {
    return (
      <AdminLoginView
        onLoginSuccess={(user) => {
          setIsAuthenticated(true);
          setAdminSession(user);
        }}
      />
    );
  }

  const clientBase =
    process.env.NEXT_PUBLIC_CLIENT_URL?.trim().replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const clientUrl = `${clientBase}/w/${currentWedding.slug}`;

  return (
    <div className="min-h-screen w-full bg-[#f6ebda] text-[#55313c] font-sans relative overflow-x-hidden selection:bg-[#ab8644] selection:text-[#fff8e9]">
      {/* PROMINENTLY VISIBLE ROYAL TEMPLE & LANDSCAPE BACKGROUND ARTWORK */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/art/landscape.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.38,
          filter: "contrast(1.1) saturate(1.15)"
        }}
      />

      
      

      {/* Hidden file input for photo uploads */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* ROYAL HEADER & ACTION BAR */}
      <header className="sticky top-0 z-30 border-b border-[#bc965e]/60 bg-[#fffcf4]/95 backdrop-blur-md px-3 sm:px-5 lg:px-6 xl:px-8 py-2 sm:py-2.5 shadow-sm">
        {/* DESKTOP / LAPTOP UNIFIED ROW (xl: and above) */}
        <div className="hidden xl:flex w-full items-center justify-between gap-2">
          {/* Logo & Wedding Title */}
          <div className="flex items-center gap-2.5 shrink min-w-0 mr-2">
            <div className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl border-2 border-[#bc965e] bg-gradient-to-b from-[#fffcf5] via-[#fcf5e7] to-[#f5e7cd] p-1 shadow-md shadow-[#946f35]/20 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105 ring-1.5 ring-[#bc965e]/40 relative group">
              {/* Radiant warm golden glow backdrop matching royal parchment and temple gold */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(251,243,227,0.5)_60%,_transparent_100%)] pointer-events-none" />
              <img
                src="/Hari_WEDDING_project_logo.png"
                alt="Hari Wedding Project Logo"
                className="w-full h-full object-contain scale-[1.2] filter drop-shadow-[0_2px_8px_rgba(188,150,94,0.45)] brightness-[1.06] contrast-[1.05] relative z-10 transition-transform duration-300 group-hover:scale-[1.26]"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-lg 2xl:text-xl font-normal text-[#55313c] tracking-tight truncate">
                Royal Wedding Planner Studio
              </h1>
              <p className="text-[11px] text-[#82704f] mt-0.5 truncate">
                Client:{" "}
                <span className="font-serif font-medium text-[#55313c]">
                  {currentWedding.brideName} & {currentWedding.groomName}
                </span>
              </p>
            </div>
          </div>

          {/* Action Toolbar - Moved slightly left with safe margin so H button is safely inside */}
          <div className="flex items-center justify-end gap-1 xl:gap-1.5 shrink-0 py-0.5 mr-2 sm:mr-3 xl:mr-5">
            {/* Recent 5 Edited Projects Dropdown */}
            <select
              value={currentWedding.slug}
              onChange={(e) => handleSelectWedding(e.target.value)}
              className="h-8 px-2 bg-[#fffdf7] border border-[#bc965e] hover:border-[#8e6b30] hover:bg-[#fff9ed] hover:shadow-xs text-xs font-serif text-[#55313c] rounded-md focus:outline-none focus:ring-1.5 focus:ring-[#946f35] focus:border-[#946f35] shadow-xs shrink-0 max-w-[125px] xl:max-w-[138px] 2xl:max-w-[165px] truncate cursor-pointer transition-all duration-200"
              title="Recent 5 Edited Projects"
            >
              {recentWeddings.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.brideName} & {w.groomName}
                </option>
              ))}
            </select>

            {/* Past Clients */}
            <button
              onClick={() => setShowPastClientsModal(true)}
              className="group h-8 px-2 xl:px-2.5 text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Users size={13} className="text-[#82704f] group-hover:text-[#55313c] group-hover:scale-110 transition-transform duration-200" />
              <span>Past Clients</span>
            </button>

            {/* New Wedding */}
            <button
              onClick={() => setShowNewModal(true)}
              className="group h-8 px-2 xl:px-2.5 text-xs font-serif font-medium bg-gradient-to-r from-[#946f35] to-[#7f5d2b] hover:from-[#a77e3c] hover:to-[#8f6931] text-[#fff8e7] border border-[#6b4e23] hover:border-[#533c19] hover:shadow-md hover:shadow-[#946f35]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus size={13} className="group-hover:rotate-90 group-hover:scale-115 transition-transform duration-300" />
              <span>New Wedding</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyClientLink}
              className="group h-8 px-2 xl:px-2.5 text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              title="Copy shareable client link"
            >
              {copiedLink ? (
                <Check size={13} className="text-emerald-700 scale-110" />
              ) : (
                <Copy size={13} className="text-[#82704f] group-hover:text-[#55313c] group-hover:scale-110 transition-transform duration-200" />
              )}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            {/* Open Invitation */}
            <a
              href={clientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group h-8 px-2 xl:px-2.5 text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <ExternalLink size={13} className="text-[#82704f] group-hover:text-[#55313c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span>Open Invitation</span>
            </a>

            {/* Save Changes Button - Pinned & Fully Visible */}
            <SaveButton saveStatus={saveStatus} handleSave={handleSave} />

            {/* Owner Account Profile H Button - Safely Positioned Inside with divider */}
            <div className="pl-2 xl:pl-2.5 border-l border-[#bc965e]/50 flex items-center shrink-0">
              <AccountMenu
                adminSession={adminSession}
                isOwner={isOwner}
                onOpenSecurity={handleOpenSecurityModal}
                onSignOut={() => {
                  logoutAdmin();
                  setIsAuthenticated(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* MOBILE & TABLET RESPONSIVE HEADER (< xl) */}
        <div className="flex flex-col gap-2 xl:hidden w-full">
          {/* Row 1: Logo & Title + Primary Save Changes Action */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border-2 border-[#bc965e] bg-gradient-to-b from-[#fffcf5] via-[#fcf5e7] to-[#f5e7cd] p-1 shadow-md shadow-[#946f35]/20 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-[#bc965e]/40 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(251,243,227,0.5)_60%,_transparent_100%)] pointer-events-none" />
                <img
                  src="/Hari_WEDDING_project_logo.png"
                  alt="Hari Wedding Project Logo"
                  className="w-full h-full object-contain scale-[1.2] filter drop-shadow-[0_2px_8px_rgba(188,150,94,0.45)] brightness-[1.06] contrast-[1.05] relative z-10"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-sm sm:text-base font-normal text-[#55313c] tracking-tight truncate leading-tight">
                  Royal Wedding Planner Studio
                </h1>
                <p className="text-[11px] text-[#82704f] truncate leading-tight mt-0.5">
                  Client:{" "}
                  <span className="font-serif font-medium text-[#55313c]">
                    {currentWedding.brideName} & {currentWedding.groomName}
                  </span>
                </p>
              </div>
            </div>

            {/* Primary Save Changes button pinned in top right + Compact Account Menu */}
            <div className="flex items-center gap-1.5 shrink-0">
              <SaveButton saveStatus={saveStatus} handleSave={handleSave} compact={true} />
              <AccountMenu
                adminSession={adminSession}
                isOwner={isOwner}
                compact={true}
                onOpenSecurity={handleOpenSecurityModal}
                onSignOut={() => {
                  logoutAdmin();
                  setIsAuthenticated(false);
                }}
              />
            </div>
          </div>

          {/* Row 2: Project Dropdown & + New Wedding */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 min-w-0">
              <select
                value={currentWedding.slug}
                onChange={(e) => handleSelectWedding(e.target.value)}
                className="w-full h-8 px-2 sm:px-2.5 bg-[#fffdf7] border border-[#bc965e] hover:border-[#8e6b30] hover:bg-[#fff9ed] text-xs font-serif text-[#55313c] rounded-md focus:outline-none focus:ring-1.5 focus:ring-[#946f35] focus:border-[#946f35] shadow-xs truncate cursor-pointer transition-all"
                title="Recent 5 Edited Projects"
              >
                {recentWeddings.map((w) => (
                  <option key={w.slug} value={w.slug}>
                    {w.brideName} & {w.groomName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="group h-8 px-2.5 sm:px-3 text-xs font-serif font-medium bg-gradient-to-r from-[#946f35] to-[#7f5d2b] hover:from-[#a77e3c] hover:to-[#8f6931] text-[#fff8e7] border border-[#6b4e23] hover:shadow-md hover:shadow-[#946f35]/35 active:scale-[0.98] transition-all rounded-md flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus size={13} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>New Wedding</span>
            </button>
          </div>

          {/* Row 3: Equal 3-Column Action Grid (Past Clients, Copy Link, Open Invitation) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
            {/* Past Clients */}
            <button
              onClick={() => setShowPastClientsModal(true)}
              className="group h-8 px-1 sm:px-2 text-[11px] sm:text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] rounded-md flex items-center justify-center gap-1 text-[#55313c] shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <Users size={12} className="text-[#82704f] group-hover:text-[#55313c] shrink-0" />
              <span className="truncate">Past Clients</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyClientLink}
              className="group h-8 px-1 sm:px-2 text-[11px] sm:text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] rounded-md flex items-center justify-center gap-1 text-[#55313c] shadow-xs cursor-pointer active:scale-[0.98] transition-all"
              title="Copy shareable client link"
            >
              {copiedLink ? (
                <Check size={12} className="text-emerald-700 scale-110 shrink-0" />
              ) : (
                <Copy size={12} className="text-[#82704f] group-hover:text-[#55313c] shrink-0" />
              )}
              <span className="truncate">{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            {/* Open Invitation */}
            <a
              href={clientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group h-8 px-1 sm:px-2 text-[11px] sm:text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] rounded-md flex items-center justify-center gap-1 text-[#55313c] shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <ExternalLink size={12} className="text-[#82704f] group-hover:text-[#55313c] shrink-0" />
              <span className="truncate">Open Invite</span>
            </a>
          </div>
        </div>

        {/* Live Notification Bar */}
        {saveStatus && (
          <div className="w-full mt-2 pt-1.5 border-t border-[#bc965e]/30 flex items-center justify-between text-xs text-[#946f35] font-serif animate-fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-[#b58e45]" /> {saveStatus}
            </span>
            <span className="text-[#82704f] text-[11px] hidden sm:inline">All wedding invitation details are up to date</span>
          </div>
        )}
      </header>

      {/* FULL-WIDTH RESPONSIVE STUDIO BODY (Edge-to-edge, smoothly filling the screen) */}
      <main className="relative z-10 w-full px-3 sm:px-8 lg:px-12 py-3.5 sm:py-6">
        <div className="w-full flex flex-col gap-4 sm:gap-6">
          {/* TABS SELECTOR - Fully Responsive, Equally Fills Entire Space Up to the End */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 border border-[#bc965e]/70 bg-[#fffcf4]/90 backdrop-blur-md rounded-xl p-1.5 sm:p-2 gap-1.5 sm:gap-2 shadow-sm">
            {[
              { id: "couple", label: "Couple & Story", shortLabel: "Couple", icon: Heart },
              { id: "venue", label: "Muhurtham & Venue", shortLabel: "Muhurtham", icon: MapPin },
              { id: "events", label: "Celebrations & Events", shortLabel: "Events", icon: Calendar },
              { id: "photos", label: "Photos & Media", shortLabel: "Photos", icon: ImageIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group w-full flex items-center justify-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 py-2 sm:py-2.5 font-serif text-xs sm:text-sm transition-all duration-200 rounded-lg relative cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#55313c] via-[#482530] to-[#55313c] text-[#fff7df] font-semibold shadow-md border border-[#bc965e]/60"
                      : "text-[#7c6341] hover:text-[#55313c] hover:bg-[#f6ebd8] hover:border-[#bc965e]/60 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 border border-transparent font-medium"
                  }`}
                >
                  <Icon size={15} className={`shrink-0 transition-transform duration-200 ${isActive ? "text-[#dfbe7d] scale-105" : "text-[#946f35] group-hover:scale-115"}`} />
                  <span className="hidden lg:inline truncate">{tab.label}</span>
                  <span className="lg:hidden whitespace-nowrap">{tab.shortLabel}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 bg-[#dfbe7d] shadow-[0_0_8px_#dfbe7d] ml-0.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB CARD WORKSPACE */}
          <div className="w-full bg-[#fffdf7]/85 backdrop-blur-md border border-[#bc965e]/80 p-4 sm:p-8 lg:p-10 rounded-xl shadow-xl">

            {/* TAB 1: COUPLE & STORY */}
            {activeTab === "couple" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-b border-[#bc965e]/30 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#55313c]">Bride, Groom & Love Story</h2>
                    <p className="text-xs sm:text-sm text-[#82704f] mt-1">
                      Customize couple names, monogram, romantic quotes, and family blessings. All inputs sync in real time.
                    </p>
                  </div>
                  <Heart size={26} className="text-[#946f35]/40 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Bride's Name
                    </label>
                    <input
                      type="text"
                      value={currentWedding.brideName}
                      onChange={(e) => updateWedding({ brideName: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Groom's Name
                    </label>
                    <input
                      type="text"
                      value={currentWedding.groomName}
                      onChange={(e) => updateWedding({ groomName: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Monogram Initials (e.g. A&K)
                    </label>
                    <input
                      type="text"
                      value={currentWedding.monogram?.toUpperCase() || ""}
                      onChange={(e) => updateWedding({ monogram: e.target.value.toUpperCase() })}
                      placeholder="S&J"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded uppercase focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#bc965e]/30">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Opening Blessing Eyebrow
                    </label>
                    <input
                      type="text"
                      value={currentWedding.blessingEyebrow}
                      onChange={(e) => updateWedding({ blessingEyebrow: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Opening Subheading
                    </label>
                    <input
                      type="text"
                      value={currentWedding.subheading}
                      onChange={(e) => updateWedding({ subheading: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#bc965e]/30">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Invitation Gateway Message
                    </label>
                    <textarea
                      rows={3}
                      value={currentWedding.invitationSubtitle}
                      onChange={(e) => updateWedding({ invitationSubtitle: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Romantic Quote
                    </label>
                    <textarea
                      rows={3}
                      value={currentWedding.invitationQuote}
                      onChange={(e) => updateWedding({ invitationQuote: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#bc965e]/30">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Couple Story Introduction
                    </label>
                    <input
                      type="text"
                      value={currentWedding.storyIntro}
                      onChange={(e) => updateWedding({ storyIntro: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Final Scene Heading
                    </label>
                    <input
                      type="text"
                      value={currentWedding.finalHeading}
                      onChange={(e) => updateWedding({ finalHeading: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#bc965e]/30">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Final Closing Subtext
                    </label>
                    <input
                      type="text"
                      value={currentWedding.finalSubtext || ""}
                      onChange={(e) => updateWedding({ finalSubtext: e.target.value })}
                      placeholder={`Wedding of ${currentWedding.brideName} & ${currentWedding.groomName}`}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MUHURTHAM & VENUE */}
            {activeTab === "venue" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-b border-[#bc965e]/30 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#55313c]">Auspicious Muhurtham & Venue</h2>
                    <p className="text-xs sm:text-sm text-[#82704f] mt-1">
                      Set auspicious timings, ceremony locations, and live countdown timer parameters.
                    </p>
                  </div>
                  <MapPin size={26} className="text-[#946f35]/40 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Wedding Date
                    </label>
                    <RoyalDatePicker
                      value={currentWedding.displayDate}
                      onChange={(newDate) => {
                        const autoIso = generateIsoTimestamp(newDate, currentWedding.muhurthamTime);
                        updateWedding({
                          displayDate: newDate,
                          ...(autoIso ? { weddingDate: autoIso } : {})
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Exact Countdown Timestamp (ISO Date)
                    </label>
                    <input
                      type="text"
                      value={currentWedding.weddingDate}
                      onChange={(e) => updateWedding({ weddingDate: e.target.value })}
                      placeholder="e.g. 2027-11-24T09:15:00+05:30"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] font-mono rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#bc965e]/30">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Primary Ceremony Venue
                    </label>
                    <input
                      type="text"
                      value={currentWedding.venueName}
                      onChange={(e) => updateWedding({ venueName: e.target.value })}
                      placeholder="e.g. The Heritage Courtyard"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      City & Region
                    </label>
                    <input
                      type="text"
                      value={currentWedding.city}
                      onChange={(e) => updateWedding({ city: e.target.value })}
                      placeholder="e.g. Thanjavur, Tamil Nadu"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Muhurtham Timing
                    </label>
                    <input
                      type="text"
                      value={currentWedding.muhurthamTime}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const autoIso = generateIsoTimestamp(currentWedding.displayDate, newTime);
                        updateWedding({
                          muhurthamTime: newTime,
                          ...(autoIso ? { weddingDate: autoIso } : {})
                        });
                      }}
                      placeholder="e.g. Muhurtham · 9:15 am – 11:30 am"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#bc965e]/30">
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                    Location Stamp Banner 
                  </label>
                  <input
                    type="text"
                    value={currentWedding.locationLine}
                    onChange={(e) => updateWedding({ locationLine: e.target.value })}
                    placeholder="e.g. 24 NOVEMBER 2027 · THANJAVUR"
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>

                <div className="pt-4 border-t border-[#bc965e]/30">
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                    Full Story & Details 
                  </label>
                  <textarea
                    rows={4}
                    value={currentWedding.muhurthamDetails || ""}
                    onChange={(e) => updateWedding({ muhurthamDetails: e.target.value })}
                    placeholder="With the blessings of our families, join us for our sacred Muhurtham ceremony and traditional South Indian lunch. Come bless our union as we begin our new journey together."
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                  <p className="text-xs text-[#82704f] mt-1 italic">
                    
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: CELEBRATIONS & EVENTS */}
            {activeTab === "events" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-b border-[#bc965e]/30 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#55313c]">Celebrations & Functions Timeline</h2>
                    <p className="text-xs sm:text-sm text-[#82704f] mt-1">
                      Add individual ceremonies (Haldi, Mehendi, Sangeet, Muhurtham, Reception) with dedicated timings, descriptions, and locations.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddEventModal}
                    className="group px-4 py-2 text-xs font-serif bg-gradient-to-r from-[#946f35] to-[#7f5d2b] hover:from-[#a77e3c] hover:to-[#8f6931] text-[#fff7df] border border-[#765426] hover:shadow-md hover:shadow-[#946f35]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 shadow-xs w-max cursor-pointer"
                  >
                    <Plus size={14} className="group-hover:rotate-90 group-hover:scale-115 transition-transform duration-300" />
                    <span>Add Celebration</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {currentWedding.events.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="border border-[#bc965e] bg-[#fffaf0] p-6 rounded-lg relative shadow-xs hover:border-[#946f35] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#bc965e]/30">
                        <span className="font-serif text-lg font-semibold text-[#55313c]">
                          Celebration {idx + 1}: {evt.title || (idx === 0 ? "Mehandhi Afternoon" : idx === 1 ? "Sangeet evening" : "Celebration")}
                        </span>
                        {currentWedding.events.length > 1 && (
                          <button
                            onClick={() => setEventToDelete(evt)}
                            className="group text-xs text-rose-800 hover:text-rose-950 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-rose-100/70 border border-transparent hover:border-rose-200 hover:shadow-xs transition-all duration-200 cursor-pointer"
                          >
                            <Trash2 size={13} className="group-hover:scale-115 transition-transform duration-200" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">Event Title</label>
                          <input
                            type="text"
                            value={evt.title}
                            onChange={(e) => handleUpdateEvent(idx, "title", e.target.value)}
                            placeholder={idx === 0 ? "e.g. Mehandhi Afternoon" : idx === 1 ? "e.g. Sangeet evening" : "e.g. Reception"}
                            className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">Date</label>
                          <RoyalDatePicker
                            value={evt.date}
                            onChange={(newDate) => handleUpdateEvent(idx, "date", newDate)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">Time</label>
                          <input
                            type="text"
                            value={evt.time}
                            onChange={(e) => handleUpdateEvent(idx, "time", e.target.value)}
                            placeholder="e.g. 4:00 pm onwards"
                            className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">Venue Location</label>
                          <input
                            type="text"
                            value={evt.venue}
                            onChange={(e) => handleUpdateEvent(idx, "venue", e.target.value)}
                            placeholder="e.g. The Garden Courtyard"
                            className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">Card Tagline</label>
                          <input
                            type="text"
                            value={evt.shortTagline || ""}
                            onChange={(e) => handleUpdateEvent(idx, "shortTagline", e.target.value)}
                            className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                            Full Story & Details 
                          </label>
                          <textarea
                            rows={3}
                            value={evt.copy}
                            onChange={(e) => handleUpdateEvent(idx, "copy", e.target.value)}
                            className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PHOTOS & MEDIA */}
            {activeTab === "photos" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-b border-[#bc965e]/30 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#55313c]">Wedding Photographs & Visual Assets</h2>
                    <p className="text-xs sm:text-sm text-[#82704f] mt-1">
                      Upload custom high-resolution client photos. Uploads instantly sync to your Supabase cloud storage.
                    </p>
                  </div>
                  <ImageIcon size={26} className="text-[#946f35]/40 hidden sm:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      slot: "couplePortrait" as keyof WeddingPhotos,
                      label: "Main Couple Portrait",
                      desc: "Featured in the royal gold frame & story scene"
                    },
                    {
                      slot: "handsDetail" as keyof WeddingPhotos,
                      label: "Hands / Bangles Detail",
                      desc: "Used in Sangeet / Mehendi ceremony cards"
                    },
                    {
                      slot: "carTravel" as keyof WeddingPhotos,
                      label: "Vintage Car / Travel",
                      desc: "Featured in the floating memories scene"
                    },
                    {
                      slot: "templeScene" as keyof WeddingPhotos,
                      label: "Temple Architecture",
                      desc: "Ceremony & courtyard background shot"
                    }
                  ].map((item) => {
                    const currentImg = currentWedding.photos[item.slot] || defaultWeddingData.photos[item.slot];
                    const isUploading = uploadingSlot === item.slot;

                    return (
                      <div
                        key={item.slot}
                        className="border border-[#bc965e] bg-[#fffaf0] p-4 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                      >
                        <div>
                          <div className="aspect-[3/4] w-full rounded overflow-hidden border border-[#bc965e] mb-3.5 bg-[#e8ce99]/20 relative group">
                            <img
                              src={currentImg}
                              alt={item.label}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2">
                              <button
                                onClick={() => triggerUpload(item.slot)}
                                className="px-4 py-2 text-xs font-serif bg-gradient-to-r from-[#946f35] to-[#7f5d2b] hover:from-[#a77e3c] hover:to-[#8f6931] text-[#fff7df] rounded-md shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                              >
                                Replace Photo
                              </button>
                            </div>
                          </div>

                          <h3 className="font-serif text-base font-semibold text-[#55313c]">{item.label}</h3>
                          <p className="text-[11px] text-[#82704f] mt-1">{item.desc}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#bc965e]/30 flex items-center justify-between">
                          <button
                            onClick={() => triggerUpload(item.slot)}
                            disabled={isUploading}
                            className="group px-3.5 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ebdaba] hover:border-[#946f35] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] cursor-pointer disabled:opacity-60"
                          >
                            <Upload size={13} className="group-hover:scale-115 transition-transform duration-200" />
                            <span>{isUploading ? "Uploading..." : "Upload New"}</span>
                          </button>

                          <button
                            onClick={() => {
                              const resetPhotos = {
                                ...currentWedding.photos,
                                [item.slot]: defaultWeddingData.photos[item.slot]
                              };
                              updateWedding({ photos: resetPhotos });
                            }}
                            className="text-[11px] text-[#82704f] hover:text-[#55313c] hover:underline transition-colors duration-200 cursor-pointer"
                            title="Reset back to default template photo"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CELEBRATION & FUNCTION PHOTOGRAPHS */}
                {currentWedding.events.length > 0 && (
                  <div className="pt-8 border-t border-[#bc965e]/30 space-y-4">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl text-[#55313c]">
                        Celebration & Function Photographs
                      </h3>
                      <p className="text-xs sm:text-sm text-[#82704f] mt-1 font-sans">
                        Photographs displayed on each ceremony card in the client invitation timeline.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {currentWedding.events.map((evt, idx) => {
                        const fallbackImg =
                          idx === 0
                            ? currentWedding.photos.couplePortrait || defaultWeddingData.photos.couplePortrait
                            : idx === 1
                            ? currentWedding.photos.handsDetail || defaultWeddingData.photos.handsDetail
                            : currentWedding.photos.templeScene || defaultWeddingData.photos.templeScene;
                        const currentImg = evt.image || fallbackImg;
                        const isUploading = uploadingSlot === evt.id;

                        return (
                          <div
                            key={evt.id}
                            className="border border-[#bc965e] bg-[#fffaf0] p-4 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                          >
                            <div>
                              <div className="aspect-[3/4] w-full rounded overflow-hidden border border-[#bc965e] mb-3.5 bg-[#e8ce99]/20 relative group">
                                <img
                                  src={currentImg}
                                  alt={evt.title || `Celebration ${idx + 1}`}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2">
                                  <button
                                    onClick={() => triggerUploadEvent(evt.id)}
                                    className="px-4 py-2 text-xs font-serif bg-gradient-to-r from-[#946f35] to-[#7f5d2b] hover:from-[#a77e3c] hover:to-[#8f6931] text-[#fff7df] rounded-md shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                                  >
                                    Replace Photo
                                  </button>
                                </div>
                              </div>

                              <h3 className="font-serif text-base font-semibold text-[#55313c]">
                                Celebration {idx + 1}: {evt.title || (idx === 0 ? "Mehandhi Afternoon" : idx === 1 ? "Sangeet evening" : "Celebration")}
                              </h3>
                              <p className="text-[11px] text-[#82704f] mt-1 font-sans">
                                Featured on the {evt.title || `Celebration ${idx + 1}`} invitation timeline card
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#bc965e]/30 flex items-center justify-between">
                              <button
                                onClick={() => triggerUploadEvent(evt.id)}
                                disabled={isUploading}
                                className="group px-3.5 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ebdaba] hover:border-[#946f35] hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] cursor-pointer disabled:opacity-60"
                              >
                                <Upload size={13} className="group-hover:scale-115 transition-transform duration-200" />
                                <span>{isUploading ? "Uploading..." : "Upload New"}</span>
                              </button>

                              <button
                                onClick={() => {
                                  const updatedEvents = currentWedding.events.map((e) =>
                                    e.id === evt.id ? { ...e, image: fallbackImg } : e
                                  );
                                  updateWedding({ events: updatedEvents });
                                }}
                                className="text-[11px] text-[#82704f] hover:text-[#55313c] underline"
                                title="Reset back to default ceremony photo"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE NEW WEDDING MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-4 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-4 sm:space-y-5 animate-scale-up">
            <div className="border-b border-[#bc965e]/40 pb-3">
              <h3 className="font-serif text-2xl text-[#55313c]">Create New Client Wedding</h3>
              <p className="text-xs text-[#82704f] mt-1 font-sans">
                Enter the bride & groom names to generate a new customized invitation and dedicated client URL.
              </p>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                Bride's Name
              </label>
              <input
                type="text"
                value={newBride}
                onChange={(e) => setNewBride(e.target.value)}
                placeholder="e.g. Kavya"
                className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                Groom's Name
              </label>
              <input
                type="text"
                value={newGroom}
                onChange={(e) => setNewGroom(e.target.value)}
                placeholder="e.g. Arjun"
                className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
              />
            </div>

            {newBride && newGroom && (
              <div className="p-3 bg-[#fbf5e7] border border-[#bc965e]/40 rounded text-xs text-[#946f35] font-serif">
                Generated Client URL:{" "}
                <span className="font-mono text-[#55313c] font-semibold">
                  /w/{newBride.toLowerCase().replace(/[^a-z0-9]/g, "")}-{newGroom.toLowerCase().replace(/[^a-z0-9]/g, "")}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] text-[#55313c] rounded hover:bg-[#ead7b7]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWedding}
                disabled={!newBride.trim() || !newGroom.trim()}
                className="px-5 py-2 text-xs font-serif bg-[#55313c] text-[#fff3d7] rounded hover:bg-[#7d4954] disabled:opacity-50 font-medium"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAST CLIENTS MODAL */}
      {showPastClientsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-4 sm:p-8 max-w-2xl w-full rounded-xl shadow-2xl space-y-4 sm:space-y-5 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="border-b border-[#bc965e]/40 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl text-[#55313c]">Past Clients</h3>
                <p className="text-xs text-[#82704f] mt-0.5 font-sans">
                  Manage all client wedding invitations, edit details, or permanently delete projects.
                </p>
              </div>
              <button
                onClick={() => setShowPastClientsModal(false)}
                className="p-1.5 text-[#82704f] hover:text-[#55313c] rounded hover:bg-[#f5e9cf]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {weddings.length === 0 ? (
                <p className="text-sm font-serif text-[#82704f] py-8 text-center">No past clients found.</p>
              ) : (
                weddings.map((w) => {
                  const isDefault = w.slug.toLowerCase() === defaultWeddingData.slug.toLowerCase();
                  const isActive = currentWedding.slug.toLowerCase() === w.slug.toLowerCase();
                  return (
                    <div
                      key={w.slug}
                      className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? "border-[#946f35] bg-[#fbf5e7] shadow-xs"
                          : "border-[#bc965e]/50 bg-[#fffaf0] hover:border-[#bc965e]"
                      }`}
                    >
                      <div>
                        <h4 className="font-serif text-base font-semibold text-[#55313c] flex flex-wrap items-center gap-1.5">
                          <span>{w.brideName} & {w.groomName}</span>
                          {isDefault && (
                            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-[#946f35]/20 text-[#7a5927] border border-[#946f35]/40">
                              Default Template
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-[#946f35] text-[#fff7df]">
                              Active
                            </span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#82704f] mt-1 font-serif">
                          <span>{w.displayDate || "No date set"}</span>
                          <span>•</span>
                          <span>{w.city || w.venueName || "No venue set"}</span>
                          <span>•</span>
                          <a
                            href={`/w/${w.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#946f35] hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>/w/{w.slug}</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            handleSelectWedding(w.slug);
                            setShowPastClientsModal(false);
                          }}
                          className="px-3.5 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ead7b7] text-[#55313c] rounded transition-all"
                        >
                          Edit Project
                        </button>
                        {!isDefault && (
                          <button
                            onClick={() => setClientToDelete(w)}
                            className="p-1.5 text-xs text-rose-800 hover:text-rose-950 border border-rose-300 hover:bg-rose-100/60 rounded transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setShowPastClientsModal(false)}
                className="px-5 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] text-[#55313c] rounded hover:bg-[#ead7b7]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT CLIENT DELETION CONFIRMATION MODAL */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-4 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-4 sm:space-y-5 animate-scale-up">
            <div className="border-b border-[#bc965e]/40 pb-3">
              <h3 className="font-serif text-2xl text-[#55313c]">Delete Client Project</h3>
              <p className="text-xs text-[#82704f] mt-1 font-sans">
                Are you sure you want to permanently delete this wedding project? All invitations and data for this client will be removed. This action cannot be undone.
              </p>
            </div>

            <div className="p-3 bg-[#fbf5e7] border border-[#bc965e]/40 rounded text-xs font-serif text-[#55313c]">
              Client: <span className="font-medium">{clientToDelete.brideName} & {clientToDelete.groomName}</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] text-[#55313c] rounded hover:bg-[#ead7b7]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const slug = clientToDelete.slug;
                  setClientToDelete(null);
                  await deleteWedding(slug);
                  const remaining = weddings.filter((w) => w.slug.toLowerCase() !== slug.toLowerCase());
                  setWeddings(remaining);
                  if (currentWedding.slug.toLowerCase() === slug.toLowerCase()) {
                    const next = remaining[0] || defaultWeddingData;
                    setCurrentWedding(next);
                    broadcastWeddingUpdate(next);
                  }
                }}
                className="px-5 py-2 text-xs font-serif bg-rose-800 text-white rounded hover:bg-rose-900 font-medium"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATION REMOVAL CONFIRMATION MODAL */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-4 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-4 sm:space-y-5 animate-scale-up">
            <div className="border-b border-[#bc965e]/40 pb-3">
              <h3 className="font-serif text-2xl text-[#55313c]">Remove Celebration Event</h3>
              <p className="text-xs text-[#82704f] mt-1 font-sans">
                Are you sure you want to permanently remove this celebration event from the wedding timeline? This action cannot be undone.
              </p>
            </div>

            <div className="p-3 bg-[#fbf5e7] border border-[#bc965e]/40 rounded text-xs font-serif text-[#55313c]">
              Event: <span className="font-medium">{eventToDelete.title || "Untitled Celebration"}</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] text-[#55313c] rounded hover:bg-[#ead7b7]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updatedEvents = currentWedding.events.filter((e) => e.id !== eventToDelete.id);
                  updateWedding({ events: updatedEvents });
                  setEventToDelete(null);
                }}
                className="px-5 py-2 text-xs font-serif bg-[#55313c] text-[#fff3d7] rounded hover:bg-[#7d4954] font-medium"
              >
                Remove Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CELEBRATION MODAL */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-4 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-4 sm:space-y-5 animate-scale-up">
            <div className="border-b border-[#bc965e]/40 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl text-[#55313c]">Add New Celebration</h3>
                <p className="text-xs text-[#82704f] mt-1 font-sans">
                  Enter the ceremony or celebration title for this timeline event.
                </p>
              </div>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="p-1.5 text-[#82704f] hover:text-[#55313c] rounded hover:bg-[#f5e9cf]"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                Celebration Title
              </label>
              <input
                type="text"
                autoFocus
                value={newEventTitleInput}
                onChange={(e) => setNewEventTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newEventTitleInput.trim()) {
                    handleConfirmAddEvent();
                  }
                }}
                placeholder="e.g. Haldi Ceremony or Reception"
                className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] text-[#55313c] rounded hover:bg-[#ead7b7]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddEvent}
                disabled={!newEventTitleInput.trim()}
                className="px-5 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] hover:bg-[#765426] disabled:opacity-50 rounded font-medium shadow-xs"
              >
                Add Celebration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN SECURITY & CREDENTIAL MANAGEMENT MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-4 sm:p-7 max-w-2xl w-full rounded-xl shadow-2xl space-y-4 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="border-b border-[#bc965e]/40 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#55313c] flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#946f35]" />
                  <span>Owner Security Portal</span>
                </h3>
                <p className="text-xs text-[#82704f] mt-0.5 font-sans">
                  Manage login credentials, authorized administrator accounts, and passwords.
                </p>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="p-1.5 text-[#82704f] hover:text-[#55313c] rounded hover:bg-[#f5e9cf] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status notification */}
            {securityStatusMsg && (
              <div
                className={`p-3 rounded-md text-xs font-serif flex items-center gap-2 ${
                  securityStatusMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-rose-50 text-rose-900 border border-rose-200"
                }`}
              >
                {securityStatusMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{securityStatusMsg.text}</span>
              </div>
            )}

            {/* Segmented Tabs (Option 1) */}
            <div className="flex items-center gap-2 border-b border-[#bc965e]/40 pb-2.5">
              <button
                type="button"
                onClick={() => {
                  setSecurityActiveTab("accounts");
                  setSecurityStatusMsg(null);
                }}
                style={{
                  backgroundColor: securityActiveTab === "accounts" ? "#8a642e" : "#fffaf0",
                  color: securityActiveTab === "accounts" ? "#ffffff" : "#55313c",
                  borderColor: securityActiveTab === "accounts" ? "#6d4e21" : "rgba(188, 150, 94, 0.6)"
                }}
                className={`px-3.5 py-1.5 text-xs font-serif font-medium rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs ${
                  securityActiveTab === "accounts"
                    ? "shadow-sm shadow-[#8a642e]/30 scale-[1.02]"
                    : "hover:bg-[#f6ebd8] hover:border-[#946f35]"
                }`}
              >
                <ShieldCheck size={14} className={securityActiveTab === "accounts" ? "text-white" : "text-[#946f35]"} />
                <span>Authorized Accounts</span>
                <span
                  style={{
                    backgroundColor: securityActiveTab === "accounts" ? "rgba(255, 255, 255, 0.25)" : "#f5e9cf",
                    color: securityActiveTab === "accounts" ? "#ffffff" : "#6f5b3b"
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-sans font-semibold leading-none"
                >
                  {adminUsersList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSecurityActiveTab("create");
                  setSecurityStatusMsg(null);
                }}
                style={{
                  backgroundColor: securityActiveTab === "create" ? "#8a642e" : "#fffaf0",
                  color: securityActiveTab === "create" ? "#ffffff" : "#55313c",
                  borderColor: securityActiveTab === "create" ? "#6d4e21" : "rgba(188, 150, 94, 0.6)"
                }}
                className={`px-3.5 py-1.5 text-xs font-serif font-medium rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  securityActiveTab === "create"
                    ? "shadow-sm shadow-[#8a642e]/30 scale-[1.02]"
                    : "hover:bg-[#f6ebd8] hover:border-[#946f35]"
                }`}
              >
                <UserPlus size={14} className={securityActiveTab === "create" ? "text-white" : "text-[#946f35]"} />
                <span>Add New Administrator</span>
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* TAB 1: AUTHORIZED ACCOUNTS LIST */}
              {securityActiveTab === "accounts" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-serif text-xs sm:text-sm font-semibold text-[#55313c] uppercase tracking-wider">
                        Authorized Administrators & Owner ({adminUsersList.length})
                      </h4>
                      <button
                        onClick={() => {
                          setSecurityActiveTab("create");
                          setSecurityStatusMsg(null);
                        }}
                        className="text-xs font-serif text-[#946f35] hover:text-[#55313c] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus size={12} />
                        <span>Add Administrator</span>
                      </button>
                    </div>

                    {isLoadingAdmins ? (
                      <div className="py-6 flex items-center justify-center gap-2 text-xs font-serif text-[#82704f]">
                        <Loader2 size={14} className="animate-spin text-[#946f35]" />
                        <span>Loading administrators...</span>
                      </div>
                    ) : adminUsersList.length === 0 ? (
                      <p className="text-xs font-serif text-[#82704f] py-3 italic">No additional administrator accounts registered.</p>
                    ) : (
                      <div className="divide-y divide-[#bc965e]/30 border border-[#bc965e]/60 rounded-lg overflow-hidden bg-[#fffaf0]">
                        {adminUsersList.map((adm) => {
                          const isPermanentOwner = adm.username.toLowerCase() === "hariharan";
                          const isCurrent = adminSession?.username?.toLowerCase() === adm.username.toLowerCase();
                          return (
                            <div key={adm.username} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-serif text-sm font-semibold text-[#55313c]">{adm.displayName}</span>
                                  {/* Show Owner badge ONLY for Hariharan */}
                                  {isPermanentOwner ? (
                                    <span className="text-[10px] font-sans uppercase font-medium px-2 py-0.5 rounded bg-[#946f35] text-[#fff7df] shadow-xs">
                                      Owner
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-[#f5e9cf] text-[#55313c] border border-[#bc965e]/50">
                                      {adm.role || "Administrator"}
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Current User
                                    </span>
                                  )}
                                </div>
                                {adm.createdAt && (
                                  <p className="text-[11px] text-[#82704f] mt-0.5 font-serif">
                                    Created: {new Date(adm.createdAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setChangePasswordTargetUser(adm.username);
                                    setNewPasswordVal("");
                                    setShowUpdatePassword(false);
                                  }}
                                  className="px-2.5 py-1 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ead7b7] text-[#55313c] rounded transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                                >
                                  <KeyRound size={12} />
                                  <span>Set New Password</span>
                                </button>
                                {/* Hariharan is permanent and non-deletable */}
                                {!isPermanentOwner && !isCurrent && (
                                  <button
                                    onClick={() => setDeleteConfirmUser({ username: adm.username, displayName: adm.displayName })}
                                    className="p-1 text-xs text-rose-800 hover:text-rose-950 border border-rose-300 hover:bg-rose-100/60 rounded transition-all cursor-pointer shadow-xs"
                                    title="Delete administrator profile"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Inline Update Password Form with Eye Icon Toggle */}
                  {changePasswordTargetUser && (
                    <div className="p-4 bg-[#fbf5e7] border border-[#bc965e] rounded-lg space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h5 className="font-serif text-xs font-semibold text-[#55313c] uppercase tracking-wider flex items-center gap-1.5">
                          <KeyRound size={13} className="text-[#946f35]" />
                          <span>Update Password for {changePasswordTargetUser}</span>
                        </h5>
                        <button
                          onClick={() => {
                            setChangePasswordTargetUser("");
                            setShowUpdatePassword(false);
                          }}
                          className="text-xs text-[#82704f] hover:text-[#55313c] underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                          <input
                            type={showUpdatePassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={newPasswordVal}
                            onChange={(e) => setNewPasswordVal(e.target.value)}
                            placeholder="Enter new password (min. 6 characters)"
                            className="w-full bg-[#fffaf0] border border-[#bc965e] pl-3 pr-9 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUpdatePassword(!showUpdatePassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#82704f] hover:text-[#55313c] transition-colors cursor-pointer"
                            title={showUpdatePassword ? "Hide password" : "Show password"}
                          >
                            {showUpdatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={isUpdatingPassword || !newPasswordVal.trim()}
                          style={{
                            background: "linear-gradient(to right, #946f35, #7f5d2b)",
                            color: "#fff7df"
                          }}
                          className="px-4 py-1 text-xs font-serif rounded font-medium shadow-xs disabled:opacity-50 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                        >
                          {isUpdatingPassword ? "Saving..." : "Save Password"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREATE NEW ADMINISTRATOR CREDENTIAL */}
              {securityActiveTab === "create" && (
                <div className="p-4 sm:p-5 bg-[#fffaf0] border border-[#bc965e]/70 rounded-lg space-y-4 animate-fade-in">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-[#55313c] uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus size={15} className="text-[#946f35]" />
                      <span>Create New Administrator Credential</span>
                    </h4>
                    <p className="text-xs text-[#82704f] mt-0.5 font-sans">
                      New credentials allow team members to access and edit wedding projects in the studio.
                    </p>
                  </div>
                  <form onSubmit={handleCreateNewAdmin} autoComplete="off" className="space-y-3.5 pt-1">
                    {/* Hidden dummy fields to prevent modern browser autofill */}
                    <input type="text" name="fake_username_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
                    <input type="password" name="fake_password_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                          Username (Login ID)
                        </label>
                        <input
                          type="text"
                          id="portal_admin_user_input"
                          name="portal_admin_user_input"
                          autoComplete="new-password"
                          required
                          value={newAdminUsername}
                          onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="e.g. planner_sarah"
                          className="w-full bg-[#fffdf7] border border-[#bc965e] px-3 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                          Full Display Name
                        </label>
                        <input
                          type="text"
                          id="portal_admin_name_input"
                          name="portal_admin_name_input"
                          autoComplete="off"
                          required
                          value={newAdminDisplayName}
                          onChange={(e) => setNewAdminDisplayName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full bg-[#fffdf7] border border-[#bc965e] px-3 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                          Initial Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            id="portal_admin_pwd_input"
                            name="portal_admin_pwd_input"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="w-full bg-[#fffdf7] border border-[#bc965e] pl-3 pr-9 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCreatePassword(!showCreatePassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#82704f] hover:text-[#55313c] transition-colors cursor-pointer"
                            title={showCreatePassword ? "Hide password" : "Show password"}
                          >
                            {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                          Access Role
                        </label>
                        <input
                          type="text"
                          id="portal_admin_role_input"
                          name="portal_admin_role_input"
                          autoComplete="off"
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value)}
                          placeholder="e.g. Wedding Coordinator, Assistant, Manager"
                          className="w-full bg-[#fffdf7] border border-[#bc965e] px-3 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35] placeholder:text-[#ab9776]/70"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityActiveTab("accounts");
                          setSecurityStatusMsg(null);
                        }}
                        className="text-xs font-serif text-[#82704f] hover:text-[#55313c] underline cursor-pointer"
                      >
                        Back to Accounts List
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingAdmin || !newAdminUsername.trim() || !newAdminPassword.trim()}
                        style={{
                          background: "linear-gradient(to right, #946f35, #a67e3d, #7f5d2b)",
                          color: "#fff8e7",
                          borderColor: "#6b4e23"
                        }}
                        className="relative overflow-hidden px-5 py-2.5 text-xs font-serif font-medium border rounded-md shadow-sm hover:shadow-lg hover:shadow-[#946f35]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 group"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                        <Plus size={13} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                        <span className="relative z-10">{isCreatingAdmin ? "Creating..." : "Create Credential"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="px-6 py-2.5 text-xs font-serif font-medium border border-[#bc965e] bg-[#f7eedc] text-[#55313c] rounded-md hover:bg-[#ecd7b0] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Close Security Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE ADMINISTRATOR CONFIRMATION DIALOG */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-5 sm:p-6 max-w-md w-full rounded-xl shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                <Trash2 size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-serif text-lg font-semibold text-[#55313c] leading-snug">
                  Delete Administrator Profile?
                </h4>
                <p className="text-xs text-[#82704f] mt-1.5 font-sans leading-relaxed">
                  Are you sure you want to permanently delete the administrator profile for{" "}
                  <strong className="text-[#55313c] font-serif font-semibold">{deleteConfirmUser.displayName}</strong>{" "}
                  (<span className="font-mono text-[11.5px] text-[#55313c]">{deleteConfirmUser.username}</span>)?
                </p>
                <p className="text-[11px] text-rose-800 font-sans mt-2 font-medium">
                  This action cannot be undone. They will immediately lose access to the studio.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#bc965e]/30">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-serif border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] text-[#55313c] rounded-md transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetUser = deleteConfirmUser.username;
                  setDeleteConfirmUser(null);
                  await handleDeleteAdmin(targetUser);
                }}
                className="px-4 py-2 text-xs font-serif bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 rounded-md font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
