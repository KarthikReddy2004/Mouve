import * as React from "react";
import { type Plan } from "../lib/types";

export type PaymentStatus = "idle" | "pending" | "success" | "cancelled";

interface UsePaymentProcessorProps {
  onSuccess: (paymentId: string) => void;
}

export function usePaymentProcessor({ onSuccess }: UsePaymentProcessorProps) {
  const [status, setStatus] = React.useState<PaymentStatus>("idle");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const popupRef = React.useRef<Window | null>(null);
  const pollRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const cleanup = React.useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
    setIsProcessing(false);
    setStatus("idle");
  }, []);

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const openCheckoutPopup = (url: string) => {
    const w = 600;
    const h = 800;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(url, "payment_checkout", `width=${w},height=${h},left=${left},top=${top}`);
  };

  const pollPaymentStatus = (paymentId: string) => {
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/paymentStatus?paymentId=${paymentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.status === "SUCCESS") {
          setStatus("success");
          onSuccess(paymentId);
          cleanup();
        } else if (data?.status === "FAILED") {
          setStatus("cancelled");
          cleanup();
        }
      } catch (err) {
        console.error("poll error", err);
      }
    }, 3000);
  };

  const waitForPopupClose = (paymentId: string) => {
    timeoutRef.current = window.setTimeout(() => {
      console.log("Payment timed out for paymentId:", paymentId);
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setStatus("cancelled");
      setIsProcessing(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
        popupRef.current = null;
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const proceedToPayment = async (plan: Plan, userId: string | null) => {
    if (!plan) return;
    setIsProcessing(true);
    setStatus("pending");

    try {
      const res = await fetch("/api/createPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.code || plan.id,
          price: plan.price,
          userId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create payment");
      }
      const data = await res.json();
      const pid = data?.paymentId;
      const url = data?.checkoutUrl;

      if (!pid || !url) {
        throw new Error("Invalid response from createPayment");
      }

      openCheckoutPopup(url);
      pollPaymentStatus(pid);

      const popupInterval = window.setInterval(() => {
        if (!popupRef.current) {
          window.clearInterval(popupInterval);
          return;
        }
        if (popupRef.current.closed) {
          window.clearInterval(popupInterval);
          setTimeout(async () => {
            try {
              const r = await fetch(`/api/paymentStatus?paymentId=${pid}`);
              const d = await r.json();
              if (d?.status === "SUCCESS") {
                setStatus("success");
                onSuccess(pid);
                cleanup();
                return;
              } else {
                setStatus("cancelled");
                cleanup();
              }
            } catch {
              setStatus("cancelled");
              cleanup();
            }
          }, 30000);
        }
      }, 1000);

      waitForPopupClose(pid);
    } catch (err) {
      console.error(err);
      setStatus("cancelled");
      setIsProcessing(false);
    }
  };

  return { status, isProcessing, proceedToPayment, cleanup };
}
