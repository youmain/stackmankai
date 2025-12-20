"use client"

import { useEffect } from "react"
import { checkAndRunScheduledTasks } from "@/lib/scheduled-tasks"

/**
 * Scheduled Tasks Runner Component
 * Runs scheduled tasks (rake collection, stack reset) on app initialization
 */
export function ScheduledTasksRunner() {
  useEffect(() => {
    const runTasks = async () => {
      // Get storeId from localStorage
      const storeId = localStorage.getItem("storeId")
      
      if (storeId) {
        console.log("[ScheduledTasksRunner] Checking scheduled tasks for store:", storeId)
        await checkAndRunScheduledTasks(storeId)
      }
    }
    
    // Run on mount
    runTasks()
    
    // Run every 5 minutes to catch tasks that should run
    const interval = setInterval(runTasks, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return null // This component doesn't render anything
}
