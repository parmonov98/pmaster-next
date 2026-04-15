export function isPaymeConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}
