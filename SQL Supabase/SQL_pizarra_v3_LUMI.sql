-- =========================================================
-- LUMI AI - PIZARRA V3
-- Varias pizarras + imágenes acomodables
-- =========================================================

-- Columnas nuevas para las imágenes y tamaño original del lienzo
ALTER TABLE public.whiteboards
ADD COLUMN IF NOT EXISTS image_data JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.whiteboards
ADD COLUMN IF NOT EXISTS canvas_width DOUBLE PRECISION NOT NULL DEFAULT 500;

ALTER TABLE public.whiteboards
ADD COLUMN IF NOT EXISTS canvas_height DOUBLE PRECISION NOT NULL DEFAULT 700;

ALTER TABLE public.whiteboards
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Mi pizarra';

-- Permitir varias pizarras por usuario
ALTER TABLE public.whiteboards
DROP CONSTRAINT IF EXISTS whiteboards_user_id_key;

CREATE INDEX IF NOT EXISTS whiteboards_user_id_idx
ON public.whiteboards(user_id);

ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "LUMI whiteboards select own" ON public.whiteboards;
DROP POLICY IF EXISTS "LUMI whiteboards insert own" ON public.whiteboards;
DROP POLICY IF EXISTS "LUMI whiteboards update own" ON public.whiteboards;
DROP POLICY IF EXISTS "LUMI whiteboards delete own" ON public.whiteboards;

CREATE POLICY "LUMI whiteboards select own"
ON public.whiteboards FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "LUMI whiteboards insert own"
ON public.whiteboards FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "LUMI whiteboards update own"
ON public.whiteboards FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "LUMI whiteboards delete own"
ON public.whiteboards FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- STORAGE PARA IMÁGENES DE PIZARRA
-- =========================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'whiteboard-assets',
  'whiteboard-assets',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "LUMI whiteboard assets select" ON storage.objects;
DROP POLICY IF EXISTS "LUMI whiteboard assets insert own" ON storage.objects;
DROP POLICY IF EXISTS "LUMI whiteboard assets update own" ON storage.objects;
DROP POLICY IF EXISTS "LUMI whiteboard assets delete own" ON storage.objects;

CREATE POLICY "LUMI whiteboard assets select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'whiteboard-assets');

CREATE POLICY "LUMI whiteboard assets insert own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whiteboard-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "LUMI whiteboard assets update own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'whiteboard-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'whiteboard-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "LUMI whiteboard assets delete own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'whiteboard-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
