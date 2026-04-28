'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function NotificationsSettingsPage() {
  const { toast } = useToast()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [followUpReminders, setFollowUpReminders] = useState(true)
  const [callReminders, setCallReminders] = useState(false)

  const handleSave = () => {
    toast({ title: 'Success', description: 'Notification preferences saved' })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="font-medium">Follow-up Reminders</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when follow-ups are due or overdue
                </p>
              </div>
              <Switch
                checked={followUpReminders}
                onCheckedChange={setFollowUpReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="font-medium">Call Reminders</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get reminded about scheduled calls
                </p>
              </div>
              <Switch
                checked={callReminders}
                onCheckedChange={setCallReminders}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
