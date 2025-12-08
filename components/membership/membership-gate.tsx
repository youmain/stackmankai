"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface MembershipGateProps {
  title: string
  description: string
  featureType: "posts" | "comments" | "creation"
  children?: React.ReactNode
}

export function MembershipGate({ title, description, featureType, children }: MembershipGateProps) {
  const getFeatureIcon = () => {
    switch (featureType) {
      case "posts":
        return <Lock className="w-6 h-6 text-amber-600" />
      case "comments":
        return <Lock className="w-6 h-6 text-purple-600" />
      case "creation":
        return <Lock className="w-6 h-6 text-blue-600" />
      default:
        return <Lock className="w-6 h-6 text-gray-600" />
    }
  }

  const getFeatureColor = () => {
    switch (featureType) {
      case "posts":
        return "border-amber-200 bg-amber-50"
      case "comments":
        return "border-purple-200 bg-purple-50"
      case "creation":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <Card className={`${getFeatureColor()} border-2`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-3">{getFeatureIcon()}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/80 p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">この機能は会員限定です</p>
        </div>

        {children}
      </CardContent>
    </Card>
  )
}
