import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h1 className="h3 text-primary mb-3">About KLens</h1>
              <p className="lead text-muted">
                KLens aims to create a web-based tool, similar to GapMinder,
                that will help people explore and understand real data from the
                City Administration of Kaiserslautern.
              </p>
              <p>
                Use the Spotify page to run curated sample queries, inspect the
                underlying request payload, and compare the results on a chart.
                This demo is intentionally small so it can be adapted to other
                datasets or used as a starting point for a richer analytics UI.
              </p>
              <p className="mb-4">
                Need to go back? Use the button below or the navigation links
                above.
              </p>
              <Link to="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
