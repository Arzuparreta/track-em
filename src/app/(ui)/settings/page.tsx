import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Database, Globe, Clock } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>
            Application information and system settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-sm">Database</h3>
              </div>
              <p className="text-sm text-muted-foreground">PostgreSQL with Prisma ORM</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-sm">Framework</h3>
              </div>
              <p className="text-sm text-muted-foreground">Next.js 14 App Router</p>
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium text-sm">Session</h3>
            </div>
            <p className="text-sm text-muted-foreground">JWT-based authentication with HttpOnly cookies</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
