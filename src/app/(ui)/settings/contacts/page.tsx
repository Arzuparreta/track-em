'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Contact, Info, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ContactsSettingsPage() {
  const { toast } = useToast()
  const [createOnIcloud, setCreateOnIcloud] = useState(false)
  const [syncMode, setSyncMode] = useState<'merge' | 'replace'>('merge')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [icloudConnected, setIcloudConnected] = useState(false)
  const [localContactsCount, setLocalContactsCount] = useState(0)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const settingsRes = await fetch('/api/settings/contacts')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setCreateOnIcloud(settingsData.data.createOnIcloud)
        setSyncMode(settingsData.data.syncMode)
      }

      const statusRes = await fetch('/api/integrations/icloud/status')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setIcloudConnected(statusData.data.connected)
      }

      const contactsRes = await fetch('/api/contacts')
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setLocalContactsCount(contactsData.data?.length || 0)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createOnIcloud,
          syncMode,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({ title: 'Success', description: 'Settings saved successfully' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Contact className="h-5 w-5" />
            Contact Sync Settings
          </CardTitle>
          <CardDescription>
            Configure how contacts are synced with external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <h3 className="font-medium">iCloud Status</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {icloudConnected ? (
                  <>
                    Connected
                    {localContactsCount > 0 && (
                      <span className="ml-2">
                        ({localContactsCount} contacts)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Not connected.{' '}
                    <a
                      href="/settings/integrations"
                      className="text-primary hover:underline"
                    >
                      Connect iCloud
                    </a>
                  </>
                )}
              </p>
            </div>
            <Badge variant={icloudConnected ? 'default' : 'secondary'}>
              {icloudConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="create-on-icloud" className="text-base font-medium">
                  Create new contacts on iCloud
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  When enabled, contacts created in this app will also be
                  created in your iCloud address book.
                </p>
              </div>
              <Switch
                id="create-on-icloud"
                checked={createOnIcloud}
                onCheckedChange={setCreateOnIcloud}
                disabled={!icloudConnected}
              />
            </div>

            {!icloudConnected && (
              <div className="flex items-start gap-2 p-3 rounded-md border border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Connect iCloud in the{' '}
                  <a
                    href="/settings/integrations"
                    className="font-medium hover:underline"
                  >
                    Integrations tab
                  </a>{' '}
                  to enable this feature.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label className="text-base font-medium">
                When connecting iCloud
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose what happens to your existing local contacts when you
                connect iCloud.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="syncMode"
                  value="merge"
                  checked={syncMode === 'merge'}
                  onChange={() => setSyncMode('merge')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Merge contacts</p>
                  <p className="text-sm text-muted-foreground">
                    Keep your local contacts and create them on iCloud.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="syncMode"
                  value="replace"
                  checked={syncMode === 'replace'}
                  onChange={() => setSyncMode('replace')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Replace local contacts</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all local contacts and replace them with your
                    iCloud contacts.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
