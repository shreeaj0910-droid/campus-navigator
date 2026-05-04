
-- Create professors table
CREATE TABLE public.professors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  coord_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  coord_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy')),
  current_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create floor_plans table
CREATE TABLE public.floor_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for professors (public map needs this)
CREATE POLICY "Anyone can view professors" ON public.professors FOR SELECT USING (true);

-- Authenticated users can manage professors
CREATE POLICY "Authenticated users can insert professors" ON public.professors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update professors" ON public.professors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete professors" ON public.professors FOR DELETE TO authenticated USING (true);

-- Public read access for floor plans
CREATE POLICY "Anyone can view floor plans" ON public.floor_plans FOR SELECT USING (true);

-- Authenticated users can manage floor plans
CREATE POLICY "Authenticated users can insert floor plans" ON public.floor_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update floor plans" ON public.floor_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete floor plans" ON public.floor_plans FOR DELETE TO authenticated USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professors_updated_at
  BEFORE UPDATE ON public.professors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for professors table
ALTER PUBLICATION supabase_realtime ADD TABLE public.professors;

-- Create storage bucket for floor plans
INSERT INTO storage.buckets (id, name, "public") VALUES ('floor-plans', 'floor-plans', true);

-- Storage policies
CREATE POLICY "Floor plan images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'floor-plans');
CREATE POLICY "Authenticated users can upload floor plans" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'floor-plans');
CREATE POLICY "Authenticated users can update floor plans" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'floor-plans');
CREATE POLICY "Authenticated users can delete floor plans" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'floor-plans');
