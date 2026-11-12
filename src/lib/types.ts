export type LoadStatus = 'loading' | 'ready' | 'error';

export interface Professor {
  id: string;
  name: string;
}

export interface Slot {
  id: string;
  starts_at: string;
  booked: boolean;
  professor_id: string | null;
  professor_name: string | null;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export type AppointmentStatus = 'pending' | 'approved';

export interface Appointment {
  id: string;
  slot_id: string;
  client_name: string;
  client_phone: string;
  status: AppointmentStatus;
  created_at: string;
  availability_slots: { starts_at: string } | null;
}
