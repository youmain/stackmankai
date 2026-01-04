'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployeeSession } from '@/hooks/useEmployeeSession';
import Link from 'next/link';
import { Users, FileText, BarChart3, Trophy, Settings, Menu, LogOut, User, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function EmployeeDashboardPage() {
  // セッション監視を開始
  useEmployeeSession();
  
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [storeId, setStoreId] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // localStorageから従業員情報を取得
    const name = localStorage.getItem('employeeName') || '従業員';
    const role = localStorage.getItem('employeeRole') || 'employee';
    const store = localStorage.getItem('storeId') || '';
    
    setEmployeeName(name);
    setEmployeeRole(role);
    setStoreId(store);
  }, []);

  const handleLogout = () => {
    if (confirm('ログアウトしますか？')) {
      localStorage.removeItem('employeeSessionId');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('storeId');
      localStorage.removeItem('employeeRole');
      localStorage.removeItem('employeeName');
      router.push('/employee-login');
    }
  };

  const isLeader = employeeRole === 'leader';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-black">スタックマン！</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{employeeName}</span>
                {isLeader && (
                  <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold">
                    リーダー
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center space-x-2"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">メニュー</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* モバイルメニュー */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal={false}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-lg">メニュー</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3 py-2 sm:hidden">
              <User className="h-4 w-4" />
              <span>{employeeName}</span>
              {isLeader && (
                <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold">
                  リーダー
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Link href="/players" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-base py-3">
                  <Users className="h-5 w-5 mr-3" />
                  プレイヤー管理
                </Button>
              </Link>
              <Link href="/receipts" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-base py-3">
                  <FileText className="h-5 w-5 mr-3" />
                  レシート管理
                </Button>
              </Link>
              <Link href="/sales" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-base py-3">
                  <BarChart3 className="h-5 w-5 mr-3" />
                  売上管理
                </Button>
              </Link>
              <Link href="/ranking" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-base py-3">
                  <Trophy className="h-5 w-5 mr-3" />
                  ランキング
                </Button>
              </Link>
              
              {isLeader && (
                <>
                  <div className="border-t my-2"></div>
                  <Link href="/employee-management" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-base py-3">
                      <UserCog className="h-5 w-5 mr-3" />
                      従業員管理
                    </Button>
                  </Link>
                </>
              )}

              <div className="border-t my-2"></div>
              <Button
                variant="ghost"
                className="w-full justify-start text-base py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                ログアウト
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">ダッシュボード</h2>
          <p className="text-gray-600">
            ようこそ、{employeeName}さん
            {isLeader && <span className="ml-2 text-purple-600 font-semibold">（リーダー）</span>}
          </p>
        </div>

        {/* 機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/players">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">プレイヤー管理</h3>
              <p className="text-gray-600 text-sm">プレイヤーの登録・編集・ポイント管理</p>
            </div>
          </Link>

          <Link href="/receipts">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">レシート管理</h3>
              <p className="text-gray-600 text-sm">レシートの発行・履歴確認</p>
            </div>
          </Link>

          <Link href="/sales">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-yellow-500">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">売上管理</h3>
              <p className="text-gray-600 text-sm">日次・月次の売上確認</p>
            </div>
          </Link>

          <Link href="/ranking">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">ランキング</h3>
              <p className="text-gray-600 text-sm">プレイヤーランキングの確認</p>
            </div>
          </Link>

          {isLeader && (
            <Link href="/employee-management">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-indigo-500">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <UserCog className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">従業員管理</h3>
                <p className="text-gray-600 text-sm">従業員の招待・権限管理</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
