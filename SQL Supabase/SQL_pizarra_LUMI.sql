-- =========================================================
-- LUMI AI - PIZARRA PERSONAL
-- Una pizarra persistente por usuario
-- =========================================================

CREATE TABLE IF NOT EXISTS public.whiteboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  drawing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whiteboards
ENABLE ROW LEVEL SECURITY;

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
