
import React from "react";

type Status = "idle" | "pending" | "success" | "cancelled";

interface PaymentPollingOptions {
  onSuccess: (paymentId: string) => void;
}

export function usePaymentPolling({ onSuccess }: PaymentPollingOptions) {
  const [status, setStatus] = React.useState<Status>("idle");
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
    setStatus("idle");
  }, []);

  const openCheckoutPopup = (url: string) => {
    const w = 600;
    const h = 800;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(
      url,
      "payment_checkout",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  };

  const pollPaymentStatus = React.useCallback(
    (paymentId: string) => {
      pollRef.current = window.setInterval(async () => {
        try {
          const res = await fetch(`/api/paymentStatus?paymentId=${paymentId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data?.status === "SUCCESS") {
            setStatus("success");
            cleanup();
            onSuccess(paymentId);
          } else if (data?.status === "FAILED") {
            setStatus("cancelled");
            cleanup();
          }
        } catch (err) {
          console.error("poll error", err);
        }
      }, 5000); // Increased polling interval to 5s
    },
    [cleanup, onSuccess]
  );

  const waitForPopupClose = React.useCallback(
    (paymentId: string) => {
      timeoutRef.current = window.setTimeout(() => {
        console.log("Payment timed out for paymentId:", paymentId);
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setStatus("cancelled");
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
          popupRef.current = null;
        }
      }, 5 * 60 * 1000); // 5 minutes
    },
    []
  );

  const startPaymentProcess = React.useCallback(
    async (paymentId: string, checkoutUrl: string) => {
      setStatus("pending");
      openCheckoutPopup(checkoutUrl);
      pollPaymentStatus(paymentId);

      const popupInterval = window.setInterval(() => {
        if (!popupRef.current) {
          window.clearInterval(popupInterval);
          return;
        }
        if (popupRef.current.closed) {
          window.clearInterval(popupInterval);
          setTimeout(async () => {
            try {
              const r = await fetch(`/api/paymentStatus?paymentId=${paymentId}`);
              const d = await r.json();
              if (d?.status === "SUCCESS") {
                setStatus("success");
                cleanup();
                onSuccess(paymentId);
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

      waitForPopupClose(paymentId);
    },
    [cleanup, onSuccess, pollPaymentStatus, waitForPopupClose]
  );

  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { status, startPaymentProcess, cleanup };
}
