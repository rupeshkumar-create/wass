"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Users,
  Vote,
  RefreshCw
} from 'lucide-react';

interface NominationDeadlinePanelProps {
  onSettingsUpdate?: () => void;
}

interface DeadlineSettings {
  nominationsOpen: boolean;
  deadlineStatus: 'no_deadline' | 'active' | 'expired';
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  } | null;
  deadline: string | null;
  votingOnlyMode: boolean;
  adminSettings?: {
    bulkUploadEnabled: boolean;
    autoApproveBulkUploads: boolean;
  };
}

interface UpdateRequest {
  deadline?: string | null;
  nominationsOpen?: boolean;
  votingOnlyMode?: boolean;
}

export function NominationDeadlinePanel({ onSettingsUpdate }: NominationDeadlinePanelProps) {
  const [settings, setSettings] = useState<DeadlineSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [nominationsOpen, setNominationsOpen] = useState(true);
  const [votingOnlyMode, setVotingOnlyMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/nomination-deadline');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Update form state
        setNominationsOpen(data.nominationsOpen);
        setVotingOnlyMode(data.votingOnlyMode);
        
        if (data.deadline) {
          const deadlineDateTime = new Date(data.deadline);
          setDeadlineDate(deadlineDateTime.toISOString().split('T')[0]);
          setDeadlineTime(deadlineDateTime.toTimeString().slice(0, 5));
        } else {
          setDeadlineDate('');
          setDeadlineTime('23:59');
        }
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: UpdateRequest) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/nomination-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Settings updated successfully');
        await loadSettings();
        onSettingsUpdate?.();
      } else {
        throw new Error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDeadline = async () => {
    if (!deadlineDate) {
      setError('Please select a deadline date');
      return;
    }

    const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}`);
    
    if (deadlineDateTime <= new Date()) {
      setError('Deadline must be in the future');
      return;
    }

    await updateSettings({
      deadline: deadlineDateTime.toISOString()
    });
  };

  const handleRemoveDeadline = async () => {
    await updateSettings({
      deadline: null
    });
  };

  const handleToggleNominations = async (open: boolean) => {
    await updateSettings({
      nominationsOpen: open
    });
  };

  const handleToggleVotingOnly = async (votingOnly: boolean) => {
    await updateSettings({
      votingOnlyMode: votingOnly,
      nominationsOpen: !votingOnly // Close nominations if enabling voting only
    });
  };

  const getStatusBadge = () => {
    if (!settings) return null;

    if (settings.votingOnlyMode) {
      return <Badge className="bg-purple-100 text-purple-800">Voting Only Mode</Badge>;
    }

    if (settings.nominationsOpen) {
      if (settings.deadlineStatus === 'active') {
        return <Badge className="bg-green-100 text-green-800">Open (Deadline Set)</Badge>;
      }
      return <Badge className="bg-green-100 text-green-800">Open</Badge>;
    }

    if (settings.deadlineStatus === 'expired') {
      return <Badge className="bg-red-100 text-red-800">Closed (Deadline Expired)</Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
  };

  const formatTimeRemaining = () => {
    if (!settings?.timeRemaining) return null;

    const { days, hours, minutes } = settings.timeRemaining;
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Nomination Status
            </div>
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Current nomination and voting status for the World Staffing Awards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Users className={`h-8 w-8 ${settings?.nominationsOpen ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Nominations</p>
                <p className="text-sm text-gray-600">
                  {settings?.nominationsOpen ? 'Open' : 'Closed'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Vote className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Voting</p>
                <p className="text-sm text-gray-600">
                  {settings?.votingOnlyMode ? 'Only Mode' : 'Available'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className={`h-8 w-8 ${settings?.deadlineStatus === 'active' ? 'text-orange-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Deadline</p>
                <p className="text-sm text-gray-600">
                  {settings?.deadlineStatus === 'active' ? 'Set' : 
                   settings?.deadlineStatus === 'expired' ? 'Expired' : 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Deadline Info */}
          {settings?.deadline && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900">
                  Nomination Deadline: {new Date(settings.deadline).toLocaleString()}
                </p>
              </div>
              {settings.timeRemaining && (
                <p className="text-sm text-blue-800">
                  Time remaining: {formatTimeRemaining()}
                </p>
              )}
            </div>
          )}

          {/* Alerts */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deadline Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Deadline Management
          </CardTitle>
          <CardDescription>
            Set or modify the nomination deadline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline-date">Deadline Date</Label>
              <Input
                id="deadline-date"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline-time">Deadline Time</Label>
              <Input
                id="deadline-time"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSetDeadline}
              disabled={isSaving || !deadlineDate}
            >
              {isSaving ? 'Saving...' : 'Set Deadline'}
            </Button>
            {settings?.deadline && (
              <Button 
                variant="outline"
                onClick={handleRemoveDeadline}
                disabled={isSaving}
              >
                Remove Deadline
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Controls
          </CardTitle>
          <CardDescription>
            Quickly enable or disable nominations and voting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Accept Nominations</p>
              <p className="text-sm text-gray-600">
                Allow new nominations to be submitted
              </p>
            </div>
            <Switch
              checked={nominationsOpen}
              onCheckedChange={handleToggleNominations}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Voting Only Mode</p>
              <p className="text-sm text-gray-600">
                Close nominations and allow only voting
              </p>
            </div>
            <Switch
              checked={votingOnlyMode}
              onCheckedChange={handleToggleVotingOnly}
              disabled={isSaving}
            />
          </div>

          {/* Warning for voting only mode */}
          {votingOnlyMode && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <p className="font-medium">Voting Only Mode Active</p>
                <p className="text-sm">
                  Nominations are closed. Only voting is allowed. Users will see a message 
                  that nominations have ended.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Summary</CardTitle>
          <CardDescription>
            What users will see based on current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${settings?.nominationsOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="font-medium">
                  {settings?.nominationsOpen ? 'Nomination Form Available' : 'Nomination Form Hidden'}
                </p>
                <p className="text-sm text-gray-600">
                  {settings?.nominationsOpen 
                    ? 'Users can submit new nominations'
                    : 'Users cannot submit new nominations'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
              <div>
                <p className="font-medium">Voting Always Available</p>
                <p className="text-sm text-gray-600">
                  Users can vote for approved nominees
                </p>
              </div>
            </div>

            {settings?.deadline && (
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${settings.deadlineStatus === 'active' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-medium">
                    {settings.deadlineStatus === 'active' ? 'Deadline Countdown Visible' : 'Deadline Expired'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {settings.deadlineStatus === 'active'
                      ? 'Users see countdown timer until deadline'
                      : 'Nominations automatically closed due to expired deadline'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}