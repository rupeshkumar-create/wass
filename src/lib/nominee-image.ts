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
  
  // Check for uploaded image URL (admin-uploaded or form-uploaded)
  if (nomination.imageUrl && nomination.imageUrl.trim()) {
    return {
      src: nomination.imageUrl,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  // Fallback to nominee imageUrl for backward compatibility
  if (nominee.imageUrl && nominee.imageUrl.trim()) {
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
  
  // No image found - return initials avatar
  return getInitialsAvatar(name, nomination.category);
}

/**
 * Generate an initials avatar for nominees without photos
 */
function getInitialsAvatar(name: string, category: string): {
  src: string;
  isInitials: boolean;
  alt: string;
} {
  // Generate initials
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
    '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', 
    '#F59E0B', '#6366F1', '#EC4899', '#14B8A6'
  ];
  
  const backgroundColor = colors[Math.abs(hash) % colors.length];
  
  // Try to create canvas-based avatar for client-side
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Background
        ctx.fillStyle = backgroundColor;
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
          alt: `${name} initials - ${category}`
        };
      }
    } catch (error) {
      // Canvas creation failed, fall through to external service
    }
  }
  
  // Server-side or canvas failed - use external avatar service
  const bgColor = backgroundColor.replace('#', '');
  return {
    src: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=256&background=${bgColor}&color=fff&bold=true&format=png`,
    isInitials: true,
    alt: `${name} initials - ${category}`
  };
}