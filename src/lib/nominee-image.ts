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
  const name = nominee.name || nominee.displayName || nomination.displayName || nomination.name || 'Unknown';
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('getNomineeImage debug:', {
      name,
      type: nomination.type,
      nominationImageUrl: nomination.imageUrl,
      nomineeImageUrl: nominee.imageUrl,
      headshotUrl: nominee.headshotUrl,
      logoUrl: nominee.logoUrl,
      headshotBase64: nominee.headshotBase64 ? 'present' : 'missing',
      logoBase64: nominee.logoBase64 ? 'present' : 'missing'
    });
  }
  
  // Priority 1: Check nomination-level imageUrl (from API)
  if (nomination.imageUrl && nomination.imageUrl.trim()) {
    return {
      src: nomination.imageUrl,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  // Priority 2: Check nominee-level imageUrl
  if (nominee.imageUrl && nominee.imageUrl.trim()) {
    return {
      src: nominee.imageUrl,
      isInitials: false,
      alt: `${name} - ${nomination.category}`
    };
  }
  
  // Priority 3: Check type-specific URLs
  if (nomination.type === "person") {
    // Check headshotUrl variations
    const headshotUrl = nominee.headshotUrl || nominee.headshot_url || (nominee as any).personHeadshotUrl;
    if (headshotUrl && headshotUrl.trim()) {
      return {
        src: headshotUrl,
        isInitials: false,
        alt: `${name} - ${nomination.category}`
      };
    }
    
    // Check base64 headshot
    if ("headshotBase64" in nominee && nominee.headshotBase64) {
      return {
        src: nominee.headshotBase64,
        isInitials: false,
        alt: `${name} - ${nomination.category}`
      };
    }
  } else if (nomination.type === "company") {
    // Check logoUrl variations
    const logoUrl = nominee.logoUrl || nominee.logo_url || (nominee as any).companyLogoUrl;
    if (logoUrl && logoUrl.trim()) {
      return {
        src: logoUrl,
        isInitials: false,
        alt: `${name} - ${nomination.category}`
      };
    }
    
    // Check base64 logo
    if ("logoBase64" in nominee && nominee.logoBase64) {
      return {
        src: nominee.logoBase64,
        isInitials: false,
        alt: `${name} - ${nomination.category}`
      };
    }
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
  const safeName = name || 'Unknown';
  const initials = safeName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  // Generate a consistent color based on name hash
  const hash = safeName.split('').reduce((a, b) => {
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
          alt: `${safeName} initials - ${category}`
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
    alt: `${safeName} initials - ${category}`
  };
}