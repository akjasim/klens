import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Plot from "react-plotly.js";
import {
  fetchDemographicsData,
  fetchGenderData,
  fetchTotalPopulation,
} from "../api/elasticsearch";
import { formatNumber } from "../helpers";

export default function DemographicIndicator() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("ageGroup"); // "ageGroup" or "gender"
  const [genderChartType, setGenderChartType] = useState("bar"); // "bar" or "pie"
  const [demographicsData, setDemographicsData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [showChart, setShowChart] = useState(false);

  // Fetch demographics data on mount
  useEffect(() => {
    const fetchData = async () => {
      setDataError(null);
      setDataLoading(true);
      setShowChart(false);

      try {
        const [demoData, genderDataResult, totalPopulationResult] =
          await Promise.all([
            fetchDemographicsData(),
            fetchGenderData(),
            fetchTotalPopulation(),
          ]);

        // Data is already transformed with { year, ageGroup, population, indicatorName }
        const transformedDemo = demoData
          .filter((d) => !isNaN(d.year) && !isNaN(d.population))
          .sort(
            (a, b) => a.year - b.year || a.ageGroup.localeCompare(b.ageGroup),
          );

        const transformedGender = genderDataResult
          .filter((d) => !isNaN(d.year) && !isNaN(d.population))
          .sort((a, b) => a.year - b.year);

        // Map total population per year
        const totalPopulationByYear = new Map(
          totalPopulationResult
            .filter((d) => !isNaN(d.year) && !isNaN(d.population))
            .map((d) => [d.year, d.population]),
        );

        // Convert percentage shares into absolute counts (millions) using total population
        const demographicsWithAbsolute = transformedDemo.map((d) => {
          const totalPop = totalPopulationByYear.get(d.year) || 0;
          const absolute = (totalPop * (d.population / 100)) / 1_000_000; // millions
          return { ...d, populationMillions: absolute };
        });

        setDemographicsData(demographicsWithAbsolute);
        setGenderData(transformedGender);
        setShowChart(true);
      } catch (err) {
        setDataError(err.message || "Failed to fetch demographics data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique years and age groups
  const years = [...new Set(demographicsData.map((d) => d.year))].sort(
    (a, b) => a - b,
  );

  // Define age group order for consistent display
  const ageGroupOrder = [
    "0-3",
    "3-6",
    "6-18",
    "18-25",
    "25-30",
    "30-50",
    "50-65",
    "65-75",
    "75+",
  ];

  const broadAgeGroups = [
    ...new Set(demographicsData.map((d) => d.ageGroup)),
  ].sort((a, b) => ageGroupOrder.indexOf(a) - ageGroupOrder.indexOf(b));

  // Define colors for age groups
  const ageGroupColors = {
    "0-3": "#0d6efd",
    "3-6": "#198754",
    "6-18": "#dc3545",
    "18-25": "#ffc107",
    "25-30": "#0dcaf0",
    "30-50": "#6f42c1",
    "50-65": "#fd7e14",
    "65-75": "#20c997",
    "75+": "#e83e8c",
  };

  const firstYear = years[0];

  // Helper to get population in millions for a given year and age group
  const getPopulationFor = (year, ageGroup) => {
    const found = demographicsData.find(
      (d) => d.year === year && d.ageGroup === ageGroup,
    );
    return found ? found.populationMillions || 0 : 0;
  };

  // Pre-compute max population across all years for y-axis scaling
  const maxAgeGroupPopulationMillions = Math.max(
    0,
    ...demographicsData.map((d) => d.populationMillions || 0),
  );
  const yAxisMax = maxAgeGroupPopulationMillions * 1.1 || 1;
  const yAxisTick = 2;

  const latestYear = years[years.length - 1];
  const totalPopulationLatest = latestYear
    ? demographicsData
        .filter((d) => d.year === latestYear)
        .reduce((sum, d) => sum + (d.populationMillions || 0), 0)
    : 0;
  const totalPopulationFirst = firstYear
    ? demographicsData
        .filter((d) => d.year === firstYear)
        .reduce((sum, d) => sum + (d.populationMillions || 0), 0)
    : 0;
  const populationDelta = totalPopulationLatest - totalPopulationFirst;

  // Totals by year for insights
  const totalsByYear = years.map((year) => ({
    year,
    total: demographicsData
      .filter((d) => d.year === year)
      .reduce((sum, d) => sum + (d.populationMillions || 0), 0),
  }));

  const highestTotal =
    totalsByYear.length > 0
      ? totalsByYear.reduce(
          (acc, item) => (item.total > acc.total ? item : acc),
          totalsByYear[0],
        )
      : { year: "–", total: 0 };

  const lowestTotal =
    totalsByYear.length > 0
      ? totalsByYear.reduce(
          (acc, item) => (item.total < acc.total ? item : acc),
          totalsByYear[0],
        )
      : { year: "–", total: 0 };

  const deltas =
    totalsByYear.length > 1
      ? totalsByYear.slice(1).map((item, idx) => {
          const prev = totalsByYear[idx];
          return {
            from: prev.year,
            to: item.year,
            delta: item.total - prev.total,
          };
        })
      : [];

  const highestSpike = deltas.length
    ? deltas.reduce(
        (acc, item) => (item.delta > acc.delta ? item : acc),
        deltas[0],
      )
    : { from: "–", to: "–", delta: 0 };

  const highestDrop = deltas.length
    ? deltas.reduce(
        (acc, item) => (item.delta < acc.delta ? item : acc),
        deltas[0],
      )
    : { from: "–", to: "–", delta: 0 };

  const topAgeGroupLatest = latestYear
    ? demographicsData
        .filter((d) => d.year === latestYear)
        .reduce(
          (acc, d) =>
            (d.populationMillions || 0) > (acc?.populationMillions || 0)
              ? d
              : acc,
          null,
        )
    : null;

  // Build line trace for a given year (connects age groups for that year)
  const buildLineTraceForYear = (year) => ({
    x: broadAgeGroups,
    y: broadAgeGroups.map((ageGroup) => getPopulationFor(year, ageGroup)),
    name: "Year trend",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#111", width: 3 },
    marker: { size: 8, color: "#111" },
  });

  // Build traces: one trace per age group (x-axis is age groups, y-axis is population in millions)
  const barTraces = broadAgeGroups.map((ageGroup) => {
    return {
      x: [ageGroup],
      y: [getPopulationFor(firstYear, ageGroup)],
      name: ageGroup,
      type: "bar",
      marker: { color: ageGroupColors[ageGroup] },
    };
  });

  const traces = [...barTraces, buildLineTraceForYear(firstYear)];

  // Build frames for animation (one per year, showing that year's distribution)
  const frames = years.map((year, yearIdx) => {
    const tracesForYear = broadAgeGroups.map((ageGroup) => ({
      x: [ageGroup],
      y: [getPopulationFor(year, ageGroup)],
      name: ageGroup,
      type: "bar",
      marker: { color: ageGroupColors[ageGroup] },
    }));

    // Line trace updates with each year
    tracesForYear.push(buildLineTraceForYear(year));

    return {
      name: `frame-${yearIdx}`,
      data: tracesForYear,
      layout: {
        yaxis: {
          autorange: false,
          range: [0, yAxisMax],
          dtick: yAxisTick,
        },
        annotations: [
          {
            text: year.toString(),
            xref: "paper",
            yref: "paper",
            x: 0.5,
            y: 0.5,
            xanchor: "center",
            yanchor: "middle",
            showarrow: false,
            font: {
              size: 160,
              color: "rgba(0, 0, 0, 0.08)",
              family: "Arial, sans-serif",
              weight: "bold",
            },
          },
        ],
      },
    };
  });

  // Calculate statistics for insights
  const hasData = demographicsData.length > 0;
  const totalPopulation = hasData
    ? demographicsData
        .filter((d) => d.year === years[years.length - 1])
        .reduce((sum, d) => sum + (d.populationMillions || 0), 0)
    : 0;

  const highestPopulation = hasData
    ? Math.max(
        ...years.map((year) =>
          demographicsData
            .filter((d) => d.year === year)
            .reduce((sum, d) => sum + (d.populationMillions || 0), 0),
        ),
      )
    : 0;

  const lowestPopulation = hasData
    ? Math.min(
        ...years.map((year) =>
          demographicsData
            .filter((d) => d.year === year)
            .reduce((sum, d) => sum + (d.populationMillions || 0), 0),
        ),
      )
    : 0;

  const highestPopulationYear = hasData
    ? years.find(
        (year) =>
          demographicsData
            .filter((d) => d.year === year)
            .reduce((sum, d) => sum + (d.populationMillions || 0), 0) ===
          highestPopulation,
      )
    : null;

  const lowestPopulationYear = hasData
    ? years.find(
        (year) =>
          demographicsData
            .filter((d) => d.year === year)
            .reduce((sum, d) => sum + (d.populationMillions || 0), 0) ===
          lowestPopulation,
      )
    : null;

  // ============ GENDER CHART DATA ============
  const genderYears = [...new Set(genderData.map((d) => d.year))].sort(
    (a, b) => a - b,
  );

  const genderCategories = ["Male", "Female"];

  const getGenderPopulation = (year, gender) => {
    const found = genderData.find(
      (d) => d.year === year && d.gender === gender,
    );
    return found ? found.population || 0 : 0;
  };

  const maxGenderPopulation = Math.max(
    0,
    ...genderYears.map((y) => getGenderPopulation(y, "Male")),
    ...genderYears.map((y) => getGenderPopulation(y, "Female")),
  );
  // Fixed gender y-axis per request
  const genderYAxisMax = 43_000_000;
  const genderYAxisMin = 39_000_000;
  const genderYAxisTick = 500_000;

  const firstGenderYear = genderYears[0];

  // Helper to get the max population for a given year
  const getMaxGenderPopForYear = (year) => {
    const male = getGenderPopulation(year, "Male");
    const female = getGenderPopulation(year, "Female");
    return Math.max(male, female);
  };

  // Build line trace connecting highest values (initially just first year)
  const buildGenderLineTrace = (year) => ({
    x: genderCategories,
    y: [getGenderPopulation(year, "Male"), getGenderPopulation(year, "Female")],
    name: "Trend",
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#111", width: 3 },
    marker: { size: 8, color: "#111" },
  });

  // Two bars only: Male and Female, animated over years
  const genderTraces = [
    ...genderCategories.map((gender) => ({
      x: [gender],
      y: [getGenderPopulation(firstGenderYear, gender)],
      name: gender,
      type: "bar",
      marker: { color: gender === "Male" ? "#0d6efd" : "#dc3545" },
    })),
    buildGenderLineTrace(firstGenderYear),
  ];

  const genderFrames = genderYears.map((year, yearIdx) => {
    const tracesForYear = [
      ...genderCategories.map((gender) => ({
        x: [gender],
        y: [getGenderPopulation(year, gender)],
        name: gender,
        type: "bar",
        marker: { color: gender === "Male" ? "#0d6efd" : "#dc3545" },
      })),
      buildGenderLineTrace(year),
    ];

    return {
      name: `genderFrame-${yearIdx}`,
      data: tracesForYear,
      layout: {
        yaxis: {
          autorange: false,
          range: [genderYAxisMin, genderYAxisMax],
          dtick: genderYAxisTick,
        },
        xaxis: {
          categoryorder: "array",
          categoryarray: genderCategories,
        },
        annotations: [
          {
            text: year.toString(),
            xref: "paper",
            yref: "paper",
            x: 0.5,
            y: 0.5,
            xanchor: "center",
            yanchor: "middle",
            showarrow: false,
            font: {
              size: 160,
              color: "rgba(0, 0, 0, 0.08)",
              family: "Arial, sans-serif",
              weight: "bold",
            },
          },
        ],
      },
    };
  });

  // Gender insights
  const hasGenderData = genderData.length > 0;
  const latestGenderYear = genderYears[genderYears.length - 1];
  const firstGenderYearData = genderYears[0];

  const genderTotalsByYear = genderYears.map((year) => ({
    year,
    male: getGenderPopulation(year, "Male"),
    female: getGenderPopulation(year, "Female"),
    total:
      getGenderPopulation(year, "Male") + getGenderPopulation(year, "Female"),
  }));

  const highestGenderTotal =
    genderTotalsByYear.length > 0
      ? genderTotalsByYear.reduce(
          (acc, item) => (item.total > acc.total ? item : acc),
          genderTotalsByYear[0],
        )
      : { year: "–", total: 0, male: 0, female: 0 };

  const lowestGenderTotal =
    genderTotalsByYear.length > 0
      ? genderTotalsByYear.reduce(
          (acc, item) => (item.total < acc.total ? item : acc),
          genderTotalsByYear[0],
        )
      : { year: "–", total: 0, male: 0, female: 0 };

  const genderDeltas =
    genderTotalsByYear.length > 1
      ? genderTotalsByYear.slice(1).map((item, idx) => {
          const prev = genderTotalsByYear[idx];
          return {
            from: prev.year,
            to: item.year,
            delta: item.total - prev.total,
          };
        })
      : [];

  const highestGenderSpike = genderDeltas.length
    ? genderDeltas.reduce(
        (acc, item) => (item.delta > acc.delta ? item : acc),
        genderDeltas[0],
      )
    : { from: "–", to: "–", delta: 0 };

  const highestGenderDrop = genderDeltas.length
    ? genderDeltas.reduce(
        (acc, item) => (item.delta < acc.delta ? item : acc),
        genderDeltas[0],
      )
    : { from: "–", to: "–", delta: 0 };

  // Pie chart traces and frames
  const genderPieTraces = [
    {
      labels: genderCategories,
      values: genderCategories.map((gender) =>
        getGenderPopulation(firstGenderYear, gender),
      ),
      type: "pie",
      marker: {
        colors: ["#0d6efd", "#dc3545"],
      },
      textinfo: "label+percent",
      hoverinfo: "label+value+percent",
    },
  ];

  const genderPieFrames = genderYears.map((year, yearIdx) => ({
    name: `genderPieFrame-${yearIdx}`,
    data: [
      {
        labels: genderCategories,
        values: genderCategories.map((gender) =>
          getGenderPopulation(year, gender),
        ),
        type: "pie",
        marker: {
          colors: ["#0d6efd", "#dc3545"],
        },
        textinfo: "label+percent",
        hoverinfo: "label+value+percent",
      },
    ],
    layout: {
      annotations: [
        {
          text: year.toString(),
          xref: "paper",
          yref: "paper",
          x: 0.5,
          y: 0.5,
          xanchor: "center",
          yanchor: "middle",
          showarrow: false,
          font: {
            size: 160,
            color: "rgba(0, 0, 0, 0.08)",
            family: "Arial, sans-serif",
            weight: "bold",
          },
        },
      ],
    },
  }));

  // ============ AGE GROUP PIE CHART ==========
  const ageGroupPieTraces = [
    {
      labels: broadAgeGroups,
      values: broadAgeGroups.map((ageGroup) =>
        getPopulationFor(firstYear, ageGroup),
      ),
      type: "pie",
      marker: {
        colors: broadAgeGroups.map((ageGroup) => ageGroupColors[ageGroup]),
      },
      textinfo: "label+percent",
      hoverinfo: "label+value+percent",
    },
  ];

  const ageGroupPieFrames = years.map((year, yearIdx) => ({
    name: `ageGroupPieFrame-${yearIdx}`,
    data: [
      {
        labels: broadAgeGroups,
        values: broadAgeGroups.map((ageGroup) =>
          getPopulationFor(year, ageGroup),
        ),
        type: "pie",
        marker: {
          colors: broadAgeGroups.map((ageGroup) => ageGroupColors[ageGroup]),
        },
        textinfo: "label+percent",
        hoverinfo: "label+value+percent",
      },
    ],
    layout: {
      annotations: [
        {
          text: year.toString(),
          xref: "paper",
          yref: "paper",
          x: 0.5,
          y: 0.5,
          xanchor: "center",
          yanchor: "middle",
          showarrow: false,
          font: {
            size: 160,
            color: "rgba(0, 0, 0, 0.08)",
            family: "Arial, sans-serif",
            weight: "bold",
          },
        },
      ],
    },
  }));

  // ============ WORKING CLASS PIE CHART ==========
  const classBuckets = ["0-18", "18-65", "65+"];

  const getClassPopulationForYear = (year) => {
    const yearData = demographicsData.filter((d) => d.year === year);
    const sumAges = (groups) =>
      yearData
        .filter((d) => groups.includes(d.ageGroup))
        .reduce((sum, d) => sum + (d.populationMillions || 0), 0);

    const nonWorking = sumAges(["0-3", "3-6", "6-18"]);
    const working = sumAges(["18-25", "25-30", "30-50", "50-65"]);
    const retired = sumAges(["65-75", "75+"]);

    return [nonWorking, working, retired];
  };

  const classPieTraces = [
    {
      labels: classBuckets,
      values: getClassPopulationForYear(firstYear),
      type: "pie",
      marker: {
        colors: ["#6c757d", "#198754", "#fd7e14"],
      },
      textinfo: "label+percent",
      hoverinfo: "label+value+percent",
    },
  ];

  const classPieFrames = years.map((year, yearIdx) => ({
    name: `classPieFrame-${yearIdx}`,
    data: [
      {
        labels: classBuckets,
        values: getClassPopulationForYear(year),
        type: "pie",
        marker: {
          colors: ["#6c757d", "#198754", "#fd7e14"],
        },
        textinfo: "label+percent",
        hoverinfo: "label+value+percent",
      },
    ],
    layout: {
      annotations: [
        {
          text: year.toString(),
          xref: "paper",
          yref: "paper",
          x: 0.5,
          y: 0.5,
          xanchor: "center",
          yanchor: "middle",
          showarrow: false,
          font: {
            size: 160,
            color: "rgba(0, 0, 0, 0.08)",
            family: "Arial, sans-serif",
            weight: "bold",
          },
        },
      ],
    },
  }));

  return (
    <div
      className="w-100"
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        paddingBottom: "40px",
      }}
    >
      <div className="container-fluid py-5">
        {/* Header */}
        <div className="text-center mb-5">
          <h1
            className="fw-bold mb-3"
            style={{
              fontSize: "2.5rem",
              color: "#2c3e50",
              letterSpacing: "-0.5px",
            }}
          >
            {t("demographicIndicatorTitle")}
          </h1>
          <p
            className="lead"
            style={{ color: "#555", fontSize: "1.1rem", marginBottom: "15px" }}
          >
            {t("demographicIndicatorSubtitle")}
          </p>
          <p
            className="fs-6"
            style={{
              maxWidth: "650px",
              margin: "0 auto",
              color: "#777",
              lineHeight: "1.6",
            }}
          >
            {t("demographicIndicatorHelp")}
          </p>
        </div>

        {/* Loading State */}
        {dataLoading && (
          <div className="row justify-content-center">
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t("loading")}</span>
              </div>
              <p className="text-muted mt-3">{t("fetchingDemographicsData")}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {dataError && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="alert alert-danger" role="alert">
                <strong>{t("error")}:</strong> {dataError}
              </div>
            </div>
          </div>
        )}

        {/* Chart Display */}
        {showChart && (
          <div className="row g-4 align-items-start justify-content-center">
            <div className="col-lg-11">
              <div
                className="shadow-lg"
                style={{
                  overflow: "hidden",
                  borderRadius: "12px",
                  background: "white",
                  border: "1px solid #e0e0e0",
                }}
              >
                {/* Chart Header */}
                <div
                  style={{
                    padding: "24px 32px",
                    borderBottom: "2px solid #f0f0f0",
                    background:
                      "linear-gradient(135deg, #fff 0%, #f9f9f9 100%)",
                  }}
                >
                  <h5
                    className="fw-bold mb-0"
                    style={{ color: "#2c3e50", fontSize: "1.3rem" }}
                  >
                    📊 {t("demographicChartTitle")}
                  </h5>
                </div>

                {/* Tabs */}
                <div
                  style={{
                    padding: "16px 32px",
                    borderBottom: "1px solid #e0e0e0",
                    background: "#f9f9f9",
                  }}
                >
                  <ul
                    className="nav nav-tabs"
                    style={{ borderBottom: "none", gap: "8px" }}
                  >
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          activeTab === "ageGroup" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("ageGroup")}
                        style={{
                          border:
                            activeTab === "ageGroup"
                              ? "2px solid #0d6efd"
                              : "1px solid #ddd",
                          borderRadius: "6px 6px 0 0",
                          padding: "10px 20px",
                          fontSize: "0.95rem",
                          fontWeight: "500",
                          backgroundColor:
                            activeTab === "ageGroup"
                              ? "#f0f7ff"
                              : "transparent",
                          color: activeTab === "ageGroup" ? "#0d6efd" : "#666",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Population by Age Group
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${
                          activeTab === "gender" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("gender")}
                        style={{
                          border:
                            activeTab === "gender"
                              ? "2px solid #0d6efd"
                              : "1px solid #ddd",
                          borderRadius: "6px 6px 0 0",
                          padding: "10px 20px",
                          fontSize: "0.95rem",
                          fontWeight: "500",
                          backgroundColor:
                            activeTab === "gender" ? "#f0f7ff" : "transparent",
                          color: activeTab === "gender" ? "#0d6efd" : "#666",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Population by Gender
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Chart Area */}
                <div style={{ padding: "32px" }}>
                  {activeTab === "ageGroup" && demographicsData.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      {t("noData")}
                    </div>
                  ) : activeTab === "gender" && genderData.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      {t("noData")}
                    </div>
                  ) : activeTab === "ageGroup" ? (
                    <>
                      {hasData && (
                        <div className="alert alert-light border mb-3">
                          <div className="small">
                            <div className="mb-2 d-flex flex-wrap gap-2 align-items-center">
                              <span className="badge bg-primary text-light">
                                Age groups
                              </span>
                              <span className="badge bg-secondary text-light">
                                {years.length
                                  ? `${firstYear} – ${latestYear}`
                                  : "Years"}
                              </span>
                              <span className="badge bg-dark text-light">
                                Population (M)
                              </span>
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <strong>Highest population:</strong>{" "}
                                  {highestTotal.year} ·{" "}
                                  {highestTotal.total.toFixed(1)}M
                                </div>
                                <div className="mb-2">
                                  <strong>Lowest population:</strong>{" "}
                                  {lowestTotal.year} ·{" "}
                                  {lowestTotal.total.toFixed(1)}M
                                </div>
                                <div className="text-muted fst-italic">
                                  Totals aggregate all age groups per year.
                                </div>
                              </div>
                              <div className="col-md-6">
                                {highestSpike && (
                                  <div className="mb-2">
                                    <strong>Highest spike:</strong>{" "}
                                    <span className="text-success">
                                      {(highestSpike.delta >= 0 ? "+" : "") +
                                        highestSpike.delta.toFixed(1)}
                                      M
                                    </span>{" "}
                                    in {highestSpike.to} (vs {highestSpike.from}
                                    )
                                  </div>
                                )}
                                {highestDrop && (
                                  <div>
                                    <strong>Highest drop:</strong>{" "}
                                    <span className="text-danger">
                                      {highestDrop.delta.toFixed(1)}M
                                    </span>{" "}
                                    in {highestDrop.to} (vs {highestDrop.from})
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Plot
                        data={traces}
                        layout={{
                          title: {
                            text: t("populationByAgeGroup") + " (millions)",
                            font: {
                              size: 18,
                              color: "#2c3e50",
                              family: "Arial, sans-serif",
                            },
                            x: 0.5,
                            xanchor: "center",
                          },
                          barmode: "group",
                          xaxis: {
                            title: "Age Group",
                            tickfont: { size: 12, color: "#555" },
                            showgrid: true,
                            gridwidth: 1,
                            gridcolor: "#f0f0f0",
                            categoryorder: "array",
                            categoryarray: broadAgeGroups,
                          },
                          yaxis: {
                            title: "Population (millions)",
                            autorange: false,
                            range: [0, yAxisMax],
                            dtick: yAxisTick,
                            tickfont: { size: 11, color: "#555" },
                            showgrid: true,
                            gridwidth: 1,
                            gridcolor: "#f5f5f5",
                          },
                          bargap: 0.25,
                          bargroupgap: 0.2,
                          margin: { l: 80, r: 40, t: 80, b: 100 },
                          annotations: [
                            {
                              text: latestYear.toString(),
                              xref: "paper",
                              yref: "paper",
                              x: 0.5,
                              y: 0.5,
                              xanchor: "center",
                              yanchor: "middle",
                              showarrow: false,
                              font: {
                                size: 160,
                                color: "rgba(0, 0, 0, 0.08)",
                                family: "Arial, sans-serif",
                                weight: "bold",
                              },
                            },
                          ],
                          paper_bgcolor: "white",
                          plot_bgcolor: "#fafafa",
                          updatemenus: [
                            {
                              x: 0,
                              y: 0,
                              yanchor: "top",
                              xanchor: "left",
                              showactive: false,
                              direction: "left",
                              type: "buttons",
                              pad: { t: 50, r: 10 },
                              buttons: [
                                {
                                  method: "animate",
                                  args: [
                                    null,
                                    {
                                      mode: "immediate",
                                      fromcurrent: true,
                                      transition: { duration: 300 },
                                      frame: { duration: 800, redraw: true },
                                    },
                                  ],
                                  label: "▶︎",
                                },
                                {
                                  method: "animate",
                                  args: [
                                    [null],
                                    {
                                      mode: "immediate",
                                      transition: { duration: 0 },
                                      frame: { duration: 0, redraw: false },
                                    },
                                  ],
                                  label: "||",
                                },
                              ],
                            },
                          ],
                          sliders: [
                            {
                              active: years.length - 1,
                              pad: { l: 100, t: 55 },
                              steps: years.map((year, idx) => ({
                                label: year.toString(),
                                method: "animate",
                                args: [
                                  [`frame-${idx}`],
                                  {
                                    mode: "immediate",
                                    frame: { duration: 0, redraw: true },
                                    transition: { duration: 0 },
                                  },
                                ],
                              })),
                            },
                          ],
                        }}
                        frames={frames}
                        config={{ responsive: true, displayModeBar: true }}
                        style={{ width: "100%", height: "700px" }}
                        useResizeHandler={true}
                      />
                      <div className="row g-4 mt-2">
                        <div className="col-lg-6">
                          <Plot
                            data={ageGroupPieTraces}
                            layout={{
                              title: {
                                text: "Age Group Distribution (millions)",
                                font: {
                                  size: 18,
                                  color: "#2c3e50",
                                  family: "Arial, sans-serif",
                                },
                                x: 0.5,
                                xanchor: "center",
                              },
                              margin: { l: 60, r: 60, t: 80, b: 60 },
                              annotations: [
                                {
                                  text: latestYear.toString(),
                                  xref: "paper",
                                  yref: "paper",
                                  x: 0.5,
                                  y: 0.5,
                                  xanchor: "center",
                                  yanchor: "middle",
                                  showarrow: false,
                                  font: {
                                    size: 160,
                                    color: "rgba(0, 0, 0, 0.08)",
                                    family: "Arial, sans-serif",
                                    weight: "bold",
                                  },
                                },
                              ],
                              paper_bgcolor: "white",
                              updatemenus: [
                                {
                                  x: 0,
                                  y: 0,
                                  yanchor: "top",
                                  xanchor: "left",
                                  showactive: false,
                                  direction: "left",
                                  type: "buttons",
                                  pad: { t: 50, r: 10 },
                                  buttons: [
                                    {
                                      method: "animate",
                                      args: [
                                        null,
                                        {
                                          mode: "immediate",
                                          fromcurrent: true,
                                          transition: { duration: 300 },
                                          frame: {
                                            duration: 800,
                                            redraw: true,
                                          },
                                        },
                                      ],
                                      label: "▶︎",
                                    },
                                    {
                                      method: "animate",
                                      args: [
                                        [null],
                                        {
                                          mode: "immediate",
                                          transition: { duration: 0 },
                                          frame: { duration: 0, redraw: false },
                                        },
                                      ],
                                      label: "||",
                                    },
                                  ],
                                },
                              ],
                              sliders: [
                                {
                                  active: years.length - 1,
                                  pad: { l: 100, t: 55 },
                                  steps: years.map((year, idx) => ({
                                    label: year.toString(),
                                    method: "animate",
                                    args: [
                                      [`ageGroupPieFrame-${idx}`],
                                      {
                                        mode: "immediate",
                                        frame: { duration: 0, redraw: true },
                                        transition: { duration: 0 },
                                      },
                                    ],
                                  })),
                                },
                              ],
                            }}
                            frames={ageGroupPieFrames}
                            config={{ responsive: true, displayModeBar: true }}
                            style={{ width: "100%", height: "650px" }}
                            useResizeHandler={true}
                          />
                        </div>
                        <div className="col-lg-6">
                          <Plot
                            data={classPieTraces}
                            layout={{
                              title: {
                                text: "Working Class Breakdown (millions)",
                                font: {
                                  size: 18,
                                  color: "#2c3e50",
                                  family: "Arial, sans-serif",
                                },
                                x: 0.5,
                                xanchor: "center",
                              },
                              margin: { l: 60, r: 60, t: 80, b: 60 },
                              annotations: [
                                {
                                  text: latestYear.toString(),
                                  xref: "paper",
                                  yref: "paper",
                                  x: 0.5,
                                  y: 0.5,
                                  xanchor: "center",
                                  yanchor: "middle",
                                  showarrow: false,
                                  font: {
                                    size: 160,
                                    color: "rgba(0, 0, 0, 0.08)",
                                    family: "Arial, sans-serif",
                                    weight: "bold",
                                  },
                                },
                              ],
                              paper_bgcolor: "white",
                              updatemenus: [
                                {
                                  x: 0,
                                  y: 0,
                                  yanchor: "top",
                                  xanchor: "left",
                                  showactive: false,
                                  direction: "left",
                                  type: "buttons",
                                  pad: { t: 50, r: 10 },
                                  buttons: [
                                    {
                                      method: "animate",
                                      args: [
                                        null,
                                        {
                                          mode: "immediate",
                                          fromcurrent: true,
                                          transition: { duration: 300 },
                                          frame: {
                                            duration: 800,
                                            redraw: true,
                                          },
                                        },
                                      ],
                                      label: "▶︎",
                                    },
                                    {
                                      method: "animate",
                                      args: [
                                        [null],
                                        {
                                          mode: "immediate",
                                          transition: { duration: 0 },
                                          frame: { duration: 0, redraw: false },
                                        },
                                      ],
                                      label: "||",
                                    },
                                  ],
                                },
                              ],
                              sliders: [
                                {
                                  active: years.length - 1,
                                  pad: { l: 100, t: 55 },
                                  steps: years.map((year, idx) => ({
                                    label: year.toString(),
                                    method: "animate",
                                    args: [
                                      [`classPieFrame-${idx}`],
                                      {
                                        mode: "immediate",
                                        frame: { duration: 0, redraw: true },
                                        transition: { duration: 0 },
                                      },
                                    ],
                                  })),
                                },
                              ],
                            }}
                            frames={classPieFrames}
                            config={{ responsive: true, displayModeBar: true }}
                            style={{ width: "100%", height: "650px" }}
                            useResizeHandler={true}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {hasGenderData && (
                        <div className="alert alert-light border mb-3">
                          <div className="small">
                            <div className="mb-2 d-flex flex-wrap gap-2 align-items-center">
                              <span className="badge bg-primary text-light">
                                Male & Female
                              </span>
                              <span className="badge bg-secondary text-light">
                                {genderYears.length
                                  ? `${firstGenderYearData} – ${latestGenderYear}`
                                  : "Years"}
                              </span>
                              <span className="badge bg-dark text-light">
                                Population
                              </span>
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <strong>Highest total:</strong>{" "}
                                  {highestGenderTotal.year} ·{" "}
                                  {formatNumber(highestGenderTotal.total)}
                                </div>
                                <div className="mb-2">
                                  <strong>Lowest total:</strong>{" "}
                                  {lowestGenderTotal.year} ·{" "}
                                  {formatNumber(lowestGenderTotal.total)}
                                </div>
                                <div className="text-muted fst-italic">
                                  Totals combine male and female populations per
                                  year.
                                </div>
                              </div>
                              <div className="col-md-6">
                                {highestGenderSpike && (
                                  <div className="mb-2">
                                    <strong>Highest spike:</strong>{" "}
                                    <span className="text-success">
                                      {(highestGenderSpike.delta >= 0
                                        ? "+"
                                        : "") +
                                        formatNumber(highestGenderSpike.delta)}
                                    </span>{" "}
                                    in {highestGenderSpike.to} (vs{" "}
                                    {highestGenderSpike.from})
                                  </div>
                                )}
                                {highestGenderDrop && (
                                  <div>
                                    <strong>Highest drop:</strong>{" "}
                                    <span className="text-danger">
                                      {formatNumber(highestGenderDrop.delta)}
                                    </span>{" "}
                                    in {highestGenderDrop.to} (vs{" "}
                                    {highestGenderDrop.from})
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mb-3 d-flex justify-content-end">
                        <div className="btn-group" role="group">
                          <input
                            type="radio"
                            className="btn-check"
                            name="genderChartType"
                            id="genderBar"
                            autoComplete="off"
                            checked={genderChartType === "bar"}
                            onChange={() => setGenderChartType("bar")}
                          />
                          <label
                            className="btn btn-sm btn-outline-primary"
                            htmlFor="genderBar"
                          >
                            Bar
                          </label>
                          <input
                            type="radio"
                            className="btn-check"
                            name="genderChartType"
                            id="genderPie"
                            autoComplete="off"
                            checked={genderChartType === "pie"}
                            onChange={() => setGenderChartType("pie")}
                          />
                          <label
                            className="btn btn-sm btn-outline-primary"
                            htmlFor="genderPie"
                          >
                            Pie
                          </label>
                        </div>
                      </div>

                      {genderChartType === "bar" ? (
                        <Plot
                          data={genderTraces}
                          layout={{
                            title: {
                              text: "Population by Gender (millions)",
                              font: {
                                size: 18,
                                color: "#2c3e50",
                                family: "Arial, sans-serif",
                              },
                              x: 0.5,
                              xanchor: "center",
                            },
                            barmode: "group",
                            xaxis: {
                              title: "",
                              tickfont: { size: 12, color: "#555" },
                              showgrid: true,
                              gridwidth: 1,
                              gridcolor: "#f0f0f0",
                              categoryorder: "array",
                              categoryarray: genderCategories,
                            },
                            yaxis: {
                              title: "Population",
                              autorange: false,
                              range: [genderYAxisMin, genderYAxisMax],
                              dtick: genderYAxisTick,
                              tickfont: { size: 11, color: "#555" },
                              showgrid: true,
                              gridwidth: 1,
                              gridcolor: "#f5f5f5",
                            },
                            bargap: 0.25,
                            bargroupgap: 0.2,
                            margin: { l: 100, r: 40, t: 80, b: 80 },
                            annotations: [
                              {
                                text: latestGenderYear.toString(),
                                xref: "paper",
                                yref: "paper",
                                x: 0.5,
                                y: 0.5,
                                xanchor: "center",
                                yanchor: "middle",
                                showarrow: false,
                                font: {
                                  size: 160,
                                  color: "rgba(0, 0, 0, 0.08)",
                                  family: "Arial, sans-serif",
                                  weight: "bold",
                                },
                              },
                            ],
                            paper_bgcolor: "white",
                            plot_bgcolor: "#fafafa",
                            updatemenus: [
                              {
                                x: 0,
                                y: 0,
                                yanchor: "top",
                                xanchor: "left",
                                showactive: false,
                                direction: "left",
                                type: "buttons",
                                pad: { t: 50, r: 10 },
                                buttons: [
                                  {
                                    method: "animate",
                                    args: [
                                      null,
                                      {
                                        mode: "immediate",
                                        fromcurrent: true,
                                        transition: { duration: 300 },
                                        frame: { duration: 800, redraw: true },
                                      },
                                    ],
                                    label: "▶︎",
                                  },
                                  {
                                    method: "animate",
                                    args: [
                                      [null],
                                      {
                                        mode: "immediate",
                                        transition: { duration: 0 },
                                        frame: { duration: 0, redraw: false },
                                      },
                                    ],
                                    label: "||",
                                  },
                                ],
                              },
                            ],
                            sliders: [
                              {
                                active: genderYears.length - 1,
                                pad: { l: 100, t: 55 },
                                steps: genderYears.map((year, idx) => ({
                                  label: year.toString(),
                                  method: "animate",
                                  args: [
                                    [`genderFrame-${idx}`],
                                    {
                                      mode: "immediate",
                                      frame: { duration: 0, redraw: true },
                                      transition: { duration: 0 },
                                    },
                                  ],
                                })),
                              },
                            ],
                          }}
                          frames={genderFrames}
                          config={{ responsive: true, displayModeBar: true }}
                          style={{ width: "100%", height: "700px" }}
                          useResizeHandler={true}
                        />
                      ) : (
                        <div className="row g-4">
                          <div className="col-lg-6">
                            <Plot
                              data={genderPieTraces}
                              layout={{
                                title: {
                                  text: "Population by Gender (millions)",
                                  font: {
                                    size: 18,
                                    color: "#2c3e50",
                                    family: "Arial, sans-serif",
                                  },
                                  x: 0.5,
                                  xanchor: "center",
                                },
                                margin: { l: 60, r: 60, t: 80, b: 60 },
                                annotations: [
                                  {
                                    text: latestGenderYear.toString(),
                                    xref: "paper",
                                    yref: "paper",
                                    x: 0.5,
                                    y: 0.5,
                                    xanchor: "center",
                                    yanchor: "middle",
                                    showarrow: false,
                                    font: {
                                      size: 160,
                                      color: "rgba(0, 0, 0, 0.08)",
                                      family: "Arial, sans-serif",
                                      weight: "bold",
                                    },
                                  },
                                ],
                                paper_bgcolor: "white",
                                updatemenus: [
                                  {
                                    x: 0,
                                    y: 0,
                                    yanchor: "top",
                                    xanchor: "left",
                                    showactive: false,
                                    direction: "left",
                                    type: "buttons",
                                    pad: { t: 50, r: 10 },
                                    buttons: [
                                      {
                                        method: "animate",
                                        args: [
                                          null,
                                          {
                                            mode: "immediate",
                                            fromcurrent: true,
                                            transition: { duration: 300 },
                                            frame: {
                                              duration: 800,
                                              redraw: true,
                                            },
                                          },
                                        ],
                                        label: "▶︎",
                                      },
                                      {
                                        method: "animate",
                                        args: [
                                          [null],
                                          {
                                            mode: "immediate",
                                            transition: { duration: 0 },
                                            frame: {
                                              duration: 0,
                                              redraw: false,
                                            },
                                          },
                                        ],
                                        label: "||",
                                      },
                                    ],
                                  },
                                ],
                                sliders: [
                                  {
                                    active: genderYears.length - 1,
                                    pad: { l: 100, t: 55 },
                                    steps: genderYears.map((year, idx) => ({
                                      label: year.toString(),
                                      method: "animate",
                                      args: [
                                        [`genderPieFrame-${idx}`],
                                        {
                                          mode: "immediate",
                                          frame: { duration: 0, redraw: true },
                                          transition: { duration: 0 },
                                        },
                                      ],
                                    })),
                                  },
                                ],
                              }}
                              frames={genderPieFrames}
                              config={{
                                responsive: true,
                                displayModeBar: true,
                              }}
                              style={{ width: "100%", height: "650px" }}
                              useResizeHandler={true}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
