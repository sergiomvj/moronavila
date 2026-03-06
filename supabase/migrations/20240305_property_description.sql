-- Create property_description table
CREATE TABLE IF NOT EXISTS public.property_description (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_text TEXT DEFAULT '',
    main_media TEXT[] DEFAULT '{}',
    gallery_media TEXT[] DEFAULT '{}',
    rooms_text TEXT DEFAULT '',
    location_text TEXT DEFAULT '',
    location_media TEXT[] DEFAULT '{}',
    amenities_text TEXT DEFAULT '',
    amenities_media TEXT[] DEFAULT '{}',
    rules_text TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.property_description ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access for property_description"
ON public.property_description FOR SELECT
USING (true);

CREATE POLICY "Allow admin to update property_description"
ON public.property_description FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.residents
        WHERE auth_id = auth.uid() AND role = 'Administrador'
    )
);

-- Insert initial record if not exists
INSERT INTO public.property_description (main_text)
SELECT 'Bem-vindo ao MoronaVila'
WHERE NOT EXISTS (SELECT 1 FROM public.property_description);
