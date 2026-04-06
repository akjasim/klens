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
      demographics: "Demographics",
      urbanization: "Urbanization",
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

      // Demographic Indicator Page
      demographicIndicatorTitle: "Demographic Indicator",
      demographicIndicatorSubtitle:
        "Explore Germany's population structure by age groups over time",
      demographicIndicatorHelp:
        "View how Germany's population composition has changed from 1995 to 2022, broken down by age groups. Watch the animation to see demographic shifts year by year.",
      demographicChartTitle: "Population by Age Group",
      demographicChartExplanation:
        "This chart shows the distribution of Germany's population across different age groups, animated year by year. Changes in these groups reflect birth rates, mortality, and migration patterns.",
      populationByAgeGroup: "Population by Age Group",
      ageGroup: "Age Group",
      population: "Population",
      fetchingDemographicsData: "Fetching demographics data...",
      latestYear: "Latest Year",
      totalPopulation: "Total Population",
      ageGroupsCount: "Age Groups",
      timeRangeLabel: "Time Range",
      totalDataPoints: "Total Data Points",

      // Urbanization Page
      urbanizationTitle: "Urbanization",
      urbanizationSubtitle:
        "Explore urbanization patterns across German states",
      urbanizationHelp:
        "View population distribution across Bundesländer over time",
      urbanizationChartTitle: "Population by Bundesland",
      fetchingUrbanizationData: "Fetching urbanization data...",

      // About Page
      aboutTitle: "About DELens",
      aboutUsBadge: "About Us",
      aboutLead:
        "DELens is an interactive platform inspired by GapMinder to explore and understand real data across Germany.",
      aboutMissionTitle: "Our Mission",
      aboutMissionBody:
        "Make public data easier to access, compare, and understand through visual storytelling and interactive exploration.",
      aboutWhatYouCanDoTitle: "What You Can Do",
      aboutFeature1:
        "Analyze time-series indicators by place, category, and metric.",
      aboutFeature2:
        "Explore demographic changes across age groups and gender.",
      aboutFeature3:
        "Investigate state and district-level trends in urbanization-related indicators.",
      aboutFeature4:
        "Run custom Elasticsearch queries in the built-in Explorer.",
      aboutTechTitle: "Technology",
      aboutTechBody:
        "DELens is built with React, Vite, Plotly, Three.js, and Bootstrap, with multilingual support via i18next.",
      aboutDataTitle: "Data Access",
      aboutDataBody:
        "Data requests are sent through a secure Netlify function proxy that forwards validated payloads to the public Elasticsearch endpoint.",
      aboutBackHint:
        "Use the actions below to continue exploring the platform.",
      aboutCtaExplore: "Open Explorer",
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
      demographics: "Demografie",
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

      // Demographic Indicator Page
      demographicIndicatorTitle: "Demografischer Indikator",
      demographicIndicatorSubtitle:
        "Erkunden Sie Deutschlands Bevölkerungsstruktur nach Altersgruppen im Zeitverlauf",
      demographicIndicatorHelp:
        "Sehen Sie, wie sich Deutschlands Bevölkerungszusammensetzung von 1995 bis 2022 verändert hat, aufgeschlüsselt nach Altersgruppen. Sehen Sie sich die Animation an, um demografische Verschiebungen Jahr für Jahr zu verfolgen.",
      demographicChartTitle: "Bevölkerung nach Altersgruppe",
      demographicChartExplanation:
        "Dieses Diagramm zeigt die Verteilung der deutschen Bevölkerung auf verschiedene Altersgruppen, animiert Jahr für Jahr. Änderungen in diesen Gruppen spiegeln Geburtsraten, Sterblichkeit und Migrationsmuster wider.",
      populationByAgeGroup: "Bevölkerung nach Altersgruppe",
      ageGroup: "Altersgruppe",
      population: "Bevölkerung",
      fetchingDemographicsData: "Demografiedaten werden geladen...",
      latestYear: "Letztes Jahr",
      totalPopulation: "Gesamtbevölkerung",
      ageGroupsCount: "Altersgruppen",
      timeRangeLabel: "Zeitraum",
      totalDataPoints: "Gesamtdatenpunkte",

      // Urbanization Page
      urbanizationTitle: "Urbanisierung",
      urbanizationSubtitle:
        "Erkunden Sie Urbanisierungsmuster in deutschen Bundesländern",
      urbanizationHelp:
        "Sehen Sie die Bevölkerungsverteilung über Bundesländer im Laufe der Zeit",
      urbanizationChartTitle: "Bevölkerung nach Bundesland",
      fetchingUrbanizationData: "Urbanisierungsdaten werden abgerufen...",

      // About Page
      aboutTitle: "Über DELens",
      aboutUsBadge: "Über uns",
      aboutLead:
        "DELens ist eine interaktive Plattform, inspiriert von GapMinder, um reale Daten aus Deutschland zu erkunden und besser zu verstehen.",
      aboutMissionTitle: "Unsere Mission",
      aboutMissionBody:
        "Oeffentliche Daten durch visuelles Storytelling und interaktive Analyse leichter zuganglich und verstaendlich machen.",
      aboutWhatYouCanDoTitle: "Was Sie tun koennen",
      aboutFeature1:
        "Zeitreihenindikatoren nach Ort, Kategorie und Kennzahl analysieren.",
      aboutFeature2:
        "Demografische Veraenderungen nach Altersgruppen und Geschlecht untersuchen.",
      aboutFeature3:
        "Trends auf Bundesland- und Kreisebene zu urbanisierungsbezogenen Indikatoren erkunden.",
      aboutFeature4:
        "Eigene Elasticsearch-Abfragen im integrierten Explorer ausfuehren.",
      aboutTechTitle: "Technologie",
      aboutTechBody:
        "DELens basiert auf React, Vite, Plotly, Three.js und Bootstrap sowie Mehrsprachigkeit mit i18next.",
      aboutDataTitle: "Datenzugriff",
      aboutDataBody:
        "Datenanfragen laufen ueber eine sichere Netlify-Function als Proxy und werden an den oeffentlichen Elasticsearch-Endpunkt weitergeleitet.",
      aboutBackHint:
        "Nutzen Sie die folgenden Aktionen, um die Plattform weiter zu erkunden.",
      aboutCtaExplore: "Explorer oeffnen",
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
