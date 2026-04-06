import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();

  const capabilities = [
    t("aboutFeature1"),
    t("aboutFeature2"),
    t("aboutFeature3"),
    t("aboutFeature4"),
  ];

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-xl-10 col-lg-11">
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-body p-4 p-md-5">
              <span className="badge text-bg-primary mb-3">
                {t("aboutUsBadge")}
              </span>

              <h1 className="display-6 fw-bold text-primary mb-3">
                {t("aboutTitle")}
              </h1>
              <p className="lead text-muted mb-4">{t("aboutLead")}</p>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="h-100 border rounded-3 p-3 bg-light-subtle">
                    <h2 className="h5 mb-2">{t("aboutMissionTitle")}</h2>
                    <p className="mb-0 text-secondary">
                      {t("aboutMissionBody")}
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="h-100 border rounded-3 p-3 bg-light-subtle">
                    <h2 className="h5 mb-2">{t("aboutWhatYouCanDoTitle")}</h2>
                    <ul className="mb-0 ps-3">
                      {capabilities.map((item) => (
                        <li key={item} className="mb-1 text-secondary">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 h-100">
                    <h3 className="h6 text-uppercase text-muted mb-2">
                      {t("aboutTechTitle")}
                    </h3>
                    <p className="mb-0">{t("aboutTechBody")}</p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="border rounded-3 p-3 h-100">
                    <h3 className="h6 text-uppercase text-muted mb-2">
                      {t("aboutDataTitle")}
                    </h3>
                    <p className="mb-0">{t("aboutDataBody")}</p>
                  </div>
                </div>
              </div>

              <p className="mb-4 text-secondary">{t("aboutBackHint")}</p>

              <div className="d-flex flex-wrap gap-2">
                <Link to="/explorer" className="btn btn-primary">
                  {t("aboutCtaExplore")}
                </Link>
                <Link to="/" className="btn btn-outline-primary">
                  {t("backToHome")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
