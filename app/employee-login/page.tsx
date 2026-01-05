'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';

function EmployeeLoginForm() {
  const [inviteCode, setInviteCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const codeParam = searchParams.get('code');

  // URLパラメータから招待コードを取得して検証
  useEffect(() => {
    if (codeParam) {
      setInviteCode(codeParam);
      verifyInviteCode(codeParam);
    }
  }, [codeParam]);
  
  // 招待コードを検証して従業員名を取得
  const verifyInviteCode = async (code: string) => {
    if (!code.trim()) return;
    
    setVerifying(true);
    setError('');
    
    try {
      const response = await fetch('/api/employee/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: code }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.employeeName) {
        setEmployeeName(data.employeeName);
      } else {
        setError(data.error || '招待コードの検証に失敗しました');
      }
    } catch (err) {
      setError('招待コードの検証に失敗しました');
    } finally {
      setVerifying(false);
    }
  };

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
      localStorage.setItem('employeeStoreId', data.storeId);
      localStorage.setItem('employeeRole', data.role);
      
      // ダッシュボードにリダイレクト
      router.push('/employee-dashboard');
      
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">従業員ログイン</h1>
        <p className="text-gray-600 text-center mb-8">招待コードでログイン</p>
        
        {message === 'logged_out' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">ログアウトされました。再度ログインしてください。</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              招待コード <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="招待コードを入力"
                required
              />
              <button
                type="button"
                onClick={() => verifyInviteCode(inviteCode)}
                disabled={verifying || !inviteCode.trim()}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {verifying ? '検証中...' : '検証'}
              </button>
            </div>
          </div>
          
          {employeeName && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700">
                こんにちは、<span className="font-bold text-green-700">{employeeName}</span>さん
              </p>
              <p className="text-xs text-gray-600 mt-1">
                下のボタンをクリックしてログインしてください
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !employeeName}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            オーナーの方は
            <a href="/store-login" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
              店舗ログイン
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <EmployeeLoginForm />
    </Suspense>
  );
}
