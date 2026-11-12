import type { Slot } from '@/lib/types';

export const SLOT_COLUMNS = 'id, starts_at, booked, professor_id, professors(name)';

export interface SlotRow {
  id: string;
  starts_at: string;
  booked: boolean;
  professor_id: string | null;
  professors: { name: string } | null;
}

export function toSlot(row: SlotRow): Slot {
  return {
    id: row.id,
    starts_at: row.starts_at,
    booked: row.booked,
    professor_id: row.professor_id,
    professor_name: row.professors?.name ?? null,
  };
}
