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
  ScrollText,
  Compass,
  Users,
  X,
  Loader2
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
    "w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<keyof WeddingPhotos | null>(null);
  const [activeUploadEventId, setActiveUploadEventId] = useState<string | null>(null);

  // Initialize wedding list & check ?edit=slug
  useEffect(() => {
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
      setSaveStatus("Saved to Cloud & Live Synced! ✦");
      await refreshWeddingList();
      setTimeout(() => setSaveStatus(""), 3500);
    } else {
      setSaveStatus("Saved locally ✦");
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

  const clientUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/w/${currentWedding.slug}`
      : `/w/${currentWedding.slug}`;

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
      <header className="relative z-20 border-b border-[#bc965e]/60 bg-[#fffcf4]/95 backdrop-blur-md px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 shadow-sm">
        <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Logo & Wedding Title */}
          <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13 rounded-xl border-2 border-[#bc965e] bg-gradient-to-b from-[#fffcf5] via-[#fcf5e7] to-[#f5e7cd] p-1 shadow-md shadow-[#946f35]/20 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105 ring-1.5 ring-[#bc965e]/40 relative group">
              {/* Radiant warm golden glow backdrop matching royal parchment and temple gold */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(251,243,227,0.5)_60%,_transparent_100%)] pointer-events-none" />
              <img
                src="/Hari_WEDDING_project_logo.png"
                alt="Hari Wedding Project Logo"
                className="w-full h-full object-contain scale-[1.2] filter drop-shadow-[0_2px_8px_rgba(188,150,94,0.45)] brightness-[1.06] contrast-[1.05] relative z-10 transition-transform duration-300 group-hover:scale-[1.26]"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-normal text-[#55313c] tracking-tight truncate">
                Royal Wedding Invitation Planner Studio
              </h1>
              <p className="text-xs text-[#82704f] mt-0.5 truncate">
                Client Project:{" "}
                <span className="font-serif font-medium text-[#55313c]">
                  {currentWedding.brideName} & {currentWedding.groomName}
                </span>
              </p>
            </div>
          </div>

          {/* Action Toolbar - Perfectly Aligned, Unified Single-Row Bar */}
          <div className="flex items-center justify-start xl:justify-end gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-0.5 pl-1">
            {/* Recent 5 Edited Projects Dropdown */}
            <select
              value={currentWedding.slug}
              onChange={(e) => handleSelectWedding(e.target.value)}
              className="h-8 px-2 sm:px-2.5 bg-[#fffdf7] border border-[#bc965e] hover:border-[#8e6b30] hover:bg-[#fff9ed] hover:shadow-xs text-[11.5px] sm:text-xs font-serif text-[#55313c] rounded-md focus:outline-none focus:ring-1.5 focus:ring-[#946f35] focus:border-[#946f35] shadow-xs shrink-0 max-w-[170px] sm:max-w-[190px] truncate cursor-pointer transition-all duration-200"
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
              className="group h-8 px-2.5 sm:px-3 text-[11.5px] sm:text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Users size={13} className="text-[#82704f] group-hover:text-[#55313c] group-hover:scale-110 transition-transform duration-200" />
              <span>Past Clients</span>
            </button>

            {/* New Wedding */}
            <button
              onClick={() => setShowNewModal(true)}
              className="group h-8 px-2.5 sm:px-3 text-[11.5px] sm:text-xs font-serif font-medium bg-gradient-to-r from-[#946f35] to-[#7f5d2b] hover:from-[#a77e3c] hover:to-[#8f6931] text-[#fff8e7] border border-[#6b4e23] hover:border-[#533c19] hover:shadow-md hover:shadow-[#946f35]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus size={13} className="group-hover:rotate-90 group-hover:scale-115 transition-transform duration-300" />
              <span>New Wedding</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyClientLink}
              className="group h-8 px-2.5 sm:px-3 text-[11.5px] sm:text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              title="Copy shareable client link"
            >
              {copiedLink ? (
                <Check size={13} className="text-emerald-700 scale-110" />
              ) : (
                <Copy size={13} className="text-[#82704f] group-hover:text-[#55313c] group-hover:scale-110 transition-transform duration-200" />
              )}
              <span>{copiedLink ? "Link Copied!" : "Copy Client Link"}</span>
            </button>

            {/* Open Invitation */}
            <a
              href={clientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group h-8 px-2.5 sm:px-3 text-[11.5px] sm:text-xs font-serif font-medium border border-[#bc965e]/80 bg-[#fffaf0] hover:bg-[#f6ebd8] hover:border-[#946f35] hover:text-[#3d1a24] hover:shadow-md hover:shadow-[#bc965e]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <ExternalLink size={13} className="text-[#82704f] group-hover:text-[#55313c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span>Open Invitation</span>
            </a>

            {/* Save Changes - High-Impact Attractive Primary Action Button */}
            <button
              onClick={handleSave}
              disabled={saveStatus === "Saving..."}
              className="relative overflow-hidden h-8 px-3.5 sm:px-4 text-[11.5px] sm:text-xs font-serif font-semibold tracking-wide bg-gradient-to-r from-[#7a182d] via-[#5c1322] to-[#7a182d] hover:from-[#942038] hover:via-[#70182b] hover:to-[#942038] text-[#fff6df] border border-[#f3d382] ring-1 ring-[#ffd778]/50 hover:ring-[#ffd778]/90 shadow-[0_2px_8px_rgba(110,24,45,0.35)] hover:shadow-[0_4px_16px_rgba(148,32,56,0.5)] transition-all duration-200 rounded-md flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] group"
              title="Save all changes to Cloud Database & Live Sync"
            >
              {/* Luxury Shimmer Sweep Effect across the button on hover */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

              {saveStatus === "Saving..." ? (
                <>
                  <Loader2 size={13.5} className="animate-spin text-[#ffd778] relative z-10" />
                  <span className="relative z-10 text-[#ffd778]">Saving...</span>
                </>
              ) : saveStatus && saveStatus.startsWith("Saved") ? (
                <>
                  <Check size={13.5} className="text-[#6ee7b7] relative z-10 scale-110" />
                  <span className="relative z-10 text-[#d1fae5]">Saved! ✦</span>
                </>
              ) : (
                <>
                  <Save
                    size={13.5}
                    className="text-[#ffd778] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] group-hover:scale-115 group-hover:rotate-[-8deg] transition-transform duration-300 relative z-10"
                  />
                  <span className="relative z-10">Save Changes</span>
                  <Sparkles
                    size={11}
                    className="text-[#ffd778] animate-pulse group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_4px_#ffd778] relative z-10"
                  />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {saveStatus && (
          <div className="w-full mt-2.5 pt-2 border-t border-[#bc965e]/30 flex items-center justify-between text-xs text-[#946f35] font-serif animate-fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-[#b58e45]" /> {saveStatus}
            </span>
            <span className="text-[#82704f] text-[11px]">Real-time synchronization active across all devices</span>
          </div>
        )}
      </header>

      {/* FULL-WIDTH RESPONSIVE STUDIO BODY (Edge-to-edge, smoothly filling the screen) */}
      <main className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-6">
        <div className="w-full flex flex-col gap-6">
          {/* TABS SELECTOR */}
          <div className="w-full flex border border-[#bc965e]/70 bg-[#fffcf4]/90 backdrop-blur-md rounded-xl p-2 gap-2 overflow-x-auto shadow-sm">
            {[
              { id: "couple", label: "Couple & Story", icon: Heart },
              { id: "venue", label: "Muhurtham & Venue", icon: MapPin },
              { id: "events", label: "Celebrations & Events", icon: Calendar },
              { id: "photos", label: "Photos & Media", icon: ImageIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group flex items-center gap-2.5 px-6 py-2.5 font-serif text-sm transition-all duration-200 whitespace-nowrap rounded-lg relative cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#55313c] via-[#482530] to-[#55313c] text-[#fff7df] font-semibold shadow-md border border-[#bc965e]/60 scale-[1.01]"
                      : "text-[#7c6341] hover:text-[#55313c] hover:bg-[#f6ebd8] hover:border-[#bc965e]/60 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 border border-transparent font-medium"
                  }`}
                >
                  <Icon size={16} className={`transition-transform duration-200 ${isActive ? "text-[#dfbe7d] scale-105" : "text-[#946f35] group-hover:scale-115"}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#dfbe7d] shadow-[0_0_8px_#dfbe7d] ml-0.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB CARD WORKSPACE */}
          <div className="w-full bg-[#fffdf7]/85 backdrop-blur-md border border-[#bc965e]/80 p-6 sm:p-10 rounded-xl shadow-xl">

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
                      Formatted Display Date
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
                      Muhurtham Timing Window
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
                    Location Stamp Banner (Footer & Gateway)
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
                    Full Story & Details (Shown in Guest Pop-Up)
                  </label>
                  <textarea
                    rows={4}
                    value={currentWedding.muhurthamDetails || ""}
                    onChange={(e) => updateWedding({ muhurthamDetails: e.target.value })}
                    placeholder="With the blessings of our families, join us for our sacred Muhurtham ceremony and traditional South Indian lunch. Come bless our union as we begin our new journey together."
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                  <p className="text-xs text-[#82704f] mt-1 italic">
                    This detailed copy will appear inside the pop-up modal when guests click the "Wedding details" button on the invitation.
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
                            Full Story & Details (Shown in Guest Pop-Up)
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
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-6 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-5 animate-scale-up">
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
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-6 sm:p-8 max-w-2xl w-full rounded-xl shadow-2xl space-y-5 animate-scale-up max-h-[85vh] flex flex-col">
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
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-6 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-5 animate-scale-up">
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
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-6 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-5 animate-scale-up">
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
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] p-6 sm:p-8 max-w-md w-full rounded-xl shadow-2xl space-y-5 animate-scale-up">
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
    </div>
  );
}
