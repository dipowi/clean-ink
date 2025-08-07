-- Create absensup table for keeping database active
CREATE TABLE public.absensup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.absensup ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is just for keeping DB active)
CREATE POLICY "Anyone can view absensup data" 
ON public.absensup 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert absensup data" 
ON public.absensup 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete absensup data" 
ON public.absensup 
FOR DELETE 
USING (true);