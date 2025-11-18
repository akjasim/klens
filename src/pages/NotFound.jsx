import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section
      className="w-100 d-flex align-items-center justify-content-center"
      style={{ minHeight: "500px" }}
    >
      <div className="text-center">
        <div className="mb-4">
          <h1 className="display-5 fw-bold text-primary">Page not found</h1>
          <p className="text-muted">
            The page you are looking for doesn't exist or was moved.
          </p>
        </div>
        <Link to="/" className="btn btn-outline-primary">
          Go back home
        </Link>
      </div>
    </section>
  );
}
