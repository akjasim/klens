import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section
      className="w-100 d-flex align-items-center justify-content-center"
      style={{ minHeight: "500px" }}
    >
      <div className="text-center">
        <div className="mb-4">
          <h1 className="display-5 fw-bold text-primary">
            {t("notFoundTitle")}
          </h1>
          <p className="text-muted">{t("notFoundMessage")}</p>
        </div>
        <Link to="/" className="btn btn-outline-primary">
          {t("goBackHome")}
        </Link>
      </div>
    </section>
  );
}
