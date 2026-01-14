"use client";

import { useEffect, useState } from "react";
import { getRecentErrorLogs } from "@/lib/error-monitoring";
import { ErrorLog } from "@/types/error-monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const recentLogs = await getRecentErrorLogs();
      setLogs(recentLogs);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">エラー検出・監視システム</h1>
      
      <div className="grid gap-4">
        {logs.length === 0 ? (
          <p className="text-gray-500">現在、記録されたエラーはありません。</p>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">ID: {log.id}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <h3 className="font-bold text-lg text-red-700 mb-2">{log.message}</h3>
                {log.context && (
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Context:</span> {log.context}
                  </p>
                )}
                {log.url && (
                  <p className="text-xs text-slate-500 mb-2">
                    <span className="font-semibold">URL:</span> {log.url}
                  </p>
                )}
                {log.stack && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-blue-600 hover:underline">
                      スタックトレースを表示
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-900 text-slate-100 text-xs overflow-x-auto rounded">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
