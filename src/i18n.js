import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      about: "About",
      explorer: "Explorer",
      timeSeries: "Time Series",
      chart: "Chart",
      spotify: "Spotify",

      // Time Series Page
      timeSeriesTitle: "Time Series Analysis",
      timeSeriesSubtitle:
        "Explore trends by Spatial reference, Place, Category, and Indicator",
      timeSeriesHelp:
        "Select a Spatial reference, Place, Category, and Indicator to visualize temporal patterns for your selection.",

      // Form Labels
      selectRaumbezug: "Select Spatial reference",
      selectPlace: "Select Place",
      selectBereich: "Select Category",
      selectIndicator: "Select Indicator",
      chooseRaumbezug: "-- Choose Spatial reference --",
      choosePlace: "-- Choose a Place --",
      chooseBereich: "-- Choose a Category --",
      chooseIndicator: "-- Choose an Indicator --",

      // Buttons
      apply: "Apply",
      reset: "Reset",
      loading: "Loading...",

      // Chart
      chartTitle: "Time Series",
      dataOverTime: "Data Over Time",
      year: "Year",
      value: "Value (%)",
      noData: "No data available for the selected criteria.",

      // Insights
      raumbezug: "Spatial reference",
      place: "Place",
      category: "Category",
      indicator: "Indicator",
      overallTrend: "Overall trend",
      peak: "Peak",
      low: "Low",
      biggestRise: "Biggest rise",
      sharpestDrop: "Sharpest drop",
      in: "in",
      insightsExplanation:
        "Possible drivers include local policy changes, economic shifts, or demographic trends. Compare related indicators within the same",
      forContext: "for additional context.",
      selected: "selected",
      compareNote:
        "Insights shown for first selected place. Compare multiple lines on the chart.",

      // Loading & Error States
      fetchingData: "Fetching time series data...",
      error: "Error",
      firstSelectRaumbezug: "First select Spatial reference",
      selectPlaceFirst: "Select place first",
      selectBereichFirst: "Select category first",
      loadingPlaces: "Loading places...",
      loadingBereich: "Loading...",
      loadingIndicators: "Loading indicators...",
      notFound: "not found",

      // Home Page
      homeHeroTitle: "Discover Insights",
      homeHeroSubtitle:
        "Unlock the stories hidden in Deutschland's public data",
      homeHeroDescription:
        "Explore real datasets from across Germany and understand what makes Deutschland tick.",
      startExploring: "Start Exploring",
      learnMore: "Learn More",

      // About Page
      aboutTitle: "About DELens",
      aboutLead:
        "DELens aims to create a web-based tool, similar to GapMinder, to explore and understand real data across Deutschland (Germany).",
      aboutBody1:
        "Use the Spotify page to run curated sample queries, inspect the underlying request payload, and compare the results on a chart. This demo is intentionally small so it can be adapted to other datasets or used as a starting point for a richer analytics UI.",
      aboutBackHint:
        "Need to go back? Use the button below or the navigation links above.",
      backToHome: "Back to Home",

      // NotFound Page
      notFoundTitle: "Page not found",
      notFoundMessage:
        "The page you are looking for doesn't exist or was moved.",
      goBackHome: "Go back home",

      // Explorer Page
      explorerTitle: "Query Builder",
      indexName: "indexName",
      indexAction: "indexAction",
      requestType: "requestType",
      dataForRemote: "dataForRemote",
      additionalPath: "additionalPath",
      saveAsNameOptional: "saveAsName (optional)",
      formatJson: "Format JSON",
      running: "Running…",
      run: "Run",
      response: "Response",
      status: "Status",
      copy: "Copy",
      hideHistory: "Hide History",
      showHistory: "Show History",
      responsePlaceholder: "Response will appear here after submitting.",
      history: "History",
      deleteAllHistory: "Delete all history",
    },
  },
  de: {
    translation: {
      // Navigation
      home: "Startseite",
      about: "Über",
      explorer: "Explorer",
      timeSeries: "Zeitreihen",
      chart: "Diagramm",
      spotify: "Spotify",

      // Time Series Page
      timeSeriesTitle: "Zeitreihenanalyse",
      timeSeriesSubtitle:
        "Erkunden Sie Trends nach Raumbezug, Ort, Bereich und Indikator",
      timeSeriesHelp:
        "Wählen Sie einen Raumbezug, einen Ort, einen Bereich (Kategorie) und einen Indikator aus, um zeitliche Muster Ihrer Auswahl zu visualisieren.",

      // Form Labels
      selectRaumbezug: "Raumbezug auswählen",
      selectPlace: "Ort auswählen",
      selectBereich: "Bereich auswählen",
      selectIndicator: "Indikator auswählen",
      chooseRaumbezug: "-- Raumbezug wählen --",
      choosePlace: "-- Ort wählen --",
      chooseBereich: "-- Bereich wählen --",
      chooseIndicator: "-- Indikator wählen --",

      // Buttons
      apply: "Anwenden",
      reset: "Zurücksetzen",
      loading: "Lädt...",

      // Chart
      chartTitle: "Zeitreihe",
      dataOverTime: "Daten im Zeitverlauf",
      year: "Jahr",
      value: "Wert (%)",
      noData: "Keine Daten für die ausgewählten Kriterien verfügbar.",

      // Insights
      raumbezug: "Raumbezug",
      place: "Ort",
      category: "Kategorie",
      indicator: "Indikator",
      overallTrend: "Gesamttrend",
      peak: "Höchstwert",
      low: "Tiefstwert",
      biggestRise: "Größter Anstieg",
      sharpestDrop: "Stärkster Rückgang",
      in: "im Jahr",
      insightsExplanation:
        "Mögliche Treiber sind lokale politische Veränderungen, wirtschaftliche Verschiebungen oder demografische Trends. Vergleichen Sie verwandte Indikatoren innerhalb desselben",
      forContext: "für zusätzlichen Kontext.",
      selected: "ausgewählt",
      compareNote:
        "Erkenntnisse für den ersten ausgewählten Ort. Vergleichen Sie mehrere Linien im Diagramm.",

      // Loading & Error States
      fetchingData: "Zeitreihendaten werden geladen...",
      error: "Fehler",
      firstSelectRaumbezug: "Bitte zuerst Raumbezug wählen",
      selectPlaceFirst: "Bitte zuerst Ort wählen",
      selectBereichFirst: "Bitte zuerst Bereich wählen",
      loadingPlaces: "Orte werden geladen...",
      loadingBereich: "Wird geladen...",
      loadingIndicators: "Indikatoren werden geladen...",
      notFound: "nicht gefunden",

      // Home Page
      homeHeroTitle: "Erkenntnisse entdecken",
      homeHeroSubtitle:
        "Entdecken Sie die Geschichten hinter öffentlichen Daten in Deutschland",
      homeHeroDescription:
        "Erkunden Sie reale Datensätze aus ganz Deutschland und verstehen Sie, was Deutschland bewegt.",
      startExploring: "Jetzt erkunden",
      learnMore: "Mehr erfahren",

      // About Page
      aboutTitle: "Über DELens",
      aboutLead:
        "DELens ist ein webbasiertes Tool, ähnlich wie GapMinder, um reale Daten aus Deutschland zu erkunden und zu verstehen.",
      aboutBody1:
        "Verwenden Sie die Spotify-Seite, um kuratierte Beispielabfragen auszuführen, die zugrunde liegende Anfrage zu prüfen und die Ergebnisse in einem Diagramm zu vergleichen. Diese Demo ist bewusst klein gehalten und kann auf andere Datensätze angepasst oder als Ausgangspunkt für eine umfangreichere Analytics-UI genutzt werden.",
      aboutBackHint:
        "Müssen Sie zurück? Verwenden Sie die Schaltfläche unten oder die Navigationslinks oben.",
      backToHome: "Zurück zur Startseite",

      // NotFound Page
      notFoundTitle: "Seite nicht gefunden",
      notFoundMessage:
        "Die gesuchte Seite existiert nicht oder wurde verschoben.",
      goBackHome: "Zur Startseite",

      // Explorer Page
      explorerTitle: "Abfrage-Builder",
      indexName: "indexName",
      indexAction: "indexAction",
      requestType: "requestType",
      dataForRemote: "dataForRemote",
      additionalPath: "additionalPath",
      saveAsNameOptional: "saveAsName (optional)",
      formatJson: "JSON formatieren",
      running: "Wird ausgeführt…",
      run: "Ausführen",
      response: "Antwort",
      status: "Status",
      copy: "Kopieren",
      hideHistory: "Verlauf ausblenden",
      showHistory: "Verlauf anzeigen",
      responsePlaceholder: "Die Antwort erscheint nach dem Absenden hier.",
      history: "Verlauf",
      deleteAllHistory: "Gesamten Verlauf löschen",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
