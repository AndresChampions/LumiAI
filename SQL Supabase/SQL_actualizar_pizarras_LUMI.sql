-- =========================================================
-- LUMI AI - ACTUALIZACIÓN DE PIZARRAS
-- Permite varias pizarras por usuario
-- =========================================================

-- 1) Cada pizarra ahora puede tener nombre
ALTER TABLE public.whiteboards
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Mi pizarra';

-- 2) Antes había una sola pizarra por usuario.
-- Quitamos esa restricción para permitir varias.
ALTER TABLE public.whiteboards
DROP CONSTRAINT IF EXISTS whiteboards_user_id_key;

-- 3) Índice para cargar rápido las pizarras de cada usuario
CREATE INDEX IF NOT EXISTS whiteboards_user_id_idx
ON public.whiteboards(user_id);

-- RLS permanece activo
ALTER TABLE public.whiteboards
ENABLE ROW LEVEL SECURITY;

-- Recreamos las políticas de forma segura
DROP POLICY IF EXISTS "LUMI whiteboards select own"
ON public.whiteboards;

DROP POLICY IF EXISTS "LUMI whiteboards insert own"
ON public.whiteboards;

DROP POLICY IF EXISTS "LUMI whiteboards update own"
ON public.whiteboards;

DROP POLICY IF EXISTS "LUMI whiteboards delete own"
ON public.whiteboards;

CREATE POLICY "LUMI whiteboards select own"
ON public.whiteboards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "LUMI whiteboards insert own"
ON public.whiteboards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "LUMI whiteboards update own"
ON public.whiteboards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "LUMI whiteboards delete own"
ON public.whiteboards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
