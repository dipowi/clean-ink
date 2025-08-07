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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_absensup_updated_at
BEFORE UPDATE ON public.absensup
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Setup cron job to run daily at 2 AM UTC
SELECT cron.schedule(
  'daily-absensup-keepalive',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://xzgjrzlzhplxxppddubh.supabase.co/functions/v1/absensup-keepalive',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z2pyemx6aHBseHhwcGRkdWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDU2ODksImV4cCI6MjA3MDEyMTY4OX0.AhdDHgD-x7wBNXruW5Fuvtz-EpdKUYPayMFZ4AmXNzk"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);