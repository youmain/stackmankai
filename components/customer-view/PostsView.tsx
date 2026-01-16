'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PostsList } from '@/components/posts/posts-list'

interface PostsViewProps {
  onViewModeChange: (mode: string) => void
  onPostClick: (postId: string) => void
}

export const PostsView = React.memo<React.FC<PostsViewProps>>(({ onViewModeChange, onPostClick }) => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">ハンド記録</CardTitle>
          <Button variant="outline" onClick={() => onViewModeChange('main')}>
            戻る
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <PostsList onPostClick={onPostClick} />
      </CardContent>
    </Card>
  )
})
