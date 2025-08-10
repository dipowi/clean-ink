-- Enable required extensions for scheduling and HTTP requests
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove existing job with the same name if it exists
select cron.unschedule(jobid)
from cron.job
where jobname = 'absensup-keepalive-daily';

-- Schedule daily job at 02:00 UTC to invoke the edge function
select
  cron.schedule(
    'absensup-keepalive-daily',
    '0 2 * * *',
    $$
    select
      net.http_post(
          url:='https://xzgjrzlzhplxxppddubh.supabase.co/functions/v1/absensup-keepalive',
          headers:=jsonb_build_object(
            'Content-Type','application/json',
            'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z2pyemx6aHBseHhwcGRkdWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDU2ODksImV4cCI6MjA3MDEyMTY4OX0.AhdDHgD-x7wBNXruW5Fuvtz-EpdKUYPayMFZ4AmXNzk'
          ),
          body:='{"trigger":"cron"}'::jsonb
      ) as request_id;
    $$
  );