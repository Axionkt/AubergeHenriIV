import { useLayoutEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import styles from "../pages/Auth.module.css";

interface Props {
  /** Google's own label: "continue_with" on login, "signup_with" on register. */
  text: "continue_with" | "signup_with";
  loading: boolean;
  loadingLabel: string;
  /** Receives the Google ID token (a JWT), which the backend verifies. */
  onCredential: (idToken: string) => void;
  onError: () => void;
}

/**
 * Google's rendered sign-in button. It returns an ID token, which the
 * backend checks is issued to this app's client ID. (useGoogleLogin's
 * implicit flow only returns an access token, which can't be verified
 * that way.)
 */
export default function GoogleAuthButton({
  text,
  loading,
  loadingLabel,
  onCredential,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  // Google's iframe takes a fixed pixel width (max 400): match the card.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.min(400, Math.floor(el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.googleWrap}>
      {loading ? (
        <div className={styles.googleBtn} aria-busy="true">
          <span className={styles.googleSpinner} />
          {loadingLabel}
        </div>
      ) : (
        width !== undefined && (
          <GoogleLogin
            text={text}
            theme="outline"
            shape="rectangular"
            size="large"
            width={width}
            onSuccess={(response) =>
              response.credential ? onCredential(response.credential) : onError()
            }
            onError={onError}
          />
        )
      )}
    </div>
  );
}
