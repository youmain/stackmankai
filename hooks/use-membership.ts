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
        const customerData = sessionStorage.getItem("customerAccount")
        console.log("[v0] useMembership - customerData:", customerData)

        if (customerData) {
          const currentCustomer = JSON.parse(customerData)
          console.log("[v0] useMembership - subscriptionStatus:", currentCustomer?.subscriptionStatus)

          if (currentCustomer && currentCustomer.subscriptionStatus === "active") {
            console.log("[v0] useMembership - isMember: true")
            setMembershipStatus({
              isMember: true,
              isLoading: false,
              membershipType: "premium",
            })
          } else {
            console.log("[v0] useMembership - isMember: false (not active)")
            setMembershipStatus({
              isMember: false,
              isLoading: false,
              membershipType: "free",
            })
          }
        } else {
          console.log("[v0] useMembership - isMember: false (no data)")
          setMembershipStatus({
            isMember: false,
            isLoading: false,
            membershipType: "free",
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
