'use client';

import { useState } from 'react';
import { Settings, User, Shield, Bell, Globe, Key, Database, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    systemName: 'MyCodeXvantaOS',
    environment: 'production',
    auditRetentionDays: 365,
    maxSessionDuration: 8,
    enforce2FA: true,
    emailNotifications: true,
    slackNotifications: false,
    autoRefreshInterval: 30,
    defaultTimeRange: '24h',
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure MyCodeXvantaOS admin console behavior and governance policies
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="connectors" className="gap-1.5">
            <Database className="h-3.5 w-3.5" /> Connectors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Configuration</CardTitle>
              <CardDescription>General system settings and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sys-name">System Name</Label>
                  <Input
                    id="sys-name"
                    value={settings.systemName}
                    onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="env">Environment</Label>
                  <Select
                    value={settings.environment}
                    onValueChange={(v) => setSettings({ ...settings, environment: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refresh">Auto-Refresh Interval (seconds)</Label>
                  <Input
                    id="refresh"
                    type="number"
                    value={settings.autoRefreshInterval}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoRefreshInterval: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-range">Default Time Range</Label>
                  <Select
                    value={settings.defaultTimeRange}
                    onValueChange={(v) => setSettings({ ...settings, defaultTimeRange: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="6h">6 Hours</SelectItem>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security & Governance</CardTitle>
              <CardDescription>
                Authentication, authorization, and governance policy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Enforce 2FA</p>
                    <p className="text-xs text-muted-foreground">
                      Require two-factor authentication for all admin and super_admin roles
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.enforce2FA}
                  onCheckedChange={(v) => setSettings({ ...settings, enforce2FA: v })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
                  <Input
                    id="audit-retention"
                    type="number"
                    value={settings.auditRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        auditRetentionDays: parseInt(e.target.value) || 365,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-duration">Max Session Duration (hours)</Label>
                  <Input
                    id="session-duration"
                    type="number"
                    value={settings.maxSessionDuration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxSessionDuration: parseInt(e.target.value) || 8,
                      })
                    }
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Cloudflare Access Integration</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Zero Trust protection is active on admin.autoecoops.io and dashboard.autoecoops.io
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Key className="h-3 w-3" /> Account ID configured
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Globe className="h-3 w-3" /> Zone ID configured
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Shield className="h-3 w-3" /> Access policies active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive system alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive critical alerts and daily summaries via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30">
                <div>
                  <p className="text-sm font-medium">Slack Integration</p>
                  <p className="text-xs text-muted-foreground">
                    Post alerts to a designated Slack channel
                  </p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, slackNotifications: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Connector Configuration</CardTitle>
              <CardDescription>
                Global settings applied to all new connector instances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Connection Pool Size</Label>
                  <Input type="number" placeholder="50" />
                </div>
                <div className="space-y-2">
                  <Label>Health Check Interval (seconds)</Label>
                  <Input type="number" placeholder="30" />
                </div>
                <div className="space-y-2">
                  <Label>Connection Timeout (ms)</Label>
                  <Input type="number" placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input type="number" placeholder="3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
