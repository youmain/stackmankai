"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Gift, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CompletionScreenProps {
  customer: any
  hideCompletionScreen: boolean
  onHideCompletionChange: (value: boolean) => void
  onSkipToRanking: () => void
}

export function CompletionScreen({
  customer,
  hideCompletionScreen,
  onHideCompletionChange,
  onSkipToRanking,
}: CompletionScreenProps) {
  if (!customer) return null

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Gift className="h-5 w-5" />
            ログイン成功
          </CardTitle>
          <CardDescription className="text-green-600">
            {customer.email} でログインしました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hide-completion"
              checked={hideCompletionScreen}
              onCheckedChange={(checked) => onHideCompletionChange(checked as boolean)}
            />
            <Label htmlFor="hide-completion" className="cursor-pointer">
              次回からこの画面を表示しない
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onSkipToRanking}
              className="flex-1"
            >
              ランキングを見る
            </Button>
            <Link href="/customer-view" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
