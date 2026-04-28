import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import "./globals.css";
import { AppLayout } from '@/components/layout/AppLayout'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Manager CRM",
  description: "Communications CRM for music industry managers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppLayout user={user}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
