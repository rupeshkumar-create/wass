"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Save, Loader2, CheckCircle, XCircle } from "lucide-react";

interface NominationToggleProps {
  className?: string;
}

export function NominationToggle({ className }: NominationToggleProps) {
  const [nominationsEnabled, setNominationsEnabled] = useState(true);
  const [closeMessage, setCloseMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current settings
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const settings = result.settings;
          setNominationsEnabled(settings.nominations_enabled?.value === 'true');
          setCloseMessage(settings.nominations_close_message?.value || '');
        } else {
          throw new Error('Failed to fetch settings');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch settings`);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  // Update nomination status
  const updateNominationStatus = async (enabled: boolean) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          setting_key: 'nominations_enabled',
          setting_value: enabled ? 'true' : 'false'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNominationsEnabled(enabled);
          setSuccess(`Voting ${enabled ? 'enabled' : 'disabled'} successfully`);
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(result.error || 'Failed to update setting');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Failed to update setting`);
      }
    } catch (error) {
      console.error('Error updating nomination status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update setting');
      // Revert the toggle
      setNominationsEnabled(!enabled);
    } finally {
      setSaving(false);
    }
  };

  // Update close message
  const updateCloseMessage = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          setting_key: 'nominations_close_message',
          setting_value: closeMessage
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess('Close message updated successfully');
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(result.error || 'Failed to update message');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Failed to update message`);
      }
    } catch (error) {
      console.error('Error updating close message:', error);
      setError(error instanceof Error ? error.message : 'Failed to update message');
    } finally {
      setSaving(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Voting Control
        </CardTitle>
        <CardDescription>
          Control whether voting is open or closed to the public
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Nomination Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="nominations-toggle" className="text-base font-medium">
              Nomination Status
            </Label>
            <p className="text-sm text-muted-foreground">
              {nominationsEnabled 
                ? 'Voting is currently open and accepting submissions'
                : 'Voting is currently closed - form will be disabled'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${nominationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {nominationsEnabled ? 'Open' : 'Closed'}
            </span>
            <Switch
              id="nominations-toggle"
              checked={nominationsEnabled}
              onCheckedChange={updateNominationStatus}
              disabled={saving}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>

        {/* Close Message */}
        <div className="space-y-3">
          <Label htmlFor="close-message" className="text-base font-medium">
            Closed Message
          </Label>
          <p className="text-sm text-muted-foreground">
            Message shown to users when voting is closed
          </p>
          <Textarea
            id="close-message"
            value={closeMessage}
            onChange={(e) => setCloseMessage(e.target.value)}
            placeholder="Enter the message to show when voting is closed..."
            className="min-h-[100px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {closeMessage.length}/500 characters
            </span>
            <Button
              onClick={updateCloseMessage}
              disabled={saving || !closeMessage.trim()}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Message
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Voting:</span>
              <span className={`font-medium ${nominationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {nominationsEnabled ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Form Access:</span>
              <span className={`font-medium ${nominationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {nominationsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Public Message:</span>
              <span className="font-medium">
                {nominationsEnabled ? 'Welcome message' : 'Close message'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}