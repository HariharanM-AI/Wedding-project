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
  Search,
  X,
  AlertTriangle,
  Edit3
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
  const [showPastClientsModal, setShowPastClientsModal] = useState<boolean>(false);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>("");
  const [clientToDelete, setClientToDelete] = useState<WeddingData | null>(null);

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

    // Common invitation details kept with royal defaults (editable by owner)
    // Personal details (dates, venue, city, ceremonies) start clean and empty
    const newWedding: WeddingData = {
      slug,
      brideName: bride,
      groomName: groom,
      monogram,

      // Personal details: EMPTY by default so owner fills them in per client
      weddingDate: "",
      displayDate: "",
      locationLine: "",
      city: "",
      venueName: "",
      muhurthamTime: "",

      // Common ceremony & invitation texts: elegant editable defaults matching product
      blessingEyebrow: "WITH THE BLESSINGS OF OUR FAMILIES",
      subheading: "ARE GETTING MARRIED",
      invitationEyebrow: "IN THE PRESENCE OF LOVE & TRADITION",
      invitationHeading: "You're invited",
      invitationSubtitle: "Together with our families,\nwe invite you to celebrate the wedding of",
      invitationQuote: "Two hearts. Two families.\nOne beautiful beginning.",
      storyIntro: "Under the canopy of sacred temple chants and blooming jasmine, our journey begins.",
      finalHeading: "Our forever begins with you.",
      finalSubtext: "Save the auspicious date",

      // Events: EMPTY so the owner adds the client's actual ceremonies
      events: [],

      // Base visual assets: default template artwork so preview works until photos are uploaded
      photos: {
        couplePortrait: "/art/portrait.webp",
        handsDetail: "/images/hands.webp",
        carTravel: "/images/car.webp",
        templeScene: "/art/temple.webp"
      },

      updatedAt: new Date().toISOString()
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

  async function confirmDelete(slug: string) {
    if (slug === defaultWeddingData.slug) {
      alert("The default template cannot be deleted.");
      setClientToDelete(null);
      return;
    }
    await deleteWedding(slug);
    const remaining = weddings.filter((w) => w.slug !== slug);
    setWeddings(remaining);
    if (currentWedding.slug === slug) {
      const next = remaining[0] || defaultWeddingData;
      setCurrentWedding(next);
      broadcastWeddingUpdate(next);
    }
    setClientToDelete(null);
    refreshWeddingList();
  }

  function handleDeleteWedding(slug: string) {
    const target = weddings.find((w) => w.slug === slug) || currentWedding;
    setClientToDelete(target);
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
      title: "",
      date: "",
      time: "",
      venue: "",
      copy: "Surrounded by loved ones, timeless rituals, and joyous celebrations.",
      shortTagline: "AUSPICIOUS CELEBRATION",
      shortCopy: "Music, blessings, and cherished moments.",
      image: currentWedding.photos?.couplePortrait || "/art/portrait.webp"
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

  // Sort weddings by most recent
  const sortedWeddings = [...weddings].sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  // Recent 5 clients for the header dropdown
  let recentWeddings = sortedWeddings.slice(0, 5);
  if (currentWedding.slug && !recentWeddings.some((w) => w.slug === currentWedding.slug)) {
    const currentInList = weddings.find((w) => w.slug === currentWedding.slug);
    if (currentInList) {
      recentWeddings = [currentInList, ...recentWeddings.slice(0, 4)];
    }
  }

  // Filtered clients for Past Clients modal
  const filteredClients = sortedWeddings.filter((w) => {
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase();
    return (
      w.brideName.toLowerCase().includes(q) ||
      w.groomName.toLowerCase().includes(q) ||
      w.slug.toLowerCase().includes(q) ||
      (w.city && w.city.toLowerCase().includes(q)) ||
      (w.venueName && w.venueName.toLowerCase().includes(q))
    );
  });

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
            {/* Recent 5 Clients Dropdown Filter */}
            <select
              value={currentWedding.slug}
              onChange={(e) => {
                if (e.target.value === "__view_all__") {
                  setShowPastClientsModal(true);
                } else {
                  handleSelectWedding(e.target.value);
                }
              }}
              className="h-9 px-3 bg-[#fffdf7] border border-[#bc965e] text-xs font-serif text-[#55313c] rounded-md focus:outline-none focus:ring-1 focus:ring-[#946f35] shadow-xs cursor-pointer max-w-[210px] truncate"
              title="Recent 5 clients"
            >
              <optgroup label="Recent Clients (Top 5)">
                {recentWeddings.map((w) => (
                  <option key={w.slug} value={w.slug}>
                    {w.brideName} & {w.groomName}
                  </option>
                ))}
              </optgroup>
              <option value="__view_all__">✦ View All Past Clients ({weddings.length})...</option>
            </select>

            {/* Past Clients Button */}
            <button
              onClick={() => setShowPastClientsModal(true)}
              className="h-9 px-3.5 text-xs font-serif font-medium border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f6ebd8] transition-all rounded-md flex items-center gap-1.5 text-[#55313c] shadow-xs"
              title="View all past clients"
            >
              <Users size={14} />
              <span>Past Clients</span>
              <span className="px-1.5 py-0.5 bg-[#f5e9cf] border border-[#bc965e]/60 rounded-full text-[10px] text-[#775536] font-mono leading-none">
                {weddings.length}
              </span>
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
                  {currentWedding.events.length === 0 ? (
                    <div className="border-2 border-dashed border-[#bc965e]/50 bg-[#fffaf0]/80 rounded-xl p-8 sm:p-10 text-center space-y-3">
                      <Calendar className="mx-auto text-[#946f35]/60" size={36} />
                      <h3 className="font-serif text-xl text-[#55313c]">No Celebrations Added Yet</h3>
                      <p className="text-xs sm:text-sm text-[#82704f] max-w-md mx-auto">
                        This client currently has no celebration ceremonies. Click &quot;Add Celebration&quot; above to create ceremonies such as Haldi, Mehendi, Sangeet, Muhurtham, or Reception.
                      </p>
                      <button
                        onClick={handleAddEvent}
                        className="px-4 py-2 text-xs font-serif bg-[#946f35] text-[#fff7df] hover:bg-[#765426] rounded-md inline-flex items-center gap-1.5 shadow-sm transition-all font-medium"
                      >
                        <Plus size={14} />
                        <span>Add First Celebration</span>
                      </button>
                    </div>
                  ) : (
                    currentWedding.events.map((evt, idx) => (
                      <div
                        key={evt.id || idx}
                        className="border border-[#bc965e] bg-[#fffaf0] p-6 rounded-lg relative shadow-xs hover:border-[#946f35] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#bc965e]/30">
                          <span className="font-serif text-lg font-semibold text-[#55313c]">
                            Celebration #{idx + 1}: {evt.title || "Untitled Ceremony"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEvent(evt.id)}
                            className="text-xs text-rose-800 hover:text-rose-950 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-rose-100/60 border border-rose-300 transition-colors"
                            title="Remove this celebration"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Event Title *</label>
                            <input
                              type="text"
                              value={evt.title}
                              onChange={(e) => handleUpdateEvent(idx, "title", e.target.value)}
                              placeholder="e.g. Haldi Ceremony / Sangeet / Muhurtham"
                              className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Date *</label>
                            <input
                              type="text"
                              value={evt.date}
                              onChange={(e) => handleUpdateEvent(idx, "date", e.target.value)}
                              placeholder="e.g. 24 November 2027"
                              className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Time *</label>
                            <input
                              type="text"
                              value={evt.time}
                              onChange={(e) => handleUpdateEvent(idx, "time", e.target.value)}
                              placeholder="e.g. 10:00 am onwards"
                              className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Venue Location *</label>
                            <input
                              type="text"
                              value={evt.venue}
                              onChange={(e) => handleUpdateEvent(idx, "venue", e.target.value)}
                              placeholder="e.g. Temple Courtyard / Banquet Hall"
                              className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-serif text-[#82704f] mb-1 font-medium">Card Tagline</label>
                            <input
                              type="text"
                              value={evt.shortTagline || ""}
                              onChange={(e) => handleUpdateEvent(idx, "shortTagline", e.target.value)}
                              placeholder="e.g. AUSPICIOUS CELEBRATION"
                              className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
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
                              placeholder="Surrounded by loved ones, timeless rituals, and joyous celebrations..."
                              className="w-full bg-[#fbf4e6] border border-[#bc965e] px-3.5 py-2 text-xs text-[#55313c] rounded focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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

      {/* PAST CLIENTS DIRECTORY MODAL */}
      {showPastClientsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-[#fffdf7] border-2 border-[#bc965e] rounded-xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#bc965e]/40 bg-[#fffcf4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#55313c] text-[#fff8e9] flex items-center justify-center border border-[#bc965e] shadow-xs">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#55313c]">Past Clients Directory</h3>
                  <p className="text-xs text-[#82704f]">
                    {weddings.length} {weddings.length === 1 ? "client project" : "client projects"} stored in database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPastClientsModal(false)}
                className="h-8 w-8 rounded-full border border-[#bc965e]/50 hover:bg-[#f5e9cf] flex items-center justify-center text-[#55313c] transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search & Actions Bar */}
            <div className="px-4 sm:px-6 py-3 border-b border-[#bc965e]/25 bg-[#faf2e2]/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82704f]" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  placeholder="Search bride, groom, city, or date..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#fffdf7] border border-[#bc965e] text-xs text-[#55313c] rounded-md focus:outline-none focus:ring-1 focus:ring-[#946f35]"
                />
              </div>

              <button
                onClick={() => {
                  setShowPastClientsModal(false);
                  setShowNewModal(true);
                }}
                className="h-8 px-3.5 text-xs font-serif font-medium bg-[#946f35] text-[#fff7df] hover:bg-[#765426] border border-[#765426] rounded-md flex items-center gap-1.5 shadow-xs whitespace-nowrap self-end sm:self-auto"
              >
                <Plus size={13} />
                <span>+ New Wedding</span>
              </button>
            </div>

            {/* Client List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12 text-[#82704f] font-serif space-y-2">
                  <p className="text-base text-[#55313c]">No client projects found matching &quot;{clientSearchQuery}&quot;</p>
                  <p className="text-xs">Try searching by bride, groom, or location name.</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isCurrent = client.slug === currentWedding.slug;
                  return (
                    <div
                      key={client.slug}
                      className={`p-3.5 sm:p-4 rounded-lg border transition-all ${
                        isCurrent
                          ? "border-[#bc965e] bg-[#fdf6e9] shadow-xs ring-1 ring-[#bc965e]/50"
                          : "border-[#bc965e]/40 bg-[#fffaf0] hover:border-[#bc965e] hover:shadow-xs"
                      } flex flex-col md:flex-row md:items-center justify-between gap-3`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif text-lg font-medium text-[#55313c] truncate">
                            {client.brideName} & {client.groomName}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-serif bg-[#55313c] text-[#fff8e9] rounded-full">
                              ● Currently Editing
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#82704f] flex-wrap">
                          <span>📅 {client.displayDate || "Date to be set"}</span>
                          <span>•</span>
                          <span>📍 {client.city || client.venueName || "Venue to be set"}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                        {/* Edit / Switch Button */}
                        <button
                          onClick={() => {
                            handleSelectWedding(client.slug);
                            setShowPastClientsModal(false);
                          }}
                          className={`h-8 px-3 text-xs font-serif rounded flex items-center gap-1.5 transition-all shadow-xs ${
                            isCurrent
                              ? "bg-[#55313c] text-[#fff8e9] hover:bg-[#7d4954]"
                              : "bg-[#946f35] text-[#fff7df] hover:bg-[#765426]"
                          }`}
                          title="Open this wedding in Studio editor"
                        >
                          <Edit3 size={13} />
                          <span>{isCurrent ? "Editing" : "Edit Project"}</span>
                        </button>

                        {/* Open Invitation Link */}
                        <a
                          href={`/w/${client.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2.5 text-xs font-serif border border-[#bc965e] bg-[#fffdf7] hover:bg-[#f6ebd8] text-[#55313c] rounded flex items-center gap-1 transition-all"
                          title="View live invitation in new tab"
                        >
                          <ExternalLink size={13} />
                          <span className="hidden sm:inline">Preview</span>
                        </a>

                        {/* Delete Button */}
                        <button
                          onClick={() => setClientToDelete(client)}
                          className="h-8 px-2.5 text-xs text-rose-800 hover:text-rose-950 hover:bg-rose-100/70 border border-rose-300 rounded flex items-center gap-1 transition-all"
                          title="Delete this client project"
                        >
                          <Trash2 size={13} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#bc965e]/30 bg-[#faf2e2]/40 flex justify-end">
              <button
                onClick={() => setShowPastClientsModal(false)}
                className="px-5 py-2 text-xs font-serif border border-[#bc965e] bg-[#fffaf0] hover:bg-[#f6ebd8] text-[#55313c] rounded-md transition-all font-medium"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#fffdf7] border-2 border-rose-300 p-6 sm:p-7 max-w-md w-full rounded-xl shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-800 border-b border-rose-200 pb-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-rose-700" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-rose-900">
                  Permanently Delete Project?
                </h3>
                <p className="text-xs text-[#82704f]">Action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#55313c] leading-relaxed">
              Are you sure you want to permanently delete the wedding project for{" "}
              <strong className="font-serif text-base text-[#55313c]">
                {clientToDelete.brideName} & {clientToDelete.groomName}
              </strong>
              ?
            </p>
            <p className="text-xs text-[#82704f] bg-rose-50 border border-rose-200 p-2.5 rounded">
              All saved details and the live client link{" "}
              <code className="font-mono text-rose-800 font-semibold">/w/{clientToDelete.slug}</code> will be
              erased permanently from cloud database and storage.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#bc965e]/30">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-serif border border-[#bc965e] bg-[#f5e9cf] rounded hover:bg-[#ead7b7] text-[#55313c]"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(clientToDelete.slug)}
                className="px-5 py-2 text-xs font-serif bg-rose-800 hover:bg-rose-900 text-white rounded font-medium shadow-sm transition-all"
              >
                Yes, Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
