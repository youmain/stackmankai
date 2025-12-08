"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Globe, Store, Users, Lock } from "lucide-react"

interface VisibilitySettingsProps {
  value: "public" | "store" | "friends" | "private"
  onChange: (value: "public" | "store" | "friends" | "private") => void
  storeName?: string
}

export function VisibilitySettings({ value, onChange, storeName = "現在の店舗" }: VisibilitySettingsProps) {
  const options = [
    {
      value: "public" as const,
      label: "公開",
      description: "すべてのユーザーが閲覧できます",
      icon: Globe,
      badge: "推奨",
      badgeVariant: "default" as const,
    },
    {
      value: "store" as const,
      label: "店舗限定",
      description: `${storeName}のメンバーのみ閲覧できます`,
      icon: Store,
      badge: "店舗内",
      badgeVariant: "secondary" as const,
    },
    {
      value: "friends" as const,
      label: "フレンド限定",
      description: "フレンドのみ閲覧できます",
      icon: Users,
      badge: "限定",
      badgeVariant: "outline" as const,
    },
    {
      value: "private" as const,
      label: "非公開",
      description: "自分のみ閲覧できます（下書き保存）",
      icon: Lock,
      badge: "非公開",
      badgeVariant: "destructive" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          公開範囲設定
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={onChange} className="space-y-4">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer font-medium mb-1">
                    <Icon className="w-4 h-4" />
                    {option.label}
                    <Badge variant={option.badgeVariant}>{option.badge}</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            )
          })}
        </RadioGroup>

        {/* 公開範囲の説明 */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">公開範囲について</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 公開投稿はアドバイスを多く受けられる可能性があります</li>
            <li>• 店舗限定は同じ環境でプレイする人からの具体的なアドバイスが期待できます</li>
            <li>• 投稿後も公開範囲は変更できます</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
