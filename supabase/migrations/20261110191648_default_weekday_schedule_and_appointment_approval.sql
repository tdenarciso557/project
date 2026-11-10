/*
# Default weekday schedule and appointment approval

1. New Tables
- `schedule_generated_days`: records which calendar days already received their default slots, so slots the administrator removes are not recreated.
  - `day` (date, primary key)

2. Modified Tables
- `appointments`: new `status` column.
  - Values: `pending` (requested by a visitor, waiting for approval) or `approved`.
  - Existing bookings are marked `approved`.

3. Functions and triggers
- `ensure_default_slots()`: creates the default slots for the next 60 days, Monday to Friday, at 07:30, 08:30, 09:30, 10:30, 13:00, 14:00, 15:00 and 16:00 (Brasilia time). Days already processed are skipped, and past times are never created.
- `enforce_future_booking`: rejects a booking when the slot is in the past or already taken.

4. Security
- RLS enabled on `schedule_generated_days` with no public access.
- Visitors (anon) can only insert an appointment with slot, name and phone. They cannot set the status or read or change other appointments.
- The administrator (authenticated) can update the status of appointments.
- Visitors and the administrator can call `ensure_default_slots()`.

4. Notes
- A requested slot is locked immediately because the existing booking trigger marks it as booked.
- Rejecting a request deletes the appointment, which frees the slot again.
- Statements are idempotent so this migration can be safely re-applied.
*/

CREATE TABLE IF NOT EXISTS schedule_generated_days (
  day date PRIMARY KEY
);

ALTER TABLE schedule_generated_days ENABLE ROW LEVEL SECURITY;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status text;

UPDATE appointments SET status = 'approved' WHERE status IS NULL;

ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE appointments ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'approved'));
  END IF;
END $$;

REVOKE ALL ON appointments FROM anon;
REVOKE ALL ON appointments FROM authenticated;
GRANT INSERT (slot_id, client_name, client_phone) ON appointments TO anon;
GRANT SELECT, DELETE ON appointments TO authenticated;
GRANT UPDATE (status) ON appointments TO authenticated;

DROP POLICY IF EXISTS "admin_update_appointments" ON appointments;
CREATE POLICY "admin_update_appointments" ON appointments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.enforce_future_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.availability_slots s
    WHERE s.id = NEW.slot_id AND s.starts_at > now() AND NOT s.booked
  ) THEN
    RAISE EXCEPTION 'Este horário não está mais disponível.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_future_booking() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_future_booking ON appointments;
CREATE TRIGGER enforce_future_booking
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_future_booking();

CREATE OR REPLACE FUNCTION public.ensure_default_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_day date;
  v_time time;
  v_starts timestamptz;
  v_times time[] := ARRAY['07:30', '08:30', '09:30', '10:30', '13:00', '14:00', '15:00', '16:00']::time[];
BEGIN
  FOR v_day IN SELECT v_today + g FROM generate_series(0, 60) AS g LOOP
    CONTINUE WHEN EXTRACT(ISODOW FROM v_day) > 5;
    CONTINUE WHEN EXISTS (SELECT 1 FROM public.schedule_generated_days d WHERE d.day = v_day);

    FOREACH v_time IN ARRAY v_times LOOP
      v_starts := (v_day + v_time) AT TIME ZONE 'America/Sao_Paulo';
      IF v_starts > now() THEN
        INSERT INTO public.availability_slots (starts_at)
        VALUES (v_starts)
        ON CONFLICT (starts_at) DO NOTHING;
      END IF;
    END LOOP;

    INSERT INTO public.schedule_generated_days (day) VALUES (v_day)
    ON CONFLICT (day) DO NOTHING;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_default_slots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_default_slots() TO anon, authenticated;
