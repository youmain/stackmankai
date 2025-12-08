import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react" // Assuming Plus is imported from lucide-react
;<Link href="/posts/new">
  <Button className="w-full">
    <Plus className="w-4 h-4 mr-2" />
    新規投稿
  </Button>
</Link>
