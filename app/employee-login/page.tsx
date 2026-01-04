'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function EmployeeLoginPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const codeParam = searchParams.get('code');

  // URLパラメータから招待コードを取得（QRコードスキャン時）
  useEffect(() => {
    if (codeParam) {
      setInviteCode(codeParam);
    }
  }, [codeParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // デバイス情報を取得
      const deviceInfo = navigator.userAgent;
      
      // APIを呼び出し
      const response = await fetch('/api/employee/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode,
          employeeName,
          deviceInfo,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }
      
      // セッション情報をlocalStorageに保存
      localStorage.setItem('employeeSessionId', data.sessionId);
      localStorage.setItem('employeeId', data.employeeId);
      localStorage.setItem('employeeName', data.employeeName);
      localStorage.setItem('storeId', data.storeId);
      localStorage.setItem('employeeRole', data.role);
      
      // ダッシュボードにリダイレクト
      router.push('/employee-dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LogIn className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">従業員ログイン</h1>
          <p className="text-gray-600">招待コードでログイン</p>
        </div>
        
        {message === 'logged_out' && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            ログアウトされました。再度ログインしてください。
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              招待コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="招待コードを入力"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              オーナーまたはリーダーから受け取った招待コードを入力してください
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="山田太郎"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* フッター */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            <p>
              オーナーの方は{' '}
              <button
                onClick={() => router.push('/store-login')}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                店舗ログイン
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
