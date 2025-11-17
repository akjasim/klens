import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <h1 className="display-4 fw-bold text-primary mb-4">
          📊 Discover Insights
        </h1>
        <p className="lead text-muted mb-4">
          Unlock the stories hidden in Kaiserslautern's public data
        </p>
        <p className="fs-5 text-secondary mb-5" style={{ maxWidth: "500px" }}>
          Explore real datasets from the City Administration and understand what
          makes Kaiserslautern tick.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/spotify" className="btn btn-primary btn-lg">
            Start Exploring
          </Link>
          <Link to="/about" className="btn btn-outline-primary btn-lg">
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
