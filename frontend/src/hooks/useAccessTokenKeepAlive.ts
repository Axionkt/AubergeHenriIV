import { useEffect, useRef } from "react";
import { refreshAccessToken, handleAuthFailure } from "../lib/auth";

// Must match the access token lifetime in backend/utils/tokens.ts.
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_MARGIN_MS = 60 * 1000; // refresh this long before expiry
const REFRESH_INTERVAL_MS = ACCESS_TOKEN_TTL_MS - REFRESH_MARGIN_MS;

/**
 * Refreshes the access token on a timer while `active`, and when the tab
 * becomes visible again. Used on detail pages, where a user can stay a long
 * time without making requests and then trigger media loads that the
 * interceptor can't retry (the browser fetches <img>/<video> directly).
 */
export function useAccessTokenKeepAlive(active: boolean) {
  const failedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const tick = async () => {
      try {
        await refreshAccessToken();
      } catch {
        if (!failedRef.current) {
          failedRef.current = true;
          handleAuthFailure();
        }
      }
    };

    tick(); // refresh right away — don't assume the token is fresh on mount

    const id = setInterval(tick, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active]);
}
