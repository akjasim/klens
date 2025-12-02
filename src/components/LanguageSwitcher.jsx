import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="btn-group btn-group-sm" role="group">
      <button
        type="button"
        className={`btn ${
          i18n.language === "en" ? "btn-primary" : "btn-outline-primary"
        }`}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={`btn ${
          i18n.language === "de" ? "btn-primary" : "btn-outline-primary"
        }`}
        onClick={() => changeLanguage("de")}
      >
        DE
      </button>
    </div>
  );
};

export default LanguageSwitcher;
