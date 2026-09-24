# Royal Wedding Invitation Planner Studio & Cinematic Wedding Invitation Experience

A multi-client wedding invitation platform and scroll-driven cinematic digital invitation experience inspired by royal South Indian heritage and Chola temple architecture.

---

## ✦ Overview

This platform consists of two integrated components:
1. **Royal Wedding Invitation Planner Studio (`/admin`)**: A centralized studio dashboard for wedding planners to create, manage, customize, and sync unique wedding invitations for multiple clients.
2. **Cinematic Wedding Invitation Film (`/w/[slug]`)**: A responsive, scroll-controlled interactive digital wedding invitation rendered across nine overlapping, hand-choreographed heritage scenes.

---

## ✦ Key Features

### 1. Royal Wedding Invitation Planner Studio (`/admin`)
- **Multi-Client Project Management**:
  - Filter dropdown showing the **last 5 recently edited projects** sorted in real-time.
  - **Past Clients Modal**: View all past client projects, switch active projects, access direct links, and manage projects.
  - **+ New Wedding Project**: Modal wizard to quickly spin up a new wedding project with custom bride & groom names, slug, and monogram.
  - **Copy Client Link**: One-click clipboard sharing of direct client URLs (`/w/[slug]`).
  - **Open Invitation**: Instantly preview the current client invitation in a new browser tab.
- **4-Tab Studio Workspace**:
  - **Couple & Story**: Bride & groom names, monogram initials, romantic quote, opening blessing subtext, and closing scene subtext.
  - **Muhurtham & Venue**: Royal Date Picker, countdown timestamp, ceremony venue, city, Muhurtham timing, location stamp, and full story/ceremony copy.
  - **Celebrations & Events Timeline**: Add, reorder, edit, or remove ceremonies (Haldi, Mehendi, Sangeet, Muhurtham, Reception) with dates, times, venues, taglines, and pop-up modal descriptions.
  - **Photos & Media Studio**: Upload high-resolution photos for couple portraits, hands detail, temple scenery, and celebration events.
- **Live Sync & Instant Feedback**:
  - Cloud database persistence with **Supabase**.
  - Real-time `BroadcastChannel` synchronization: any edits made in the admin studio reflect live in any open preview tabs without requiring a page refresh.
  - Tactile save button with dynamic loading and confirmation states.

### 2. Client Invitation Experience (`/w/[slug]`)
- **Nine Overlapping Cinematic Scenes**:
  1. **Opening Scene**: Golden dawn atmosphere, animated clouds, fluttering jade-and-gold butterflies, royal temple silhouette, and couple typography.
  2. **Invitation Gateway**: Sacred family blessings, couple introductions, and ceremonial announcements.
  3. **Celebrations Timeline**: Interactive card carousel with sideways motion, dedicated event times, venues, and "Full Details" pop-ups.
  4. **The Sacred Union**: Traditional South Indian attire, temple architecture, and floral garlands.
  5. **Heritage & Memories**: Golden framed portrait photography with traditional temple procession illustrations.
  6. **Sacred Muhurtham & Venue**: Dedicated Muhurtham ceremony timings, venue details, and guest information modal.
  7. **Interactive Blessing Scene**: "Bless The Couple" button triggering falling flower petals, sacred turmeric rice (*akshantalu*), and a live blessing counter.
  8. **Live Countdown**: Dynamic countdown clock to the auspicious wedding hour and floating memories.
  9. **Closing Scene**: Auspicious blessings, location stamp, and "Save the Date" calendar export (.ics).
- **Dynamic Monogram Favicons & Page Titles**:
  - The browser tab title updates automatically to match the couple: `[Bride] & [Groom] — A Beautiful Beginning`.
  - Generates custom high-resolution gold canvas monogram favicons (e.g. `R&P`, `S&J`) dynamically for each couple.

---

## ✦ Technology Stack

- **Framework**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS animations
- **Database & Storage**: Supabase (PostgreSQL `weddings` table and `wedding-photos` storage bucket)
- **Icons**: Lucide React
- **Fonts**: Cormorant (headings & serifs), Jost (body & accents)
- **Local Fallback**: LocalStorage and BroadcastChannel API for offline-first resilience

---

## ✦ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- `pnpm` (recommended package manager)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/HariharanM-AI/Wedding-project.git

# Navigate to project directory
cd Wedding-project

# Install dependencies
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
Execute the database schema migration in Supabase SQL editor:
```sql
CREATE TABLE IF NOT EXISTS public.weddings (
  slug TEXT PRIMARY KEY,
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  monogram TEXT,
  wedding_date TEXT,
  display_date TEXT,
  location_line TEXT,
  city TEXT,
  venue_name TEXT,
  muhurtham_time TEXT,
  muhurtham_details TEXT,
  invitation_eyebrow TEXT,
  invitation_subtitle TEXT,
  invitation_gateway TEXT,
  invitation_quote TEXT,
  story_intro TEXT,
  final_heading TEXT,
  final_subtext TEXT,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 5. Running the Application
```bash
# Start local development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## ✦ Application Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Default client wedding invitation experience |
| `/admin` | Royal Wedding Invitation Planner Studio workspace |
| `/w/[slug]` | Dedicated, dynamic client wedding invitation (e.g., `/w/rohidcb-pushyar`) |

---

## ✦ Motion & Accessibility

- **Native Scrolling**: Supports mouse wheel, touchpad gestures, and standard keyboard navigation (Arrow keys, Spacebar, Page Up/Down).
- **Reduced Motion Support**: Automatically respects `prefers-reduced-motion` accessibility preferences by disabling ambient particle physics and scene transitions.
- **Performance Optimization**: Unused offscreen scenes remain idle, and animations pause automatically when the tab is out of view.
