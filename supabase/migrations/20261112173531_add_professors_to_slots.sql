/*
# Professors and professor assignment for time slots

1. New Tables
- `professors`: teachers who attend appointments.
  - `id` (uuid, primary key)
  - `name` (text, required, max 100 chars)
  - `created_at` (timestamptz)

2. Modified Tables
- `availability_slots`: new `professor_id` column (optional) pointing to the professor who will attend that slot.
  - Deleting a professor leaves their slots without a professor instead of deleting them.

3. Security
- RLS enabled on `professors`.
- Visitors (anon) and the administrator can read professors. Only the administrator (authenticated) can add or remove them.
- Only the administrator can change a slot's professor; the column is granted on its own so no other slot data can be changed this way.

4. Notes
- Statements are idempotent so this migration can be safely re-applied.
- No existing slots or appointments are modified or removed.
*/

CREATE TABLE IF NOT EXISTS professors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE professors ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON professors TO anon, authenticated;
GRANT INSERT, DELETE ON professors TO authenticated;

DROP POLICY IF EXISTS "public_select_professors" ON professors;
CREATE POLICY "public_select_professors" ON professors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_professors" ON professors;
CREATE POLICY "admin_insert_professors" ON professors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_professors" ON professors;
CREATE POLICY "admin_delete_professors" ON professors FOR DELETE
  TO authenticated USING (true);

ALTER TABLE availability_slots
  ADD COLUMN IF NOT EXISTS professor_id uuid REFERENCES professors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS availability_slots_professor_id_idx ON availability_slots (professor_id);

GRANT UPDATE (professor_id) ON availability_slots TO authenticated;

DROP POLICY IF EXISTS "admin_update_slots" ON availability_slots;
CREATE POLICY "admin_update_slots" ON availability_slots FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
