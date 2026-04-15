export function isClickConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}
