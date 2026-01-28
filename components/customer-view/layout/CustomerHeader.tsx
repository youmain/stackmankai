import React from "react"
import { User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CustomerAccount, Player } from "@/types"

interface CustomerHeaderProps {
  customerAccount: CustomerAccount | null
  linkedPlayer: Player | null
  getDisplayName: (player: Player) => string
  setIsMenuOpen: (isOpen: boolean) => void
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  customerAccount,
  linkedPlayer,
  getDisplayName,
  setIsMenuOpen,
}) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-purple-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {/* currentCustomerの代わりにcustomerAccountを使用 */}
                {customerAccount && customerAccount.playerId && linkedPlayer && typeof getDisplayName === 'function'
                  ? `${getDisplayName(linkedPlayer)}さんのデータ`
                  : "マイページ"}
              </h1>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center space-x-2"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">メニュー</span>
            </Button>

            {/* Menu (Sheet) - Handled by parent page.tsx */}
          </div>
        </div>
      </div>
    </div>
  )
}
