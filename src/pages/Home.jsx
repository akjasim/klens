import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <section className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <h1 className="display-4 fw-bold text-primary mb-4">
          📊 {t("homeHeroTitle")}
        </h1>
        <p className="lead text-muted mb-4">{t("homeHeroSubtitle")}</p>
        <p className="fs-5 text-secondary mb-5" style={{ maxWidth: "500px" }}>
          {t("homeHeroDescription")}
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/explorer" className="btn btn-primary btn-lg">
            {t("startExploring")}
          </Link>
          <Link to="/about" className="btn btn-outline-primary btn-lg">
            {t("learnMore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
