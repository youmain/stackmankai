'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, UserPlus } from 'lucide-react';

interface EmployeeInviteProps {
  storeId: string;
}

export default function EmployeeInvite({ storeId }: EmployeeInviteProps) {
  const [role, setRole] = useState<'leader' | 'employee'>('employee');
  const [inviteCode, setInviteCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const generateInviteCode = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('ログインが必要です');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/employee/create-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeId,
          role,
          expiresInDays: 7, // 7日間有効
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '招待コードの生成に失敗しました');
      }

      setInviteCode(data.inviteCode);
      
      // QRコードを生成（ログインページのURLに招待コードを含める）
      const loginUrl = `${window.location.origin}/employee-login?code=${data.inviteCode}`;
      const qrDataUrl = await QRCode.toDataURL(loginUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrDataUrl);
      setShowQR(true);

    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const loginUrl = `${window.location.origin}/employee-login?code=${inviteCode}`;
    navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCodeOnly = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <UserPlus className="text-blue-600 mr-2" size={24} />
        <h2 className="text-2xl font-bold">従業員を招待</h2>
      </div>

      {!showQR ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">権限</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'leader' | 'employee')}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="employee">従業員</option>
              <option value="leader">リーダー</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              リーダーは他の従業員を招待できます
            </p>
          </div>

          <button
            onClick={generateInviteCode}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? '生成中...' : '招待コードを生成'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 招待方法の選択タブ */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setShowQR(true)}
                className="pb-2 px-1 border-b-2 border-blue-600 text-blue-600 font-semibold"
              >
                <QrCode className="inline mr-1" size={18} />
                QRコード
              </button>
            </div>
          </div>

          {/* QRコード表示 */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              従業員にこのQRコードをスキャンしてもらってください
            </p>
            <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-200">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
          </div>

          {/* コードのコピー */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              または、招待コードを共有:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteCode}
                readOnly
                className="flex-1 border rounded-lg px-3 py-2 bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyCodeOnly}
                className="bg-gray-600 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-all flex items-center"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* URLのコピー */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              ログインURLを共有（LINE等で送信）:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${window.location.origin}/employee-login?code=${inviteCode}`}
                readOnly
                className="flex-1 border rounded-lg px-3 py-2 bg-gray-50 text-xs"
              />
              <button
                onClick={copyToClipboard}
                className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-all flex items-center"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* 新しい招待コードを生成 */}
          <button
            onClick={() => {
              setShowQR(false);
              setInviteCode('');
              setQrCodeUrl('');
            }}
            className="w-full bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition-all"
          >
            新しい招待コードを生成
          </button>

          {/* 有効期限の表示 */}
          <p className="text-xs text-gray-500 text-center">
            この招待コードは7日間有効です
          </p>
        </div>
      )}
    </div>
  );
}
