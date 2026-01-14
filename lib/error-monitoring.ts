import { ErrorLog, ErrorSeverity } from "@/types/error-monitoring";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";

const ERROR_LOGS_COLLECTION = "error_logs";

/**
 * エラーをFirestoreに記録する
 */
export async function logErrorToFirestore(params: {
  error: unknown;
  context?: string;
  severity?: ErrorSeverity;
  userId?: string;
  storeId?: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
    const { error, context, severity = 'medium', userId, storeId, metadata } = params;
    
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    const errorLog: Omit<ErrorLog, 'id'> = {
      timestamp: Date.now(),
      message,
      stack,
      context,
      severity,
      userId,
      storeId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side',
      metadata,
    };

    // Firestoreに保存
    console.log("[Error Monitoring] Attempting to log error to Firestore...", errorLog);
    const docRef = await addDoc(collection(db, ERROR_LOGS_COLLECTION), {
      ...errorLog,
      createdAt: serverTimestamp(),
    });

    console.log(`[Error Monitoring] Error logged successfully with ID: ${docRef.id}`);
    return docRef.id;
  } catch (e) {
    // ログ記録自体のエラーはコンソールに出力するのみ（無限ループ防止）
    console.error("[Error Monitoring] Failed to log error to Firestore:", e);
    return null;
  }
}

/**
 * 最近のエラーログを取得する
 */
export async function getRecentErrorLogs(count: number = 50): Promise<ErrorLog[]> {
  try {
    const q = query(
      collection(db, ERROR_LOGS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ErrorLog));
  } catch (e) {
    console.error("[Error Monitoring] Failed to fetch error logs:", e);
    return [];
  }
}

/**
 * 重大度を自動判定する
 */
export function determineSeverity(error: unknown): ErrorSeverity {
  const message = String(error).toLowerCase();
  
  if (message.includes("permission-denied") || message.includes("auth")) {
    return "high";
  }
  
  if (message.includes("quota") || message.includes("limit-exceeded")) {
    return "critical";
  }
  
  if (message.includes("not-found") || message.includes("validation")) {
    return "low";
  }
  
  return "medium";
}
