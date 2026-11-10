/*
# Scheduling, availability, notices and single-admin rule

1. New Tables
- `availability_slots`: time slots the admin opens for booking.
  - `id` (uuid, primary key)
  - `starts_at` (timestamptz, unique) - start of the slot
  - `booked` (boolean) - kept in sync automatically when an appointment is created or removed
  - `created_at` (timestamptz)
- `appointments`: a booking made by a visitor for one slot.
  - `id` (uuid, primary key)
  - `slot_id` (uuid, unique, references availability_slots) - one booking per slot
  - `client_name` (text, required, max 100 chars)
  - `client_phone` (text, required, max 30 chars)
  - `created_at` (timestamptz)
- `notices`: announcements shown on the public page.
  - `id` (uuid, primary key)
  - `title` (text, required, max 150 chars)
  - `body` (text, required, max 2000 chars)
  - `created_at` (timestamptz)

2. Triggers and functions
- Creating an appointment marks its slot as booked; deleting it frees the slot again.
- A slot that has an appointment cannot be deleted (protects visitor bookings).
- Only one account can ever exist in the authentication table, so the single administrator is enforced by the database itself.
- `admin_exists()` lets the login page know whether the administrator account has already been created.

3. Security
- Row level security enabled on all three tables.
- Public visitors can read slots and notices, and can create appointments. They cannot read other people's appointments.
- Only the administrator (signed-in user) can add or remove slots, read and cancel appointments, and manage notices.

4. Notes
- Statements are idempotent so this migration can be safely re-applied.
- No existing data is modified or removed.
*/

CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL UNIQUE,
  booked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL UNIQUE REFERENCES availability_slots(id) ON DELETE RESTRICT,
  client_name text NOT NULL CHECK (char_length(trim(client_name)) BETWEEN 1 AND 100),
  client_phone text NOT NULL CHECK (char_length(trim(client_phone)) BETWEEN 1 AND 30),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 150),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON availability_slots TO anon, authenticated;
GRANT INSERT, DELETE ON availability_slots TO authenticated;
GRANT INSERT ON appointments TO anon;
GRANT SELECT, DELETE ON appointments TO authenticated;
GRANT SELECT ON notices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON notices TO authenticated;

DROP POLICY IF EXISTS "public_select_slots" ON availability_slots;
CREATE POLICY "public_select_slots" ON availability_slots FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_slots" ON availability_slots;
CREATE POLICY "admin_insert_slots" ON availability_slots FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_slots" ON availability_slots;
CREATE POLICY "admin_delete_slots" ON availability_slots FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_book_appointment" ON appointments;
CREATE POLICY "public_book_appointment" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_appointments" ON appointments;
CREATE POLICY "admin_select_appointments" ON appointments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_delete_appointments" ON appointments;
CREATE POLICY "admin_delete_appointments" ON appointments FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_notices" ON notices;
CREATE POLICY "public_select_notices" ON notices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_notices" ON notices;
CREATE POLICY "admin_insert_notices" ON notices FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_notices" ON notices;
CREATE POLICY "admin_update_notices" ON notices FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_notices" ON notices;
CREATE POLICY "admin_delete_notices" ON notices FOR DELETE
  TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.mark_slot_booked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.availability_slots SET booked = true WHERE id = NEW.slot_id;
    RETURN NEW;
  END IF;
  UPDATE public.availability_slots SET booked = false WHERE id = OLD.slot_id;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_slot_booked() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS mark_slot_booked_on_insert ON appointments;
CREATE TRIGGER mark_slot_booked_on_insert
  AFTER INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.mark_slot_booked();

DROP TRIGGER IF EXISTS mark_slot_free_on_delete ON appointments;
CREATE TRIGGER mark_slot_free_on_delete
  AFTER DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.mark_slot_booked();

CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users) THEN
    RAISE EXCEPTION 'Ja existe um administrador cadastrado.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_single_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_single_admin ON auth.users;
CREATE TRIGGER enforce_single_admin
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users);
$$;

REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;
