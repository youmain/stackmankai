"use client"

import { useState, useEffect } from "react"

export interface MembershipStatus {
  isMember: boolean
  isLoading: boolean
  membershipType?: "free" | "premium"
  expiresAt?: Date
  subscriptionStatus?: "active" | "inactive" | "canceled" | "past_due" | "trialing" | "none"
}

export function useMembership() {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>({
    isMember: false,
    isLoading: true,
  })

  useEffect(() => {
    const checkMembershipStatus = async () => {
      try {
        // localStorageからcurrentUserを取得
        const customerData = localStorage.getItem("currentUser")
        console.log("[v0] useMembership - customerData:", customerData)

        if (customerData) {
          const currentCustomer = JSON.parse(customerData)
          console.log("[v0] useMembership - customer:", currentCustomer)

          // ログインしていれば会員として扱う
          if (currentCustomer && currentCustomer.id) {
            console.log("[v0] useMembership - isMember: true (logged in)")
            setMembershipStatus({
              isMember: true,
              isLoading: false,
              membershipType: "premium",
              subscriptionStatus: "active",
            })
          } else {
            console.log("[v0] useMembership - isMember: false (invalid data)")
            setMembershipStatus({
              isMember: false,
              isLoading: false,
              membershipType: "free",
              subscriptionStatus: "none",
            })
          }
        } else {
          console.log("[v0] useMembership - isMember: false (not logged in)")
          setMembershipStatus({
            isMember: false,
            isLoading: false,
            membershipType: "free",
            subscriptionStatus: "none",
          })
        }
      } catch (error) {
        console.error("会員状態の確認に失敗:", error)
        setMembershipStatus({
          isMember: false,
          isLoading: false,
        })
      }
    }

    checkMembershipStatus()

    const handleStorageChange = () => {
      checkMembershipStatus()
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return membershipStatus
}
