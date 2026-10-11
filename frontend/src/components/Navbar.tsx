import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { isAuth, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isHome = location.pathname === "/";

  return (
    <header
      className={`${styles.header} ${scrolled || !isHome ? styles.solid : ""} ${menuOpen ? styles.menuOpen : ""}`}
    >
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoText}>Auberge</span>
          <span className={styles.logoH4}>Henri IV</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Accueil
          </NavLink>
          <NavLink
            to="/histoire"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Histoire
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className={styles.actions}>
          {isAuth ? (
            <>
              <NavLink
                to="/profil"
                className={styles.avatar}
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </NavLink>
              <button
                onClick={handleLogout}
                className={`btn ${scrolled || !isHome ? `btn-outline` : `btn-outline-light`} btn-sm ${styles.logoutBtn}`}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/connexion" className={`btn btn-ghost btn-sm`}>
                Connexion
              </NavLink>
              <NavLink to="/inscription" className={`btn btn-primary btn-sm`}>
                S'inscrire
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className={styles.burger}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <NavLink to="/" className={styles.mobileLink}>
            Accueil
          </NavLink>
          <NavLink to="/histoire" className={styles.mobileLink}>
            Histoire
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={styles.mobileLink}>
              Admin
            </NavLink>
          )}
          {isAuth ? (
            <>
              <NavLink to="/profil" className={styles.mobileLink}>
                Mon profil
              </NavLink>
              <button
                onClick={handleLogout}
                className={`btn btn-outline ${styles.mobileLogout}`}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className={styles.mobileAuth}>
              <NavLink to="/connexion" className="btn btn-outline">
                Connexion
              </NavLink>
              <NavLink to="/inscription" className="btn btn-primary">
                S'inscrire
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
