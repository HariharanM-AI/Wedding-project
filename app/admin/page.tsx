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
  Compass
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

export default function AdminPage() {
  const [weddings, setWeddings] = useState<WeddingData[]>([]);
  const [currentWedding, setCurrentWedding] = useState<WeddingData>(defaultWeddingData);
  const [activeTab, setActiveTab] = useState<"couple" | "venue" | "events" | "photos">("couple");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newBride, setNewBride] = useState<string>("");
  const [newGroom, setNewGroom] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<keyof WeddingPhotos | null>(null);

  // Initialize wedding list & check ?edit=slug
  useEffect(() => {
    refreshWeddingList();

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
      const cloned = JSON.parse(JSON.stringify(found));
      setCurrentWedding(cloned);
      broadcastWeddingUpdate(cloned);
    } else {
      getWedding(slug).then((w) => {
        setCurrentWedding(w);
        broadcastWeddingUpdate(w);
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
      displayDate: "24 November 2027",
      weddingDate: "2027-11-24T09:15:00+05:30",
      locationLine: `24 NOVEMBER 2027 · ${defaultWeddingData.city.split(",")[0].toUpperCase()}`
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
    if (confirm(`Are you sure you want to delete "${currentWedding.brideName} & ${currentWedding.groomName}"?`)) {
      await deleteWedding(slug);
      const remaining = weddings.filter((w) => w.slug !== slug);
      setWeddings(remaining);
      const next = remaining[0] || defaultWeddingData;
      setCurrentWedding(next);
      broadcastWeddingUpdate(next);
    }
  }

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
      const updatedPhotos = { ...currentWedding.photos, [activeUploadSlot]: url };
      updateWedding({ photos: updatedPhotos });
      await saveWedding({ ...currentWedding, photos: updatedPhotos });
    } catch (err) {
      alert("Photo upload failed: " + err);
    } finally {
      setUploadingSlot(null);
      setActiveUploadSlot(null);
    }
  }

  function handleAddEvent() {
    const newEvent: WeddingEvent = {
      id: `event-${Date.now()}`,
      title: "Haldi Ceremony",
      date: currentWedding.displayDate,
      time: "10:00 am onwards",
      venue: currentWedding.venueName,
      copy: "Join us in yellow hues as turmeric and love are showered upon the couple.",
      shortTagline: "AUSPICIOUS BLESSINGS",
      shortCopy: "Turmeric, laughter, and timeless rituals.",
      image: currentWedding.photos.couplePortrait
    };
    const updatedEvents = [...currentWedding.events, newEvent];
    updateWedding({ events: updatedEvents });
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
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-md border border-[#bc965e]/70 bg-[#fffaf0] p-1 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="Hari Wedding Project Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-normal text-[#55313c] tracking-tight">
                Royal Wedding Planner Studio
              </h1>
              <p className="text-xs text-[#82704f] mt-0.5">
                Client Project:{" "}
                <span className="font-serif font-medium text-[#55313c]">
                  {currentWedding.brideName} & {currentWedding.groomName}
                </span>{" "}
                <span className="text-[#a48655]">(/w/{currentWedding.slug})</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar - Standardized Height (h-9), Font & Royal Styling */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wedding Switcher */}
            <select
              value={currentWedding.slug}
              onChange={(e) => handleSelectWedding(e.target.value)}
              className="h-9 px-3 bg-[#fffdf7] border border-[#bc965e] text-xs font-serif text-[#55313c] rounded-md focus:outline-none focus:ring-1 focus:ring-[#946f35] shadow-xs"
            >
              {weddings.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.brideName} & {w.groomName} ({w.slug})
                </option>
              ))}
            </select>

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

            {/* Delete button if not default */}
            {currentWedding.slug !== defaultWeddingData.slug && (
              <button
                onClick={() => handleDeleteWedding(currentWedding.slug)}
                className="h-9 px-2.5 text-xs text-rose-800 hover:bg-rose-100/70 rounded-md border border-rose-300 transition-all flex items-center justify-center"
                title="Delete this wedding project"
              >
                <Trash2 size={14} />
              </button>
            )}
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
                      Bride's Name *
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
                      Groom's Name *
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
                    <p className="text-[11px] text-[#82704f] mt-1.5">Displayed at the top of the opening temple scene.</p>
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
                    <p className="text-[11px] text-[#82704f] mt-1.5">E.g., "ARE GETTING MARRIED".</p>
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
                    <p className="text-[11px] text-[#82704f] mt-1.5">Appears inside the carved gateway scene.</p>
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
                    <p className="text-[11px] text-[#82704f] mt-1.5">Displayed under the couple's name in the gateway scene.</p>
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
                    <p className="text-[11px] text-[#82704f] mt-1.5">Displayed above the gold portrait frame.</p>
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
                    <p className="text-[11px] text-[#82704f] mt-1.5">Closing romantic declaration (e.g. "Our forever begins with you.")</p>
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
                      Formatted Display Date *
                    </label>
                    <input
                      type="text"
                      value={currentWedding.displayDate}
                      onChange={(e) => updateWedding({ displayDate: e.target.value })}
                      placeholder="e.g. 24 November 2027"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                    <p className="text-[11px] text-[#82704f] mt-1.5">Written across all invitation headings and save-the-date cards.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Exact Countdown Timestamp (ISO Date) *
                    </label>
                    <input
                      type="text"
                      value={currentWedding.weddingDate}
                      onChange={(e) => updateWedding({ weddingDate: e.target.value })}
                      placeholder="e.g. 2027-11-24T09:15:00+05:30"
                      className="w-full bg-[#fffaf0] border border-[#bc965e] px-4 py-2.5 text-sm text-[#55313c] font-mono rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                    />
                    <p className="text-[11px] text-[#82704f] mt-1.5">Powers the real-time Days, Hours, Minutes, and Seconds clock.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#bc965e]/30">
                  <div>
                    <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1.5 font-medium">
                      Primary Ceremony Venue *
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
                      City & Region *
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
                    onClick={handleAddEvent}
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
                          Celebration #{idx + 1}: {evt.title || "Untitled Celebration"}
                        </span>
                        {currentWedding.events.length > 1 && (
                          <button
                            onClick={() => handleRemoveEvent(evt.id)}
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
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Date</label>
                          <input
                            type="text"
                            value={evt.date}
                            onChange={(e) => handleUpdateEvent(idx, "date", e.target.value)}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Time</label>
                          <input
                            type="text"
                            value={evt.time}
                            onChange={(e) => handleUpdateEvent(idx, "time", e.target.value)}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Venue Location</label>
                          <input
                            type="text"
                            value={evt.venue}
                            onChange={(e) => handleUpdateEvent(idx, "venue", e.target.value)}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Card Tagline</label>
                          <input
                            type="text"
                            value={evt.shortTagline || ""}
                            onChange={(e) => handleUpdateEvent(idx, "shortTagline", e.target.value)}
                            className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded"
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
              <p className="text-xs text-[#82704f] mt-1">
                Enter the bride & groom names to generate a new customized invitation and dedicated client URL.
              </p>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#82704f] mb-1 font-medium">
                Bride's Name *
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
                Groom's Name *
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
                className="px-4 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] rounded hover:bg-[#ead7b7]"
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
    </div>
  );
}
