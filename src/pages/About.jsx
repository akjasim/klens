import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h1 className="h3 text-primary mb-3">{t("aboutTitle")}</h1>
              <p className="lead text-muted">{t("aboutLead")}</p>
              <p>{t("aboutBody1")}</p>
              <p className="mb-4">{t("aboutBackHint")}</p>
              <Link to="/" className="btn btn-primary">
                {t("backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
