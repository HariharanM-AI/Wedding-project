"use client";

import { useEffect, useState, useRef } from "react";
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
  X
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

function RoyalDatePicker({
  value,
  onChange,
  className,
  variant = "celebration"
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
    variant === "venue"
      ? "w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded h-[42px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
      : "w-full bg-[#fbf4e6] border border-[#bc965e] px-2 py-1.5 text-xs text-[#55313c] rounded h-[34px] focus:outline-none focus:ring-1 focus:ring-[#946f35]";

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
  return {
    ...w,
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
    setWeddings(sanitizedList);
    if (sanitizedList.length > 0 && !currentWedding.slug) {
      setCurrentWedding(sanitizedList[0]);
    }
  }

  function handleSelectWedding(slug: string) {
    const found = weddings.find((w) => w.slug === slug);
    if (found) {
      const cloned = JSON.parse(JSON.stringify(found));
      const sanitized = sanitizeWeddingData(cloned);
      setCurrentWedding(sanitized);
      broadcastWeddingUpdate(sanitized);
    } else {
      getWedding(slug).then((w) => {
        const sanitized = sanitizeWeddingData(w);
        setCurrentWedding(sanitized);
        broadcastWeddingUpdate(sanitized);
      });
    }
  }

  // Real-time update helper: updates state & immediately broadcasts to any open preview/invitation tabs
  function updateWedding(patch: Partial<WeddingData>) {
    setCurrentWedding((prev) => {
      const updated = { ...prev, ...patch };
      broadcastWeddingUpdate(updated);
      return updated;
    });
  }

  async function handleSave() {
    setSaveStatus("Saving...");
    const res = await saveWedding(currentWedding);
    if (res.success) {
      setSaveStatus("Saved to Cloud & Live Synced! ✦");
      refreshWeddingList();
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
    const monogram = `${bride.charAt(0).toLowerCase()}&${groom.charAt(0).toLowerCase()}`;

    const newWedding: WeddingData = {
      ...defaultWeddingData,
      slug,
      brideName: bride,
      groomName: groom,
      monogram,
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
    if (slug === defaultWeddingData.slug) {
      alert("The default template cannot be deleted.");
      return;
    }
    await deleteWedding(slug);
    const remaining = weddings.filter((w) => w.slug !== slug);
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
      <header className="relative z-20 border-b border-[#bc965e]/60 bg-[#fffcf4]/92 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-3.5 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Wedding Title */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl border-2 border-[#bc965e] bg-gradient-to-b from-[#fffcf5] via-[#fcf5e7] to-[#f5e7cd] p-1.5 shadow-lg shadow-[#946f35]/25 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105 ring-2 ring-[#bc965e]/40 relative group">
              {/* Radiant warm golden glow backdrop matching royal parchment and temple gold */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(251,243,227,0.5)_60%,_transparent_100%)] pointer-events-none" />
              <img
                src="/Hari_WEDDING_project_logo_final.png"
                alt="Hari Wedding Project Logo"
                className="w-full h-full object-contain scale-[1.32] filter drop-shadow-[0_4px_12px_rgba(188,150,94,0.55)] brightness-[1.08] contrast-[1.05] relative z-10 transition-transform duration-300 group-hover:scale-[1.38]"
              />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#55313c] tracking-tight">
                Royal Wedding Planner Studio
              </h1>
              <p className="text-xs sm:text-sm text-[#82704f] mt-0.5">
                Client Project:{" "}
                <span className="font-serif font-medium text-[#55313c]">
                  {currentWedding.brideName} & {currentWedding.groomName}
                </span>
              </p>
            </div>
          </div>

          {/* Action Toolbar - Standardized Height (h-9), Font & Royal Styling */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Recent 5 Clients Dropdown */}
            <select
              value={currentWedding.slug}
              onChange={(e) => handleSelectWedding(e.target.value)}
              className="h-9 px-3 bg-[#fffdf7] border border-[#bc965e] text-xs font-serif text-[#55313c] rounded-md focus:outline-none focus:ring-1 focus:ring-[#946f35] shadow-xs"
            >
              {weddings.slice(0, 5).map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.brideName} & {w.groomName}
                </option>
              ))}
            </select>

            {/* Past Clients */}
            <button
              onClick={() => setShowPastClientsModal(true)}
              className="h-9 px-4 text-xs font-serif font-medium border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f6ebd8] transition-all rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs"
            >
              <Users size={14} />
              <span>Past Clients</span>
            </button>

            {/* New Wedding */}
            <button
              onClick={() => setShowNewModal(true)}
              className="h-9 px-4 text-xs font-serif font-medium bg-[#946f35] text-[#fff7df] hover:bg-[#765426] border border-[#765426] transition-all rounded-md flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>New Wedding</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyClientLink}
              className="h-9 px-4 text-xs font-serif font-medium border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f6ebd8] transition-all rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs"
              title="Copy shareable client link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
              <span>{copiedLink ? "Link Copied!" : "Copy Client Link"}</span>
            </button>

            {/* Open Invitation */}
            <a
              href={clientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 text-xs font-serif font-medium border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f6ebd8] transition-all rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs"
            >
              <ExternalLink size={14} />
              <span>Open Invitation</span>
            </a>

            {/* Save All */}
            <button
              onClick={handleSave}
              className="h-9 px-4 text-xs font-serif font-medium bg-[#55313c] text-[#fff3d7] hover:bg-[#7d4954] border border-[#3d0c1e] transition-all rounded-md flex items-center gap-1.5 shadow-xs"
            >
              <Save size={14} />
              <span>Save Changes</span>
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
          <div className="w-full flex border-b border-[#bc965e] bg-[#fffcf4]/88 backdrop-blur-md rounded-t-xl px-4 pt-3.5 gap-2 overflow-x-auto shadow-sm">
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
                  className={`flex items-center gap-2.5 px-7 py-3.5 font-serif text-sm border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                    isActive
                      ? "border-[#946f35] text-[#55313c] font-semibold bg-[#f7eedc] shadow-xs"
                      : "border-transparent text-[#82704f] hover:text-[#55313c] hover:bg-[#fff9ef]/70"
                  }`}
                >
                  <Icon size={17} className={isActive ? "text-[#946f35]" : "text-[#82704f]"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CARD WORKSPACE */}
          <div className="w-full bg-[#fffdf7]/85 backdrop-blur-md border border-[#bc965e]/80 p-6 sm:p-10 rounded-b-xl shadow-xl">

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
                      Monogram Initials (e.g. a&k)
                    </label>
                    <input
                      type="text"
                      value={currentWedding.monogram}
                      onChange={(e) => updateWedding({ monogram: e.target.value })}
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
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
                      variant="venue"
                      onChange={(newDate) => updateWedding({ displayDate: newDate })}
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
                      onChange={(e) => updateWedding({ muhurthamTime: e.target.value })}
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
                    className="px-4 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] hover:bg-[#765426] transition-all rounded flex items-center gap-1.5 shadow-sm w-max"
                  >
                    <Plus size={14} />
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
                            className="text-xs text-rose-800 hover:text-rose-950 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-rose-100/50"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Event Title</label>
                          <input
                            type="text"
                            value={evt.title}
                            onChange={(e) => handleUpdateEvent(idx, "title", e.target.value)}
                            placeholder={idx === 0 ? "e.g. Mehandhi Afternoon" : idx === 1 ? "e.g. Sangeet evening" : "e.g. Reception"}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded h-[34px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Date</label>
                          <RoyalDatePicker
                            value={evt.date}
                            variant="celebration"
                            onChange={(newDate) => handleUpdateEvent(idx, "date", newDate)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Time</label>
                          <input
                            type="text"
                            value={evt.time}
                            onChange={(e) => handleUpdateEvent(idx, "time", e.target.value)}
                            placeholder="e.g. 4:00 pm onwards"
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded h-[34px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Venue Location</label>
                          <input
                            type="text"
                            value={evt.venue}
                            onChange={(e) => handleUpdateEvent(idx, "venue", e.target.value)}
                            placeholder="e.g. The Garden Courtyard"
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded h-[34px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Card Tagline</label>
                          <input
                            type="text"
                            value={evt.shortTagline || ""}
                            onChange={(e) => handleUpdateEvent(idx, "shortTagline", e.target.value)}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded h-[34px] focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">
                            Full Story & Details (Shown in Guest Pop-Up)
                          </label>
                          <textarea
                            rows={2}
                            value={evt.copy}
                            onChange={(e) => handleUpdateEvent(idx, "copy", e.target.value)}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded"
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
                                className="px-4 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] rounded shadow hover:bg-[#765426]"
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
                            className="px-3.5 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ebdaba] transition-all rounded flex items-center gap-1.5 text-[#55313c]"
                          >
                            <Upload size={13} />
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
                            className="text-[11px] text-[#82704f] hover:text-[#55313c] underline"
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
                                    className="px-4 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] rounded shadow hover:bg-[#765426]"
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
                                className="px-3.5 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ebdaba] transition-all rounded flex items-center gap-1.5 text-[#55313c]"
                              >
                                <Upload size={13} />
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
                weddings.map((w) => (
                  <div
                    key={w.slug}
                    className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      currentWedding.slug === w.slug
                        ? "border-[#946f35] bg-[#fbf5e7] shadow-xs"
                        : "border-[#bc965e]/50 bg-[#fffaf0] hover:border-[#bc965e]"
                    }`}
                  >
                    <div>
                      <h4 className="font-serif text-base font-semibold text-[#55313c]">
                        {w.brideName} & {w.groomName}
                        {currentWedding.slug === w.slug && (
                          <span className="ml-2 text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-[#946f35] text-[#fff7df]">
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
                      {w.slug !== defaultWeddingData.slug && (
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
                ))
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
                  const remaining = weddings.filter((w) => w.slug !== slug);
                  setWeddings(remaining);
                  if (currentWedding.slug === slug) {
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
