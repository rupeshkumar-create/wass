import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings - Get system settings
 */
export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;

    // Convert to key-value object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        updated_at: setting.updated_at
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      settings: settingsObject
    });

  } catch (error) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings - Update system settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value, updated_by = 'admin' } = body;

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: 'setting_key and setting_value are required' },
        { status: 400 }
      );
    }

    // Update the setting
    const { data: updatedSetting, error } = await supabaseAdmin
      .from('system_settings')
      .update({
        setting_value: String(setting_value),
        updated_by,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', setting_key)
      .select()
      .single();

    if (error) throw error;

    console.log(`System setting updated: ${setting_key} = ${setting_value}`);

    return NextResponse.json({
      success: true,
      setting: updatedSetting,
      message: `Setting '${setting_key}' updated successfully`
    });

  } catch (error) {
    console.error('PATCH /api/admin/settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update setting' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings - Create new system setting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value, description, updated_by = 'admin' } = body;

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: 'setting_key and setting_value are required' },
        { status: 400 }
      );
    }

    // Create new setting
    const { data: newSetting, error } = await supabaseAdmin
      .from('system_settings')
      .insert({
        setting_key,
        setting_value: String(setting_value),
        description,
        updated_by
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`System setting created: ${setting_key} = ${setting_value}`);

    return NextResponse.json({
      success: true,
      setting: newSetting,
      message: `Setting '${setting_key}' created successfully`
    });

  } catch (error) {
    console.error('POST /api/admin/settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create setting' },
      { status: 500 }
    );
  }
}