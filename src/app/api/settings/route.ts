import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings - Get public system settings
 */
export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value, boolean_value')
      .in('setting_key', ['nominations_enabled', 'nominations_close_message']);

    if (error) throw error;

    // Convert to key-value object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.boolean_value !== null 
        ? setting.boolean_value 
        : setting.setting_value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      settings: settingsObject,
      nominations_enabled: settingsObject.nominations_enabled || false,
      nominations_close_message: settingsObject.nominations_close_message || 'Nominations are currently closed.'
    });

  } catch (error) {
    console.error('GET /api/settings error:', error);
    
    // Return default values if database is not available
    return NextResponse.json({
      success: false,
      settings: {
        nominations_enabled: true, // Default to enabled if can't check
        nominations_close_message: 'Thank you for your interest! Nominations are now closed.'
      },
      nominations_enabled: true,
      nominations_close_message: 'Thank you for your interest! Nominations are now closed.',
      error: 'Could not fetch settings from database'
    });
  }
}