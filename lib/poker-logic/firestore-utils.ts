/**
 * Firestore utility functions
 */

/**
 * Remove undefined values from an object recursively
 * Firestore does not accept undefined values
 */
export function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (value !== undefined) {
        result[key] = removeUndefined(value)
      }
    }
    return result as T
  }
  return obj
}
