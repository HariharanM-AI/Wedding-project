-- =========================================================================
-- Supabase Schema for Custom Wedding Planner Platform
-- Project ID: fwybohsuhbzqifaqsajl
-- =========================================================================

-- 1. Create the primary weddings table
CREATE TABLE IF NOT EXISTS public.weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    bride_name TEXT,
    groom_name TEXT,
    monogram TEXT,
    wedding_date TEXT,
    display_date TEXT,
    muhurtham_time TEXT,
    muhurtham_details TEXT,
    venue_name TEXT,
    venue_location_url TEXT,
    city TEXT,
    location_line TEXT,
    blessing_eyebrow TEXT,
    subheading TEXT,
    invitation_eyebrow TEXT,
    invitation_heading TEXT,
    invitation_subtitle TEXT,
    invitation_quote TEXT,
    story_intro TEXT,
    final_heading TEXT,
    final_subtext TEXT,
    audio_url TEXT,
    enable_intro_animation BOOLEAN DEFAULT true,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for instant slug lookups
CREATE INDEX IF NOT EXISTS idx_weddings_slug ON public.weddings(slug);

-- Enable Row Level Security (RLS) on weddings
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on weddings"
    ON public.weddings FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert and update on weddings"
    ON public.weddings FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Create the celebrations & timeline events table
CREATE TABLE IF NOT EXISTS public.wedding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_slug TEXT NOT NULL REFERENCES public.weddings(slug) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT,
    time TEXT,
    venue TEXT,
    location_url TEXT,
    short_tagline TEXT,
    copy TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wedding_events_slug ON public.wedding_events(wedding_slug);

ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on wedding_events"
    ON public.wedding_events FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert and update on wedding_events"
    ON public.wedding_events FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Create the wedding photos & media asset tracking table
CREATE TABLE IF NOT EXISTS public.wedding_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_slug TEXT NOT NULL REFERENCES public.weddings(slug) ON DELETE CASCADE,
    slot_name TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(wedding_slug, slot_name)
);

CREATE INDEX IF NOT EXISTS idx_wedding_photos_slug ON public.wedding_photos(wedding_slug);

ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on wedding_photos"
    ON public.wedding_photos FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert and update on wedding_photos"
    ON public.wedding_photos FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Create the RSVP & wishes table
CREATE TABLE IF NOT EXISTS public.wedding_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_slug TEXT NOT NULL REFERENCES public.weddings(slug) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    attending BOOLEAN DEFAULT true,
    guest_count INTEGER DEFAULT 1,
    wishes_message TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wedding_rsvps_slug ON public.wedding_rsvps(wedding_slug);

ALTER TABLE public.wedding_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and insert on wedding_rsvps"
    ON public.wedding_rsvps FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Create the administrator credentials & access control table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and manage on admin_users"
    ON public.admin_users FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-photos', 'wedding-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Access for Wedding Photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wedding-photos');

CREATE POLICY "Allow Uploads to Wedding Photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'wedding-photos');

CREATE POLICY "Allow Updates to Wedding Photos"
    ON storage.objects FOR UPDATE
    WITH CHECK (bucket_id = 'wedding-photos');
