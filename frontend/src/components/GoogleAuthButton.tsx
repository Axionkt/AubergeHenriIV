import { useEffect, useState } from "react";
import styles from "../pages/Auth.module.css";

interface Props {
  intent: "login" | "register";
  /** In-app path to land on after login (the backend re-validates it). */
  returnTo?: string | null;
}

/**
 * "Continue with Google" as a plain link: the site loads nothing from
 * Google. Clicking it goes to the backend, which redirects to Google's
 * sign-in page; Google sends the user back to /api/auth/google/callback.
 */
export default function GoogleAuthButton({ intent, returnTo }: Props) {
  const [leaving, setLeaving] = useState(false);

  // Coming back with the browser's Back button restores the page from cache:
  // reset the spinner so the button works again.
  useEffect(() => {
    const reset = () => setLeaving(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const query = new URLSearchParams({ intent });
  if (returnTo) query.set("returnTo", returnTo);

  return (
    <a
      href={`/api/auth/google/start?${query}`}
      className={styles.googleBtn}
      aria-busy={leaving}
      onClick={() => setLeaving(true)}
    >
      {leaving ? (
        <span className={styles.googleSpinner} aria-hidden="true" />
      ) : (
        <GoogleLogo />
      )}
      {intent === "register"
        ? "S'inscrire avec Google"
        : "Continuer avec Google"}
    </a>
  );
}

/** Google's standard "G" mark, as required by its branding guidelines. */
function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
