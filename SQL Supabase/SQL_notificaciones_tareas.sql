-- =========================================================
-- LUMI AI - ID DE NOTIFICACIÓN POR TAREA
-- Permite cancelar/reprogramar recordatorios sin duplicarlos
-- =========================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS notification_id TEXT;
