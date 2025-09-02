import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

interface DeadlineUpdateRequest {
  deadline?: string | null; // ISO date string or null to remove deadline
  nominationsOpen?: boolean;
  votingOnlyMode?: boolean;
  updatedBy?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin (for detailed settings) or allow public access for basic status
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = !!user;

    // Get current settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value, setting_type, description, updated_at, updated_by')
      .in('setting_key', [
        'nomination_deadline',
        'nominations_open', 
        'voting_only_mode',
        'bulk_upload_enabled',
        'auto_approve_bulk_uploads'
      ])
      .eq('is_active', true);

    if (settingsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch settings' 
      }, { status: 500 });
    }

    // Convert array to object for easier access
    const settingsMap = (settings || []).reduce((acc, setting) => {
      let value = setting.setting_value;
      
      // Convert string values to appropriate types
      if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'date' && value) {
        value = new Date(value).toISOString();
      }
      
      acc[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        updatedAt: setting.updated_at,
        updatedBy: setting.updated_by
      };
      return acc;
    }, {} as any);

    // Check if nominations are currently open
    const { data: nominationsOpenResult } = await supabase.rpc('are_nominations_open');
    const areNominationsOpen = nominationsOpenResult || false;

    // Calculate deadline status
    const deadline = settingsMap.nomination_deadline?.value;
    let deadlineStatus = 'no_deadline';
    let timeRemaining = null;
    
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      
      if (now > deadlineDate) {
        deadlineStatus = 'expired';
      } else {
        deadlineStatus = 'active';
        timeRemaining = {
          milliseconds: deadlineDate.getTime() - now.getTime(),
          days: Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          hours: Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
          minutes: Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60))
        };
      }
    }

    const response = {
      nominationsOpen: areNominationsOpen,
      deadlineStatus,
      timeRemaining,
      deadline: deadline || null,
      votingOnlyMode: settingsMap.voting_only_mode?.value || false
    };

    // Add admin-only details
    if (isAdmin) {
      response.adminSettings = {
        bulkUploadEnabled: settingsMap.bulk_upload_enabled?.value || false,
        autoApproveBulkUploads: settingsMap.auto_approve_bulk_uploads?.value || false,
        allSettings: settingsMap
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Deadline GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeadlineUpdateRequest = await request.json();
    const { deadline, nominationsOpen, votingOnlyMode, updatedBy } = body;
    const updaterEmail = updatedBy || user.email || 'unknown';

    const updates: Array<{ key: string; value: string; type: string }> = [];

    // Validate and prepare updates
    if (deadline !== undefined) {
      if (deadline === null) {
        updates.push({ key: 'nomination_deadline', value: '', type: 'date' });
      } else {
        // Validate date format
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
          return NextResponse.json({ 
            error: 'Invalid deadline date format' 
          }, { status: 400 });
        }
        
        // Check if deadline is in the future
        if (deadlineDate <= new Date()) {
          return NextResponse.json({ 
            error: 'Deadline must be in the future' 
          }, { status: 400 });
        }
        
        updates.push({ key: 'nomination_deadline', value: deadlineDate.toISOString(), type: 'date' });
      }
    }

    if (nominationsOpen !== undefined) {
      updates.push({ key: 'nominations_open', value: nominationsOpen.toString(), type: 'boolean' });
    }

    if (votingOnlyMode !== undefined) {
      updates.push({ key: 'voting_only_mode', value: votingOnlyMode.toString(), type: 'boolean' });
      
      // If enabling voting only mode, also close nominations
      if (votingOnlyMode) {
        updates.push({ key: 'nominations_open', value: 'false', type: 'boolean' });
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ 
        error: 'No valid updates provided' 
      }, { status: 400 });
    }

    // Apply updates
    const updateResults = [];
    for (const update of updates) {
      const { data, error } = await supabase.rpc('update_app_setting', {
        p_setting_key: update.key,
        p_setting_value: update.value,
        p_updated_by: updaterEmail
      });

      if (error) {
        console.error(`Failed to update ${update.key}:`, error);
        return NextResponse.json({ 
          error: `Failed to update ${update.key}: ${error.message}` 
        }, { status: 500 });
      }

      updateResults.push({
        key: update.key,
        value: update.value,
        success: true
      });
    }

    // Get updated status
    const { data: nominationsOpenResult } = await supabase.rpc('are_nominations_open');
    const areNominationsOpen = nominationsOpenResult || false;

    // Log the change for audit purposes
    console.log(`Nomination settings updated by ${updaterEmail}:`, updateResults);

    return NextResponse.json({
      success: true,
      updates: updateResults,
      currentStatus: {
        nominationsOpen: areNominationsOpen,
        deadline: updates.find(u => u.key === 'nomination_deadline')?.value || undefined,
        votingOnlyMode: updates.find(u => u.key === 'voting_only_mode')?.value === 'true' || undefined
      },
      message: 'Nomination deadline settings updated successfully'
    });

  } catch (error) {
    console.error('Deadline POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT endpoint for batch settings update
export async function PUT(request: NextRequest) {
  try {
    // Use the imported supabase client
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings, updatedBy } = body;
    const updaterEmail = updatedBy || user.email || 'unknown';

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ 
        error: 'Settings object is required' 
      }, { status: 400 });
    }

    const allowedSettings = [
      'nomination_deadline',
      'nominations_open',
      'voting_only_mode',
      'bulk_upload_enabled',
      'auto_approve_bulk_uploads'
    ];

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      if (!allowedSettings.includes(key)) {
        return NextResponse.json({ 
          error: `Invalid setting key: ${key}` 
        }, { status: 400 });
      }

      let stringValue: string;
      if (key === 'nomination_deadline') {
        if (value === null || value === '') {
          stringValue = '';
        } else {
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            return NextResponse.json({ 
              error: `Invalid date format for ${key}` 
            }, { status: 400 });
          }
          stringValue = date.toISOString();
        }
      } else {
        stringValue = String(value);
      }

      updates.push({ key, value: stringValue });
    }

    // Apply all updates
    const results = [];
    for (const update of updates) {
      const { error } = await supabase.rpc('update_app_setting', {
        p_setting_key: update.key,
        p_setting_value: update.value,
        p_updated_by: updaterEmail
      });

      if (error) {
        return NextResponse.json({ 
          error: `Failed to update ${update.key}: ${error.message}` 
        }, { status: 500 });
      }

      results.push(update);
    }

    return NextResponse.json({
      success: true,
      updatedSettings: results,
      message: `${results.length} settings updated successfully`
    });

  } catch (error) {
    console.error('Deadline PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}