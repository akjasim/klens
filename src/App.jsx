import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "bootstrap/dist/css/bootstrap.min.css";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Home from "./pages/Home.jsx";
import Explorer from "./pages/Explorer.jsx";
import Spotify from "./pages/Spotify.jsx";
import About from "./pages/About.jsx";
import NotFound from "./pages/NotFound.jsx";
import InternetTimelineChart from "./pages/TimeSeries.jsx";
import DemographicIndicator from "./pages/DemographicIndicator.jsx";
import Urbanization from "./pages/Urbanization.jsx";

const navLinkClassName = ({ isActive }) =>
  ["app-nav-link", isActive ? "app-nav-link-active" : ""].join(" ");

export default function App() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <header className="app-navbar sticky-top">
        <div className="container app-navbar-inner">
          <NavLink
            to="/"
            className="app-brand text-decoration-none"
            onClick={closeMobileMenu}
          >
            <span className="app-brand-mark" aria-hidden="true" />
            <span className="app-brand-name">DELens</span>
          </NavLink>

          <nav
            id="app-main-nav"
            className={`app-nav ms-auto ${isMobileMenuOpen ? "app-nav-mobile-open" : ""}`}
          >
            <NavLink
              to="/"
              className={navLinkClassName}
              onClick={closeMobileMenu}
            >
              {t("home")}
            </NavLink>
            <NavLink
              to="/explorer"
              className={navLinkClassName}
              onClick={closeMobileMenu}
            >
              {t("explorer")}
            </NavLink>
            {/* <NavLink to="/spotify" className={navLinkClassName}>
              Spotify
            </NavLink> */}
            <NavLink
              to="/time-series"
              className={navLinkClassName}
              onClick={closeMobileMenu}
            >
              {t("timeSeries")}
            </NavLink>
            <NavLink
              to="/demographics"
              className={navLinkClassName}
              onClick={closeMobileMenu}
            >
              {t("demographics")}
            </NavLink>
            <NavLink
              to="/urbanization"
              className={navLinkClassName}
              onClick={closeMobileMenu}
            >
              {t("urbanization")}
            </NavLink>
            <NavLink
              to="/about"
              className={navLinkClassName}
              onClick={closeMobileMenu}
            >
              {t("about")}
            </NavLink>
          </nav>

          <div className="app-navbar-actions">
            <div className="app-lang-switcher">
              <LanguageSwitcher />
            </div>

            <button
              type="button"
              className="app-menu-toggle"
              aria-label="Toggle navigation menu"
              aria-controls="app-main-nav"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? "X" : "☰"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 w-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Explorer />} />
          {/* <Route path="/spotify" element={<Spotify />} /> */}
          <Route path="/time-series" element={<InternetTimelineChart />} />
          <Route path="/demographics" element={<DemographicIndicator />} />
          <Route path="/urbanization" element={<Urbanization />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="bg-white border-top py-3 text-center text-muted small">
        DELens © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
