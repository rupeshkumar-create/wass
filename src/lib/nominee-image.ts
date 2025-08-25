import { Nomination } from "./types";

/**
 * Get the nominee image URL with fallback to initials avatar
 * Single source of truth for all nominee image rendering
 */
export function getNomineeImage(nomination: Nomination): {
  src: string;
  isInitials: boolean;
  alt: string;
} {
  const nominee = nomination.nominee;
  const name = nominee.name;
  
  // Prefer image_url (Supabase Storage) over legacy base64
  if (nomination.imageUrl) {
    return {
      src: nomination.imageUrl,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  // Fallback to nominee imageUrl for backward compatibility
  if (nominee.imageUrl) {
    return {
      src: nominee.imageUrl,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  // Legacy fallback for backward compatibility
  if (nomination.type === "person" && "headshotBase64" in nominee && nominee.headshotBase64) {
    return {
      src: nominee.headshotBase64,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  if (nomination.type === "company" && "logoBase64" in nominee && nominee.logoBase64) {
    return {
      src: nominee.logoBase64,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  // Generate initials avatar as fallback
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  // Generate a consistent color based on name hash
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
    'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
  ];
  
  const colorClass = colors[Math.abs(hash) % colors.length];
  
  // Return data URL for initials avatar
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (canvas) {
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background color
      const colorMap: Record<string, string> = {
        'bg-blue-500': '#3B82F6',
        'bg-green-500': '#10B981',
        'bg-purple-500': '#8B5CF6',
        'bg-red-500': '#EF4444',
        'bg-yellow-500': '#F59E0B',
        'bg-indigo-500': '#6366F1',
        'bg-pink-500': '#EC4899',
        'bg-teal-500': '#14B8A6'
      };
      
      ctx.fillStyle = colorMap[colorClass] || '#6B7280';
      ctx.fillRect(0, 0, 256, 256);
      
      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 96px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, 128, 128);
      
      return {
        src: canvas.toDataURL(),
        isInitials: true,
        alt: `${name} initials - ${nomination.category}`
      };
    }
  }
  
  // Server-side fallback - return a placeholder URL
  return {
    src: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=256&background=${colorClass.replace('bg-', '').replace('-500', '')}&color=fff&bold=true`,
    isInitials: true,
    alt: `${name} initials - ${nomination.category}`
  };
}