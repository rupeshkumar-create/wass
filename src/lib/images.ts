export function nomineeImageUrl(src?: string | null, fallbackText?: string) {
  if (src && src.startsWith('http')) return src;
  return ''; // callers fall back to initials avatar
}

// Legacy helper for backward compatibility
export function getNomineeImageUrl(n: { image_url?: string | null; nominee?: any; }) {
  // preferred: stored Supabase public URL
  if (n && (n as any).image_url) return (n as any).image_url as string;
  if (n && n.nominee && (n.nominee.headshotBase64 || n.nominee.logoBase64)) {
    // historical fallback: these are actually URLs now in our mapping
    return n.nominee.headshotBase64 || n.nominee.logoBase64 || "";
  }
  return ""; // component will fall back to initials avatar
}