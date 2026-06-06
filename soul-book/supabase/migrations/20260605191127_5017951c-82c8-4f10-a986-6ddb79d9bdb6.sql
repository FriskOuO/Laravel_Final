
CREATE TABLE public.diaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  mood TEXT NOT NULL DEFAULT 'neutral',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diaries_user_date ON public.diaries(user_id, entry_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diaries TO authenticated;
GRANT ALL ON public.diaries TO service_role;

ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own diaries" ON public.diaries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diaries" ON public.diaries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own diaries" ON public.diaries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own diaries" ON public.diaries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER diaries_updated_at BEFORE UPDATE ON public.diaries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
