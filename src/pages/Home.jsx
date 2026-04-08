import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <section className="delens-page-shell delens-home-shell d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-10 delens-home-content">
            <div className="delens-panel p-4 p-md-5 text-center">
              <div className="d-flex justify-content-center mb-3">
                <span className="delens-chip">Data Storytelling Platform</span>
              </div>

              <h1 className="display-4 fw-bold mb-3 delens-hero-title">
                {t("homeHeroTitle")}
              </h1>
              <p className="lead mb-3 delens-hero-subtitle">
                {t("homeHeroSubtitle")}
              </p>
              <p
                className="fs-5 mb-4 mx-auto delens-hero-description"
                style={{ maxWidth: "720px" }}
              >
                {t("homeHeroDescription")}
              </p>

              <div className="d-flex gap-3 justify-content-center flex-wrap delens-cta-row">
                <Link to="/explorer" className="btn btn-primary btn-lg">
                  {t("startExploring")}
                </Link>
                <Link to="/about" className="btn btn-outline-primary btn-lg">
                  {t("learnMore")}
                </Link>
              </div>

              <div className="row g-3 mt-4 text-start">
                <div className="col-md-4">
                  <div className="delens-soft-card p-3 h-100">
                    <h6 className="fw-bold mb-1">Explorer</h6>
                    <p className="small text-muted mb-0">
                      Build and run Elasticsearch requests with instant response
                      previews.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="delens-soft-card p-3 h-100">
                    <h6 className="fw-bold mb-1">Time Series</h6>
                    <p className="small text-muted mb-0">
                      Move from guided filters to trend insights in a few
                      clicks.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="delens-soft-card p-3 h-100">
                    <h6 className="fw-bold mb-1">Spatial Analytics</h6>
                    <p className="small text-muted mb-0">
                      Explore demographics and urbanization patterns in 2D and
                      3D.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
