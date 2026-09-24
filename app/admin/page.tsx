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
  Clock,
  Heart,
  Sparkles,
  Database,
  Key,
  Eye,
  RefreshCw
} from "lucide-react";
import { WeddingData, WeddingEvent, WeddingPhotos } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import {
  listWeddings,
  getWedding,
  saveWedding,
  deleteWedding,
  uploadWeddingPhoto
} from "@/lib/wedding-storage";
import {
  getSupabaseAnonKey,
  setSupabaseAnonKey,
  getSupabaseClient,
  SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_URL
} from "@/lib/supabase";

export default function AdminPage() {
  const [weddings, setWeddings] = useState<WeddingData[]>([]);
  const [currentWedding, setCurrentWedding] = useState<WeddingData>(defaultWeddingData);
  const [activeTab, setActiveTab] = useState<"couple" | "venue" | "events" | "photos" | "settings">("couple");
  const [supabaseKey, setSupabaseKeyInput] = useState<string>("");
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newBride, setNewBride] = useState<string>("");
  const [newGroom, setNewGroom] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<keyof WeddingPhotos | null>(null);

  // Initialize data and Supabase key
  useEffect(() => {
    const key = getSupabaseAnonKey() || "";
    setSupabaseKeyInput(key);
    setIsSupabaseConnected(!!getSupabaseClient());

    refreshWeddingList();

    // Check if query param ?edit=slug is present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const editSlug = params.get("edit");
      if (editSlug) {
        getWedding(editSlug).then((data) => {
          if (data) setCurrentWedding(data);
        });
      }
    }
  }, []);

  async function refreshWeddingList() {
    const list = await listWeddings();
    setWeddings(list);
    if (list.length > 0 && !currentWedding.slug) {
      setCurrentWedding(list[0]);
    }
  }

  function handleSelectWedding(slug: string) {
    const found = weddings.find((w) => w.slug === slug);
    if (found) {
      setCurrentWedding(JSON.parse(JSON.stringify(found)));
    } else {
      getWedding(slug).then((w) => setCurrentWedding(w));
    }
  }

  async function handleSave() {
    setSaveStatus("Saving...");
    const res = await saveWedding(currentWedding);
    if (res.success) {
      setSaveStatus("Saved successfully!");
      refreshWeddingList();
      setTimeout(() => setSaveStatus(""), 3000);
    } else {
      setSaveStatus(`Saved locally. (Supabase notice: ${res.error || "sync pending"})`);
      setTimeout(() => setSaveStatus(""), 4500);
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
      displayDate: "24 November 2027",
      weddingDate: "2027-11-24T09:15:00+05:30",
      locationLine: `24 NOVEMBER 2027 · ${defaultWeddingData.city.split(",")[0].toUpperCase()}`
    };

    saveWedding(newWedding).then(() => {
      refreshWeddingList();
      setCurrentWedding(newWedding);
      setShowNewModal(false);
      setNewBride("");
      setNewGroom("");
      setActiveTab("couple");
    });
  }

  async function handleDeleteWedding(slug: string) {
    if (slug === defaultWeddingData.slug) {
      alert("Cannot delete the default template wedding.");
      return;
    }
    if (confirm(`Are you sure you want to delete the wedding for "${currentWedding.brideName} & ${currentWedding.groomName}"?`)) {
      await deleteWedding(slug);
      const remaining = weddings.filter((w) => w.slug !== slug);
      setWeddings(remaining);
      setCurrentWedding(remaining[0] || defaultWeddingData);
    }
  }

  function handleSaveSupabaseKey() {
    setSupabaseAnonKey(supabaseKey);
    const client = getSupabaseClient();
    setIsSupabaseConnected(!!client);
    refreshWeddingList();
    alert(client ? "Supabase Anon Key saved and connected!" : "Supabase connection error. Please verify the key.");
  }

  // Trigger file selection for photos
  function triggerUpload(slot: keyof WeddingPhotos) {
    setActiveUploadSlot(slot);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeUploadSlot) return;

    setUploadingSlot(activeUploadSlot);
    try {
      const url = await uploadWeddingPhoto(file, currentWedding.slug, activeUploadSlot);
      setCurrentWedding((prev) => ({
        ...prev,
        photos: {
          ...prev.photos,
          [activeUploadSlot]: url
        }
      }));
    } catch (err) {
      alert("Photo upload failed: " + err);
    } finally {
      setUploadingSlot(null);
      setActiveUploadSlot(null);
    }
  }

  // Event handlers for dynamic event items
  function handleAddEvent() {
    const newEvent: WeddingEvent = {
      id: `event-${Date.now()}`,
      title: "New Celebration",
      date: currentWedding.displayDate,
      time: "6:00 pm onwards",
      venue: currentWedding.venueName,
      copy: "Join us with your family for this wonderful celebration.",
      shortTagline: "JOIN THE CELEBRATION",
      shortCopy: "Memories to cherish together."
    };
    setCurrentWedding((prev) => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));
  }

  function handleRemoveEvent(id: string) {
    setCurrentWedding((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id)
    }));
  }

  function handleUpdateEvent(index: number, field: keyof WeddingEvent, value: string) {
    const updated = [...currentWedding.events];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentWedding((prev) => ({ ...prev, events: updated }));
  }

  const clientUrl = typeof window !== "undefined" ? `${window.location.origin}/w/${currentWedding.slug}` : `/w/${currentWedding.slug}`;

  return (
    <div className="min-h-screen bg-[#f5e9cf] text-[#55313c] font-sans selection:bg-[#ab8644] selection:text-[#fff8e9]">
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* TOP ROYAL BANNER & CONTROLS */}
      <header className="border-b border-[#bc965e] bg-[#fbf3e4] px-6 py-4 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-light tracking-tight text-[#55313c] px-3 py-1 border border-[#bc965e] bg-[#fffaf0] rounded">
              {currentWedding.monogram || "w"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl md:text-2xl font-normal text-[#55313c]">
                  Wedding Planner Studio
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full border border-[#bc965e] font-serif bg-[#f5e9cf]">
                  Admin
                </span>
              </div>
              <p className="text-xs text-[#82704f]">
                Editing: <span className="font-semibold text-[#55313c]">{currentWedding.brideName} & {currentWedding.groomName}</span> ({currentWedding.slug})
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wedding Switcher */}
            <select
              value={currentWedding.slug}
              onChange={(e) => handleSelectWedding(e.target.value)}
              className="bg-[#fff8ea] border border-[#bc965e] text-xs font-serif text-[#55313c] px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
            >
              {weddings.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.brideName} & {w.groomName} ({w.slug})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowNewModal(true)}
              className="px-3 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] hover:bg-[#765426] transition-all rounded flex items-center gap-1.5 shadow-sm"
              title="Create new wedding invitation"
            >
              <Plus size={14} />
              <span>New Wedding</span>
            </button>

            <button
              onClick={handleCopyClientLink}
              className="px-3 py-2 text-xs font-serif border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f5e9cf] transition-all rounded flex items-center gap-1.5 text-[#55313c]"
              title="Copy shareable client link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
              <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
            </button>

            <a
              href={clientUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-serif border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f5e9cf] transition-all rounded flex items-center gap-1.5 text-[#55313c]"
              title="Open client invitation in new tab"
            >
              <ExternalLink size={14} />
              <span>Preview</span>
            </a>

            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-serif bg-[#55313c] text-[#fff3d7] hover:bg-[#7d4954] transition-all rounded flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>

            {currentWedding.slug !== defaultWeddingData.slug && (
              <button
                onClick={() => handleDeleteWedding(currentWedding.slug)}
                className="p-2 text-xs text-rose-800 hover:bg-rose-100/60 rounded border border-rose-300 transition-all"
                title="Delete this wedding"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Live Notification Bar */}
        {saveStatus && (
          <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-[#bc965e]/40 flex items-center justify-between text-xs text-[#946f35] font-serif">
            <span>✦ {saveStatus}</span>
            <span className="text-[#82704f]">Updates reflect live across all open invitation tabs</span>
          </div>
        )}
      </header>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#bc965e] mb-8 overflow-x-auto gap-1">
          {[
            { id: "couple", label: "Couple & Story", icon: Heart },
            { id: "venue", label: "Muhurtham & Venue", icon: MapPin },
            { id: "events", label: "Events Schedule", icon: Calendar },
            { id: "photos", label: "Photos & Media", icon: ImageIcon },
            { id: "settings", label: "Supabase & Settings", icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 font-serif text-sm border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-[#946f35] text-[#55313c] font-medium bg-[#fcf5e7]/80"
                    : "border-transparent text-[#82704f] hover:text-[#55313c] hover:bg-[#fff9ef]/50"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#946f35]" : "text-[#82704f]"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT PANELS */}
        <div className="bg-[#fbf4e6] border border-[#bc965e] p-6 md:p-8 rounded shadow-sm">
          {/* TAB 1: COUPLE & STORY */}
          {activeTab === "couple" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#55313c] mb-1">Couple Details & Invitation Text</h2>
                <p className="text-xs text-[#82704f]">
                  Customize the couple's names, monogram, blessings, and introductory invitation words.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Bride's Name *
                  </label>
                  <input
                    type="text"
                    value={currentWedding.brideName}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, brideName: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Groom's Name *
                  </label>
                  <input
                    type="text"
                    value={currentWedding.groomName}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, groomName: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Monogram Badge (e.g. a&k)
                  </label>
                  <input
                    type="text"
                    value={currentWedding.monogram}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, monogram: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#bc965e]/30">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Opening Eyebrow Tagline
                  </label>
                  <input
                    type="text"
                    value={currentWedding.blessingEyebrow}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, blessingEyebrow: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                  <p className="text-[11px] text-[#82704f] mt-1">Displayed at the very top of the opening scene.</p>
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Opening Subheading
                  </label>
                  <input
                    type="text"
                    value={currentWedding.subheading}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, subheading: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                  <p className="text-[11px] text-[#82704f] mt-1">E.g., "ARE GETTING MARRIED".</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#bc965e]/30">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Invitation Gateway Message
                  </label>
                  <textarea
                    rows={3}
                    value={currentWedding.invitationSubtitle}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, invitationSubtitle: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Romantic Quote
                  </label>
                  <textarea
                    rows={3}
                    value={currentWedding.invitationQuote}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, invitationQuote: e.target.value })}
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#bc965e]/30">
                <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                  Couple Story Introduction
                </label>
                <input
                  type="text"
                  value={currentWedding.storyIntro}
                  onChange={(e) => setCurrentWedding({ ...currentWedding, storyIntro: e.target.value })}
                  className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                />
                <p className="text-[11px] text-[#82704f] mt-1">Displayed above the gold photo frame scene.</p>
              </div>
            </div>
          )}

          {/* TAB 2: MUHURTHAM & VENUE */}
          {activeTab === "venue" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#55313c] mb-1">Wedding Date, Muhurtham & Venue</h2>
                <p className="text-xs text-[#82704f]">
                  Control the countdown timer, auspicious timings, and primary ceremony locations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Display Date (Formatted) *
                  </label>
                  <input
                    type="text"
                    value={currentWedding.displayDate}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, displayDate: e.target.value })}
                    placeholder="e.g. 20 February 2027"
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                  <p className="text-[11px] text-[#82704f] mt-1">The date written across the invitations and headings.</p>
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Exact Countdown Timestamp (ISO Date) *
                  </label>
                  <input
                    type="text"
                    value={currentWedding.weddingDate}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, weddingDate: e.target.value })}
                    placeholder="e.g. 2027-02-20T09:15:00+05:30"
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] font-mono rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                  <p className="text-[11px] text-[#82704f] mt-1">Powers the live Days / Hours / Minutes / Seconds countdown clock.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#bc965e]/30">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Primary Venue Name *
                  </label>
                  <input
                    type="text"
                    value={currentWedding.venueName}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, venueName: e.target.value })}
                    placeholder="e.g. The Heritage Courtyard"
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    City & State *
                  </label>
                  <input
                    type="text"
                    value={currentWedding.city}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, city: e.target.value })}
                    placeholder="e.g. Thanjavur, Tamil Nadu"
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                    Muhurtham Timing Window
                  </label>
                  <input
                    type="text"
                    value={currentWedding.muhurthamTime}
                    onChange={(e) => setCurrentWedding({ ...currentWedding, muhurthamTime: e.target.value })}
                    placeholder="e.g. Muhurtham · 9:15 am – 11:30 am"
                    className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#bc965e]/30">
                <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5">
                  Location Stamp (Footer & Gateway)
                </label>
                <input
                  type="text"
                  value={currentWedding.locationLine}
                  onChange={(e) => setCurrentWedding({ ...currentWedding, locationLine: e.target.value })}
                  placeholder="e.g. 20 FEBRUARY 2027 · THANJAVUR"
                  className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                />
              </div>
            </div>
          )}

          {/* TAB 3: EVENTS SCHEDULE */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-[#55313c] mb-1">Celebrations & Events Schedule</h2>
                  <p className="text-xs text-[#82704f]">
                    Add, edit, or remove events (Mehendi, Sangeet, Muhurtham, Reception, Haldi, etc.).
                  </p>
                </div>
                <button
                  onClick={handleAddEvent}
                  className="px-3 py-1.5 text-xs font-serif bg-[#946f35] text-[#fff7df] hover:bg-[#765426] transition-all rounded flex items-center gap-1.5 w-max"
                >
                  <Plus size={14} />
                  <span>Add Celebration</span>
                </button>
              </div>

              <div className="space-y-4">
                {currentWedding.events.map((evt, idx) => (
                  <div
                    key={evt.id || idx}
                    className="border border-[#bc965e] bg-[#fffaf0] p-5 rounded relative shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#bc965e]/30">
                      <span className="font-serif text-lg text-[#55313c]">
                        #{idx + 1} — {evt.title || "Untitled Celebration"}
                      </span>
                      {currentWedding.events.length > 1 && (
                        <button
                          onClick={() => handleRemoveEvent(evt.id)}
                          className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-serif text-[#82704f] mb-1">Title</label>
                        <input
                          type="text"
                          value={evt.title}
                          onChange={(e) => handleUpdateEvent(idx, "title", e.target.value)}
                          className="w-full bg-[#fbf4e6] border border-[#bc965e] px-2.5 py-1.5 text-xs text-[#55313c] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-serif text-[#82704f] mb-1">Date</label>
                        <input
                          type="text"
                          value={evt.date}
                          onChange={(e) => handleUpdateEvent(idx, "date", e.target.value)}
                          className="w-full bg-[#fbf4e6] border border-[#bc965e] px-2.5 py-1.5 text-xs text-[#55313c] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-serif text-[#82704f] mb-1">Time</label>
                        <input
                          type="text"
                          value={evt.time}
                          onChange={(e) => handleUpdateEvent(idx, "time", e.target.value)}
                          className="w-full bg-[#fbf4e6] border border-[#bc965e] px-2.5 py-1.5 text-xs text-[#55313c] rounded"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-serif text-[#82704f] mb-1">Venue Location</label>
                        <input
                          type="text"
                          value={evt.venue}
                          onChange={(e) => handleUpdateEvent(idx, "venue", e.target.value)}
                          className="w-full bg-[#fbf4e6] border border-[#bc965e] px-2.5 py-1.5 text-xs text-[#55313c] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-serif text-[#82704f] mb-1">Short Tagline</label>
                        <input
                          type="text"
                          value={evt.shortTagline || ""}
                          onChange={(e) => handleUpdateEvent(idx, "shortTagline", e.target.value)}
                          className="w-full bg-[#fbf4e6] border border-[#bc965e] px-2.5 py-1.5 text-xs text-[#55313c] rounded"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-serif text-[#82704f] mb-1">Full Description (Dialog Popup)</label>
                        <textarea
                          rows={2}
                          value={evt.copy}
                          onChange={(e) => handleUpdateEvent(idx, "copy", e.target.value)}
                          className="w-full bg-[#fbf4e6] border border-[#bc965e] px-2.5 py-1.5 text-xs text-[#55313c] rounded"
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
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#55313c] mb-1">Wedding Photography & Visuals</h2>
                <p className="text-xs text-[#82704f]">
                  Upload client photographs directly. Images are saved to your Supabase Storage bucket (or stored locally when offline).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    slot: "couplePortrait" as keyof WeddingPhotos,
                    label: "Main Couple Portrait",
                    desc: "Hero photo inside gold frame & story scene"
                  },
                  {
                    slot: "handsDetail" as keyof WeddingPhotos,
                    label: "Hands / Jewelry Detail",
                    desc: "Sangeet / Mehendi celebration card"
                  },
                  {
                    slot: "carTravel" as keyof WeddingPhotos,
                    label: "Vintage Car / Travel",
                    desc: "Floating memory & journey scene"
                  },
                  {
                    slot: "templeScene" as keyof WeddingPhotos,
                    label: "Temple Architecture",
                    desc: "Venue ceremony background shot"
                  }
                ].map((item) => {
                  const currentImg = currentWedding.photos[item.slot] || defaultWeddingData.photos[item.slot];
                  const isUploading = uploadingSlot === item.slot;

                  return (
                    <div
                      key={item.slot}
                      className="border border-[#bc965e] bg-[#fffaf0] p-4 rounded flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[3/4] w-full rounded overflow-hidden border border-[#bc965e] mb-3 bg-[#e8ce99]/30 relative group">
                          <img
                            src={currentImg}
                            alt={item.label}
                            className="w-full h-full object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                            <button
                              onClick={() => triggerUpload(item.slot)}
                              className="px-3 py-1.5 text-xs font-serif bg-[#946f35] text-[#fff7df] rounded shadow"
                            >
                              Replace Photo
                            </button>
                          </div>
                        </div>

                        <h3 className="font-serif text-base text-[#55313c]">{item.label}</h3>
                        <p className="text-[11px] text-[#82704f] mt-0.5">{item.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#bc965e]/30 flex items-center justify-between">
                        <button
                          onClick={() => triggerUpload(item.slot)}
                          disabled={isUploading}
                          className="px-3 py-1 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ebdaba] transition-all rounded flex items-center gap-1.5 text-[#55313c]"
                        >
                          <Upload size={12} />
                          <span>{isUploading ? "Uploading..." : "Upload"}</span>
                        </button>

                        <button
                          onClick={() => {
                            setCurrentWedding((prev) => ({
                              ...prev,
                              photos: {
                                ...prev.photos,
                                [item.slot]: defaultWeddingData.photos[item.slot]
                              }
                            }));
                          }}
                          className="text-[11px] text-[#82704f] hover:text-[#55313c]"
                          title="Reset to default template photo"
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

          {/* TAB 5: SUPABASE & SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#55313c] mb-1">Supabase Cloud Sync & Configuration</h2>
                <p className="text-xs text-[#82704f]">
                  Connect your Supabase project to enable cloud database storage and public photo hosting.
                </p>
              </div>

              {/* Status Box */}
              <div
                className={`p-4 rounded border flex items-start gap-3 ${
                  isSupabaseConnected
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                    : "bg-amber-50/70 border-amber-300 text-amber-900"
                }`}
              >
                <Database className="mt-0.5" size={18} />
                <div>
                  <h4 className="font-serif text-sm font-semibold">
                    {isSupabaseConnected ? "Supabase Cloud Connected 🟢" : "Running in Local Storage Mode 🟡"}
                  </h4>
                  <p className="text-xs mt-1">
                    {isSupabaseConnected
                      ? `Successfully linked to project "${SUPABASE_PROJECT_ID}". Weddings and photos sync to your live database.`
                      : `Your weddings and uploads are saved locally in the browser cache. Enter your Supabase Anon Public Key below to sync to the cloud.`}
                  </p>
                </div>
              </div>

              {/* Supabase Configuration Form */}
              <div className="border border-[#bc965e] bg-[#fffaf0] p-5 rounded space-y-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    disabled
                    value={DEFAULT_SUPABASE_URL}
                    className="w-full bg-[#f0e4cb] border border-[#bc965e] px-3 py-2 text-xs font-mono text-[#55313c] rounded opacity-80 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1">
                    Supabase Anon Public Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      placeholder="Paste your anon public key from Supabase Dashboard..."
                      className="flex-1 bg-[#fbf4e6] border border-[#bc965e] px-3 py-2 text-xs font-mono text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                    <button
                      onClick={handleSaveSupabaseKey}
                      className="px-4 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] hover:bg-[#765426] transition-all rounded flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>Save Key</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#82704f] mt-1.5">
                    Found in: <b>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon public)</b>.
                  </p>
                </div>
              </div>

              {/* SQL Schema Instructions */}
              <div className="border border-[#bc965e] bg-[#fffaf0] p-5 rounded space-y-3">
                <h3 className="font-serif text-lg text-[#55313c]">Database Table & Storage Bucket Setup</h3>
                <p className="text-xs text-[#82704f]">
                  We have included a complete SQL script in your project at{" "}
                  <code className="bg-[#f5e9cf] px-1.5 py-0.5 rounded border border-[#bc965e]">supabase/schema.sql</code>.
                  Run it once in your <b>Supabase SQL Editor</b> to create the <code className="font-mono">weddings</code> table and the <code className="font-mono">wedding-photos</code> storage bucket.
                </p>
              </div>

              {/* Download Calendar File Test */}
              <div className="border border-[#bc965e] bg-[#fffaf0] p-5 rounded flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-sm text-[#55313c]">Calendar Event File (.ics)</h4>
                  <p className="text-xs text-[#82704f]">Downloadable invitation file for guest calendar integration.</p>
                </div>
                <a
                  href="/ananya-karthik-wedding.ics"
                  download
                  className="px-3 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] hover:bg-[#ebdaba] transition-all rounded flex items-center gap-1.5 text-[#55313c]"
                >
                  <Calendar size={13} />
                  <span>Download .ics</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE NEW WEDDING MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf4e6] border-2 border-[#bc965e] p-6 max-w-md w-full rounded shadow-2xl space-y-4">
            <h3 className="font-serif text-2xl text-[#55313c]">Create New Wedding Project</h3>
            <p className="text-xs text-[#82704f]">
              Enter the bride and groom names to generate a new customized invitation and client link.
            </p>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1">
                Bride's Name
              </label>
              <input
                type="text"
                value={newBride}
                onChange={(e) => setNewBride(e.target.value)}
                placeholder="e.g. Kavya"
                className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1">
                Groom's Name
              </label>
              <input
                type="text"
                value={newGroom}
                onChange={(e) => setNewGroom(e.target.value)}
                placeholder="e.g. Arjun"
                className="w-full bg-[#fffaf0] border border-[#bc965e] px-3 py-2 text-sm text-[#55313c] rounded focus:outline-none"
              />
            </div>

            {newBride && newGroom && (
              <p className="text-xs text-[#946f35] font-serif">
                Generated Client URL:{" "}
                <span className="font-mono">
                  /w/{newBride.toLowerCase().replace(/[^a-z0-9]/g, "")}-{newGroom.toLowerCase().replace(/[^a-z0-9]/g, "")}
                </span>
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWedding}
                disabled={!newBride.trim() || !newGroom.trim()}
                className="px-4 py-1.5 text-xs font-serif bg-[#55313c] text-[#fff3d7] rounded disabled:opacity-50"
              >
                Create Wedding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
