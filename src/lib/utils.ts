import { z } from 'zod';
import { createClient } from './supabase/client';
import type { Database } from './database.types';

export const generateRepairId = async (): Promise<string> => {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any).rpc('get_next_repair_id');

    if (error) {
      console.error('Error generating repair ID:', error);
      // Fallback to old system if database function fails
      return 'REP' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Extract id from JSON response: {"id": "2025-0002"} -> "2025-0002"
    if (data && typeof data === 'object' && 'id' in data) {
      return (data as any).id as string;
    }

    // Fallback if data format is unexpected
    return 'REP' + Math.random().toString(36).substr(2, 9).toUpperCase();
  } catch (err) {
    console.error('Error generating repair ID:', err);
    // Fallback to old system if database function fails
    return 'REP' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
};

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

export const repairSchema = z.object({
  repair_id: z.string(),
  device_type: z.string().min(1, 'Device type is required'),
  device_model: z.string().min(1, 'Device model is required'),
  issue_description: z.string().min(1, 'Issue description is required'),
});

export const diagnosticSchema = z.object({
  repair_id: z.string(),
  estimated_time: z.number().min(0).nullable(),
  required_parts: z.string().nullable(),
  notes: z.string().nullable(),
});

export type PaymentMethod = 'cash' | 'card';

export const getPaymentMethodLabel = (method: PaymentMethod | string): string => {
  switch (method) {
    case 'cash':
      return 'Naqd';
    case 'card':
      return 'Karta orqali';
    default:
      return method; // Return original value if not recognized
  }
};

export const paymentSchema = z.object({
  repair_id: z.string(),
  amount: z.number().min(0),
  payment_method: z.enum(['cash', 'card'], {
    message: 'Payment method must be cash or card'
  } as any),
  notes: z.string().nullable(),
});

export const completionSchema = z.object({
  checklist_completed: z.boolean(),
  notes: z.string().nullable(),
  notification_sent: z.boolean(),
});

// Format phone number as +998 xx xxx xx xx
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters except the leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with +998, format as +998 xx xxx xx xx
  if (cleaned.startsWith('+998') && cleaned.length === 13) {
    // +998 90 123 45 67
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 11)} ${cleaned.substring(11, 13)}`;
  }

  // If it starts with 998 (without +), add + and format
  if (cleaned.startsWith('998') && cleaned.length === 12) {
    const withPlus = '+' + cleaned;
    return `${withPlus.substring(0, 4)} ${withPlus.substring(4, 6)} ${withPlus.substring(6, 9)} ${withPlus.substring(9, 11)} ${withPlus.substring(11, 13)}`;
  }

  // Return original if format doesn't match
  return phone;
};

// Format date as dd.mm.yyyy HH:mm
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

type RepairRow = Database['public']['Tables']['repairs']['Row'];
type DiagnosticRow = Database['public']['Tables']['diagnostics']['Row'];
type CompletionRecordRow = Database['public']['Tables']['completion_records']['Row'];
type RepairStatusHistoryRow = Database['public']['Tables']['repair_status_history']['Row'];

export type RepairStageDates = {
  accepted?: string;
  diagnosed?: string;
  fixed?: string;
  picked?: string;
  cancelled?: string;
};

export const getRepairStageDates = (
  repair: RepairRow,
  diagnostic?: DiagnosticRow[],
  completionRecord?: CompletionRecordRow | null,
  statusHistory?: RepairStatusHistoryRow[] | null
): RepairStageDates => {
  // Prefer precise timestamps from status history when available
  let accepted: string | undefined;
  let diagnosed: string | undefined;
  let fixed: string | undefined;
  let picked: string | undefined;
  let cancelled: string | undefined;

  if (statusHistory && statusHistory.length > 0) {
    // Sort by changed_at ascending and take the first occurrence for each status
    const sorted = [...statusHistory].sort(
      (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );

    const firstForStatus = (status: RepairStatusHistoryRow['status']) =>
      sorted.find((h) => h.status === status)?.changed_at;

    accepted = firstForStatus('accepted');
    diagnosed = firstForStatus('diagnosed');
    fixed = firstForStatus('fixed');
    picked = firstForStatus('picked');
    cancelled = firstForStatus('cancelled');
  }

  // Fallbacks to current implementation when history is missing
  if (!accepted) {
    accepted = repair.created_at;
  }

  if (!diagnosed) {
    diagnosed =
      diagnostic && diagnostic.length > 0
        ? diagnostic
            .slice()
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )[0].created_at
        : undefined;
  }

  // Best available timestamp for "fixed" is completion record time (created when marking fixed)
  if (!fixed) {
    fixed = completionRecord?.completed_at ?? undefined;
  }

  // We don't have a dedicated picked_at column; when status is picked, updated_at is the best available timestamp
  if (!picked) {
    picked = repair.status === 'picked' ? repair.updated_at : undefined;
  }

  // When status is cancelled, updated_at is the best available timestamp
  if (!cancelled) {
    cancelled = repair.status === 'cancelled' ? repair.updated_at : undefined;
  }

  return { accepted, diagnosed, fixed, picked, cancelled };
};
