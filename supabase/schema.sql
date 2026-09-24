-- =========================================================================
-- Supabase Schema for Custom Wedding Planner Platform
-- Project ID: fwybohsuhbzqifaqsajl
-- =========================================================================

-- 1. Create the weddings table
CREATE TABLE IF NOT EXISTS public.weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    bride_name TEXT,
    groom_name TEXT,
    wedding_date TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for instant slug lookups
CREATE INDEX IF NOT EXISTS idx_weddings_slug ON public.weddings(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to invitations
CREATE POLICY "Allow public read access on weddings"
    ON public.weddings FOR SELECT
    USING (true);

-- Allow insert/update operations
CREATE POLICY "Allow public insert and update on weddings"
    ON public.weddings FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Create the public storage bucket for wedding photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-photos', 'wedding-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for photo uploads and public viewing
CREATE POLICY "Public Access for Wedding Photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wedding-photos');

CREATE POLICY "Allow Uploads to Wedding Photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'wedding-photos');

CREATE POLICY "Allow Updates to Wedding Photos"
    ON storage.objects FOR UPDATE
    WITH CHECK (bucket_id = 'wedding-photos');
