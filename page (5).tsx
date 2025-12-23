'use client'

import React from 'react'
import Link from 'next/link'

export default function SignUpChoicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#34495e] to-[#2c3e50] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="75" viewBox="0 0 300 150" className="mx-auto">
          <rect width="300" height="150" fill="#34495e"/>
          <text fontFamily="Arial, sans-serif" fontSize="42" fontWeight="bold" textAnchor="middle">
            <tspan x="75" y="65" fill="#ecf0f1">YOU</tspan>
            <tspan x="150" y="65" fill="#e74c3c">夢</tspan>
            <tspan x="228" y="65" fill="#ecf0f1">MAIN</tspan>
          </text>
          <text x="150" y="110" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold" fill="#ecf0f1" textAnchor="middle">
            IN
          </text>
        </svg>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">アカウント作成</h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          あなたの役割を選択してください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <Link href="/signup/influencer" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#e74c3c] hover:bg-[#c0392b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e74c3c]">
              インフルエンサーとして登録
            </Link>
            <Link href="/signup/fan" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e74c3c]">
              ファンとして登録
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">すでにアカウントをお持ちの方</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/login" className="font-medium text-[#e74c3c] hover:text-[#c0392b]">
                ログインページへ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
