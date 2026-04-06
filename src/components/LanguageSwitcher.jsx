import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.language?.startsWith("de") ? "de" : "en";

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="lang-picker" role="group" aria-label="Language picker">
      <button
        type="button"
        className={`lang-picker-btn ${
          activeLanguage === "en" ? "lang-picker-btn-active" : ""
        }`}
        onClick={() => changeLanguage("en")}
        aria-pressed={activeLanguage === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-picker-btn ${
          activeLanguage === "de" ? "lang-picker-btn-active" : ""
        }`}
        onClick={() => changeLanguage("de")}
        aria-pressed={activeLanguage === "de"}
      >
        DE
      </button>
    </div>
  );
};

export default LanguageSwitcher;
