'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Cloud, CheckCircle, XCircle, Loader2, Merge, Replace } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'

interface IntegrationStatus {
  icloud: {
    connected: boolean
    username?: string
  }
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const [icloudUsername, setIcloudUsername] = useState('')
  const [icloudPassword, setIcloudPassword] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<IntegrationStatus>({
    icloud: { connected: false },
  })
  const [loading, setLoading] = useState(true)

  const [showSyncOptions, setShowSyncOptions] = useState(false)
  const [syncMode, setSyncMode] = useState<'merge' | 'replace'>('merge')
  const [localContactsCount, setLocalContactsCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/integrations/icloud/status')
      if (response.ok) {
        const data = await response.json()
        setStatus({
          icloud: {
            connected: data.data.connected,
            username: data.data.username,
          },
        })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleConnectiCloud = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/integrations/icloud/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: icloudUsername,
          appPassword: icloudPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to iCloud')
      }

      if (data.localContactsCount > 0) {
        setLocalContactsCount(data.localContactsCount)
        setShowSyncOptions(true)
      } else {
        window.location.reload()
      }
    } catch {
      setError('Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSyncChoice = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/integrations/icloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: syncMode }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Sync failed')
      }

      toast({ title: 'Success', description: 'Sync completed successfully!' })
      window.location.reload()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Sync failed', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnectiCloud = async () => {
    if (!confirm('Are you sure you want to disconnect iCloud?')) return

    setIsDisconnecting(true)
    try {
      await fetch('/api/integrations/icloud/disconnect', {
        method: 'POST',
      })
      window.location.reload()
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' })
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                iCloud Contacts (CardDAV)
              </CardTitle>
              <CardDescription>
                Sync your iCloud contacts with the CRM
              </CardDescription>
            </div>
            {status.icloud.connected ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status.icloud.connected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connected as: <strong className="text-foreground">{status.icloud.username}</strong>
              </p>
              <Button
                variant="destructive"
                onClick={handleDisconnectiCloud}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect iCloud'
                )}
              </Button>
            </div>
          ) : showSyncOptions ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                <p className="text-sm text-amber-800">
                  You have <strong>{localContactsCount}</strong> local contacts.
                  Choose how to handle them:
                </p>
              </div>

              <RadioGroup
                value={syncMode}
                onValueChange={(v) => setSyncMode(v as 'merge' | 'replace')}
              >
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <RadioGroupItem value="merge" id="merge" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="merge" className="font-medium flex items-center gap-2">
                      <Merge className="h-4 w-4" />
                      Merge contacts
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Keep your local contacts and create them on iCloud.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <RadioGroupItem value="replace" id="replace" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="replace" className="font-medium flex items-center gap-2">
                      <Replace className="h-4 w-4" />
                      Replace local contacts
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Remove all local contacts and replace with iCloud contacts.
                    </p>
                  </div>
                </div>
              </RadioGroup>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSyncOptions(false)
                    setIcloudUsername('')
                    setIcloudPassword('')
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSyncChoice} disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Confirm & Sync'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectiCloud} className="space-y-4">
              <div>
                <Label htmlFor="icloud-username">iCloud Username/Email</Label>
                <Input
                  id="icloud-username"
                  type="email"
                  value={icloudUsername}
                  onChange={(e) => setIcloudUsername(e.target.value)}
                  placeholder="your@icloud.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="icloud-password">
                  App-Specific Password
                </Label>
                <Input
                  id="icloud-password"
                  type="password"
                  value={icloudPassword}
                  onChange={(e) => setIcloudPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Generate an app-specific password in your Apple ID settings
                </p>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect iCloud'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">About iCloud Sync</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When connected, you can choose to sync contacts between this
                app and your iCloud address book. You can also configure
                whether new contacts are automatically created on iCloud in
                the{' '}
                <a href="/settings/contacts" className="text-primary hover:underline">
                  Contacts Settings
                </a>{' '}
                tab.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
