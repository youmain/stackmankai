import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PokerStack Manager",
  description: "ポーカープレイヤー向けスタック管理アプリ",
  generator: "v0.app",
}

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${inter.className} antialiased`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
