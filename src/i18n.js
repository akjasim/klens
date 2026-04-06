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
      failedToFetchData: "Failed to fetch data",
      failedToLoad: "Failed to load",
      failedToLoadPlaces: "Failed to load places",
      failedToLoadCategory: "Failed to load category",
      failedToLoadIndicators: "Failed to load indicators",

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
      populationByGender: "Population by Gender",
      years: "Years",
      populationMillions: "Population (M)",
      highestPopulation: "Highest population",
      lowestPopulation: "Lowest population",
      totalsAggregateAgeGroups: "Totals aggregate all age groups per year.",
      highestDrop: "Highest drop",
      vs: "vs",
      pause: "Pause",
      play: "Play",
      ageGroupDistributionMillions: "Age Group Distribution (millions)",
      workingClassBreakdownMillions: "Working Class Breakdown (millions)",
      maleAndFemale: "Male & Female",
      highestTotal: "Highest total",
      lowestTotal: "Lowest total",
      totalsCombineMaleFemale:
        "Totals combine male and female populations per year.",
      bar: "Bar",
      pie: "Pie",
      failedToFetchDemographicsData: "Failed to fetch demographics data",

      // Urbanization Page
      urbanizationTitle: "Urbanization",
      urbanizationSubtitle:
        "Explore urbanization patterns across German states",
      urbanizationHelp:
        "View population distribution across Bundesländer over time",
      urbanizationChartTitle: "Population by Bundesland",
      fetchingUrbanizationData: "Fetching urbanization data...",
      urbanizationPopulation: "Population",
      urbanizationPopulationSubtitle: "Height = Population | Color = Density",
      urbanizationInternetSpeed: "Internet Speed",
      urbanizationInternetSpeedSubtitle:
        "Height = Availability % | Color = Coverage Level",
      urbanizationBirthRate: "Birth Rate",
      urbanizationBirthRateSubtitle:
        "Height = Births per 1,000 people | Color = Coverage Level",
      urbanizationDeathRate: "Death Rate",
      urbanizationDeathRateSubtitle:
        "Height = Deaths per 1,000 people | Color = Coverage Level",
      urbanizationImmigrationRate: "Immigration Rate",
      urbanizationImmigrationRateSubtitle:
        "Height = Zuzugsrate per 1,000 people | Color = Coverage Level",
      urbanizationEmigrationRate: "Emigration Rate",
      urbanizationEmigrationRateSubtitle:
        "Height = Fortzugsrate per 1,000 people | Color = Coverage Level",
      urbanizationEstimatedBirths: "Estimated births",
      urbanizationEstimatedDeaths: "Estimated deaths",
      urbanizationEstimatedImmigrants: "Estimated immigrants",
      urbanizationEstimatedEmigrants: "Estimated emigrants",
      urbanizationToggleTerrainTitle:
        "Toggle between flat 2D map and 3D terrain",
      urbanizationEnterFullscreen: "Enter Fullscreen",
      urbanizationExitFullscreen: "Exit Fullscreen",
      urbanizationFullscreen: "Fullscreen",
      urbanizationPopulationDataTitle: "Population data",
      urbanizationInternetSpeedDataTitle: "Internet speed data",
      urbanizationSpeed50Title: "50 Mbit/s availability",
      urbanizationSpeed100Title: "100 Mbit/s availability",
      urbanizationSpeed1000Title: "1000 Mbit/s (1 Gbit/s) availability",
      urbanizationBirthRateDataTitle:
        "Birth rate data (people born per 1,000 people)",
      urbanizationDeathRateDataTitle:
        "Death rate data (people died per 1,000 people)",
      urbanizationImmigrationRateDataTitle:
        "Zuzugsrate data (people moving in per 1,000 people)",
      urbanizationEmigrationRateDataTitle:
        "Fortzugsrate data (people moving out per 1,000 people)",
      urbanizationBirth: "Birth",
      urbanizationDeath: "Death",
      urbanizationImmigration: "Immigration",
      urbanizationEmigration: "Emigration",
      urbanizationWarmGradientTitle: "Warm gradient: Yellow -> Orange -> Red",
      urbanizationCoolGradientTitle: "Cool gradient: Light Blue -> Dark Blue",
      urbanizationWarm: "Warm",
      urbanizationCool: "Cool",
      urbanizationFastForwardTitle: "Fast forward (5x speed, infinite loop)",
      urbanizationCategoryLabel: "Category",
      urbanizationColorScaleLabel: "Color Scale",
      urbanizationColorScaleWarm: "Yellow (Low) -> Red (High)",
      urbanizationColorScaleCool: "Light Blue (Low) -> Dark Blue (High)",
      urbanizationHoverStatesHint: "Hover over states to see details",
      urbanizationKreiseSubtitle:
        "Kreise (districts) separated by administrative borders",
      urbanizationBackToStateViewTitle: "Back to state-level view",
      urbanizationBackToStates: "Back to States",
      urbanizationHoverKreiseHint:
        "Hover over Kreise to see details. Click states on the main map to zoom in.",
      urbanizationLoadingKreiseFor: "Loading Kreise data for",
      urbanizationNoData: "No data",
      urbanizationNoKreiseDataFor: "No Kreise data found for",
      urbanizationAvailability: "availability",
      urbanizationRatePerThousand: "Rate (per 1,000)",

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
      invalidJsonInDataForRemote: "Invalid JSON in dataForRemote",
      cannotFormatInvalidJson: "Cannot format: invalid JSON",
      copied: "Copied!",
      clipboardNotSupported: "Clipboard not supported",
      copyFailed: "Copy failed",
      requestFailed: "Request failed",
      optional: "optional",
      myQueryName: "My Query Name",
      spotifyExplorer: "Spotify Explorer",
      runQuery: "Run Query",
      queryResult: "Query Result",
      entriesFound: "entries found",
      explanation: "Explanation",
      requestPayload: "Request Payload",
      runQueriesToSeeChart: "Run some queries to see the chart",
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
      failedToFetchData: "Daten konnten nicht geladen werden",
      failedToLoad: "Laden fehlgeschlagen",
      failedToLoadPlaces: "Orte konnten nicht geladen werden",
      failedToLoadCategory: "Kategorie konnte nicht geladen werden",
      failedToLoadIndicators: "Indikatoren konnten nicht geladen werden",

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
      populationByGender: "Bevoelkerung nach Geschlecht",
      years: "Jahre",
      populationMillions: "Bevoelkerung (M)",
      highestPopulation: "Hoechste Bevoelkerung",
      lowestPopulation: "Niedrigste Bevoelkerung",
      totalsAggregateAgeGroups:
        "Summen aggregieren alle Altersgruppen pro Jahr.",
      highestDrop: "Groesster Rueckgang",
      vs: "vs",
      pause: "Pause",
      play: "Play",
      ageGroupDistributionMillions: "Verteilung der Altersgruppen (Millionen)",
      workingClassBreakdownMillions:
        "Aufschluesselung der Erwerbsbevoelkerung (Millionen)",
      maleAndFemale: "Maennlich & Weiblich",
      highestTotal: "Hoechste Gesamtzahl",
      lowestTotal: "Niedrigste Gesamtzahl",
      totalsCombineMaleFemale:
        "Summen kombinieren maennliche und weibliche Bevoelkerung pro Jahr.",
      bar: "Balken",
      pie: "Kreis",
      failedToFetchDemographicsData:
        "Demografiedaten konnten nicht geladen werden",

      // Urbanization Page
      urbanizationTitle: "Urbanisierung",
      urbanizationSubtitle:
        "Erkunden Sie Urbanisierungsmuster in deutschen Bundesländern",
      urbanizationHelp:
        "Sehen Sie die Bevölkerungsverteilung über Bundesländer im Laufe der Zeit",
      urbanizationChartTitle: "Bevölkerung nach Bundesland",
      fetchingUrbanizationData: "Urbanisierungsdaten werden abgerufen...",
      urbanizationPopulation: "Bevoelkerung",
      urbanizationPopulationSubtitle: "Hoehe = Bevoelkerung | Farbe = Dichte",
      urbanizationInternetSpeed: "Internetgeschwindigkeit",
      urbanizationInternetSpeedSubtitle:
        "Hoehe = Verfuegbarkeit % | Farbe = Abdeckungsgrad",
      urbanizationBirthRate: "Geburtenrate",
      urbanizationBirthRateSubtitle:
        "Hoehe = Geburten pro 1.000 Personen | Farbe = Abdeckungsgrad",
      urbanizationDeathRate: "Sterberate",
      urbanizationDeathRateSubtitle:
        "Hoehe = Sterbefaelle pro 1.000 Personen | Farbe = Abdeckungsgrad",
      urbanizationImmigrationRate: "Zuzugsrate",
      urbanizationImmigrationRateSubtitle:
        "Hoehe = Zuzugsrate pro 1.000 Personen | Farbe = Abdeckungsgrad",
      urbanizationEmigrationRate: "Fortzugsrate",
      urbanizationEmigrationRateSubtitle:
        "Hoehe = Fortzugsrate pro 1.000 Personen | Farbe = Abdeckungsgrad",
      urbanizationEstimatedBirths: "Geschaetzte Geburten",
      urbanizationEstimatedDeaths: "Geschaetzte Sterbefaelle",
      urbanizationEstimatedImmigrants: "Geschaetzte Zugezogene",
      urbanizationEstimatedEmigrants: "Geschaetzte Fortgezogene",
      urbanizationToggleTerrainTitle:
        "Zwischen flacher 2D-Karte und 3D-Gelaende wechseln",
      urbanizationEnterFullscreen: "Vollbild starten",
      urbanizationExitFullscreen: "Vollbild beenden",
      urbanizationFullscreen: "Vollbild",
      urbanizationPopulationDataTitle: "Bevoelkerungsdaten",
      urbanizationInternetSpeedDataTitle: "Internetgeschwindigkeitsdaten",
      urbanizationSpeed50Title: "50 Mbit/s Verfuegbarkeit",
      urbanizationSpeed100Title: "100 Mbit/s Verfuegbarkeit",
      urbanizationSpeed1000Title: "1000 Mbit/s (1 Gbit/s) Verfuegbarkeit",
      urbanizationBirthRateDataTitle:
        "Geburtenrate (Geborene pro 1.000 Personen)",
      urbanizationDeathRateDataTitle:
        "Sterberate (Gestorbene pro 1.000 Personen)",
      urbanizationImmigrationRateDataTitle:
        "Zuzugsrate (Zuzuege pro 1.000 Personen)",
      urbanizationEmigrationRateDataTitle:
        "Fortzugsrate (Fortzuege pro 1.000 Personen)",
      urbanizationBirth: "Geburt",
      urbanizationDeath: "Tod",
      urbanizationImmigration: "Zuzug",
      urbanizationEmigration: "Fortzug",
      urbanizationWarmGradientTitle: "Warmer Verlauf: Gelb -> Orange -> Rot",
      urbanizationCoolGradientTitle: "Kuehler Verlauf: Hellblau -> Dunkelblau",
      urbanizationWarm: "Warm",
      urbanizationCool: "Kuehl",
      urbanizationFastForwardTitle: "Schneller Vorlauf (5x, Endlosschleife)",
      urbanizationCategoryLabel: "Kategorie",
      urbanizationColorScaleLabel: "Farbskala",
      urbanizationColorScaleWarm: "Gelb (Niedrig) -> Rot (Hoch)",
      urbanizationColorScaleCool: "Hellblau (Niedrig) -> Dunkelblau (Hoch)",
      urbanizationHoverStatesHint:
        "Mit der Maus ueber Bundeslaender fahren, um Details zu sehen",
      urbanizationKreiseSubtitle:
        "Kreise, getrennt durch administrative Grenzen",
      urbanizationBackToStateViewTitle: "Zurueck zur Bundesland-Ansicht",
      urbanizationBackToStates: "Zurueck zu den Bundeslaendern",
      urbanizationHoverKreiseHint:
        "Mit der Maus ueber Kreise fahren, um Details zu sehen. Klicken Sie in der Hauptkarte auf Bundeslaender zum Hineinzoomen.",
      urbanizationLoadingKreiseFor: "Kreise-Daten werden geladen fuer",
      urbanizationNoData: "Keine Daten",
      urbanizationNoKreiseDataFor: "Keine Kreis-Daten gefunden fuer",
      urbanizationAvailability: "Verfuegbarkeit",
      urbanizationRatePerThousand: "Rate (pro 1.000)",

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
      invalidJsonInDataForRemote: "Ungueltiges JSON in dataForRemote",
      cannotFormatInvalidJson: "Formatieren nicht moeglich: ungueltiges JSON",
      copied: "Kopiert!",
      clipboardNotSupported: "Zwischenablage wird nicht unterstuetzt",
      copyFailed: "Kopieren fehlgeschlagen",
      requestFailed: "Anfrage fehlgeschlagen",
      optional: "optional",
      myQueryName: "Mein Abfragename",
      spotifyExplorer: "Spotify Explorer",
      runQuery: "Abfrage starten",
      queryResult: "Abfrageergebnis",
      entriesFound: "Eintraege gefunden",
      explanation: "Erklaerung",
      requestPayload: "Anfrage-Payload",
      runQueriesToSeeChart:
        "Fuehren Sie Abfragen aus, um das Diagramm zu sehen",
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
