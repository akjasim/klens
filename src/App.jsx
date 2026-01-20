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

const navLinkClassName = ({ isActive }) =>
  [
    "nav-link px-2 py-1",
    isActive ? "text-primary fw-semibold" : "text-secondary",
  ].join(" ");

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <header className="border-bottom bg-white shadow-sm">
        <div className="container d-flex flex-wrap align-items-center py-3 gap-3">
          <NavLink to="/" className="text-decoration-none">
            <span className="fs-4 fw-bold text-primary">DELens</span>
          </NavLink>
          <nav className="ms-auto d-flex align-items-center gap-2">
            <NavLink to="/" className={navLinkClassName}>
              {t("home")}
            </NavLink>
            <NavLink to="/explorer" className={navLinkClassName}>
              {t("explorer")}
            </NavLink>
            {/* <NavLink to="/spotify" className={navLinkClassName}>
              Spotify
            </NavLink> */}
            <NavLink to="/time-series" className={navLinkClassName}>
              {t("timeSeries")}
            </NavLink>
            <NavLink to="/demographics" className={navLinkClassName}>
              {t("demographics")}
            </NavLink>
            <NavLink to="/about" className={navLinkClassName}>
              {t("about")}
            </NavLink>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main className="flex-grow-1 w-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Explorer />} />
          {/* <Route path="/spotify" element={<Spotify />} /> */}
          <Route path="/time-series" element={<InternetTimelineChart />} />
          <Route path="/demographics" element={<DemographicIndicator />} />
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
