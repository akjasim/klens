import { NavLink, Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./pages/Home.jsx";
import Explorer from "./pages/Explorer.jsx";
import About from "./pages/About.jsx";
import NotFound from "./pages/NotFound.jsx";

const navLinkClassName = ({ isActive }) =>
  [
    "nav-link px-2 py-1",
    isActive ? "text-primary fw-semibold" : "text-secondary",
  ].join(" ");

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <header className="border-bottom bg-white shadow-sm">
        <div className="container d-flex flex-wrap align-items-center py-3 gap-3">
          <NavLink to="/" className="text-decoration-none">
            <span className="fs-4 fw-bold text-primary">KLens</span>
          </NavLink>
          <nav className="ms-auto d-flex gap-2">
            <NavLink to="/" className={navLinkClassName}>
              Home
            </NavLink>
            <NavLink to="/spotify" className={navLinkClassName}>
              Spotify
            </NavLink>
            <NavLink to="/about" className={navLinkClassName}>
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-grow-1 w-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spotify" element={<Explorer />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="bg-white border-top py-3 text-center text-muted small">
        KLens © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
