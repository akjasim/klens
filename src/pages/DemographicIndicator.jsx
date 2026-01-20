import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Plot from "react-plotly.js";
import { fetchDemographicsData } from "../api/elasticsearch";
import { formatNumber } from "../helpers";

export default function DemographicIndicator() {
  const { t } = useTranslation();
  const [demographicsData, setDemographicsData] = useState([]);
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
        const data = await fetchDemographicsData();

        // Data is already transformed with { year, ageGroup, population, indicatorName }
        const transformed = data
          .filter((d) => !isNaN(d.year) && !isNaN(d.population))
          .sort((a, b) => a.year - b.year || a.ageGroup.localeCompare(b.ageGroup));

        setDemographicsData(transformed);
        setShowChart(true);
      } catch (err) {
        setDataError(err.message || "Failed to fetch demographics data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate max population for padding
  const maxPopulation = Math.max(
    ...demographicsData.map((d) => d.population)
  );
  const yAxisMax = maxPopulation * 1.05; // Add 5% padding above max

  // Get unique years and age groups
  const years = [...new Set(demographicsData.map((d) => d.year))].sort(
    (a, b) => a - b
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

  const ageGroups = [
    ...new Set(demographicsData.map((d) => d.ageGroup)),
  ]
    .filter((ag) => ag !== "65+") // Remove 65+ if it exists in data
    .sort(
      (a, b) =>
        ageGroupOrder.indexOf(a) - ageGroupOrder.indexOf(b)
    );

  // Build data for each age group (one trace per age group)
  const traces = ageGroups.map((ageGroup, idx) => {
    const colors = [
      "#0d6efd",
      "#198754",
      "#dc3545",
      "#ffc107",
      "#0dcaf0",
      "#6f42c1",
      "#fd7e14",
      "#20c997",
      "#e83e8c",
    ];
    const color = colors[idx % colors.length];

    const values = years.map((year) => {
      const found = demographicsData.find(
        (d) => d.year === year && d.ageGroup === ageGroup
      );
      return found ? found.population : 0;
    });

    return {
      x: [ageGroup],
      y: [values[values.length - 1]], // Show last year data in initial trace
      name: ageGroup,
      type: "bar",
      marker: { color },
    };
  });

  // Add total population line trace (sum of all age groups per year)
  const totalPopulationByYear = years.map((year) => {
    return demographicsData
      .filter((d) => d.year === year)
      .reduce((sum, d) => sum + d.population, 0);
  });

  traces.push({
    x: ageGroups,
    y: ageGroups.map((ageGroup) => {
      // Get total for last year
      return demographicsData
        .filter((d) => d.year === years[years.length - 1] && d.ageGroup === ageGroup)
        .reduce((sum, d) => sum + d.population, 0);
    }),
    name: "Total Line",
    type: "scatter",
    mode: "lines+markers",
    line: {
      color: "#000",
      width: 3,
    },
    marker: {
      size: 8,
      color: "#000",
    },
  });

  // Build frames for animation (one per year, all bars update together)
  const frames = years.map((year, yearIdx) => {
    const tracesForYear = ageGroups.map((ageGroup, groupIdx) => {
      const colors = [
        "#0d6efd",
        "#198754",
        "#dc3545",
        "#ffc107",
        "#0dcaf0",
        "#6f42c1",
        "#fd7e14",
        "#20c997",
        "#e83e8c",
      ];
      const color = colors[groupIdx % colors.length];

      // Get population for this age group at this year
      const value = demographicsData.find(
        (d) => d.year === year && d.ageGroup === ageGroup
      )?.population || 0;

      return {
        x: [ageGroup],
        y: [value],
        name: ageGroup,
        type: "bar",
        marker: { color },
      };
    });

    // Add line trace connecting top of bars at current year
    const lineYValues = ageGroups.map((ageGroup) => {
      return demographicsData.find(
        (d) => d.year === year && d.ageGroup === ageGroup
      )?.population || 0;
    });

    tracesForYear.push({
      x: ageGroups,
      y: lineYValues,
      name: "Total Line",
      type: "scatter",
      mode: "lines+markers",
      line: {
        color: "#000",
        width: 3,
      },
      marker: {
        size: 8,
        color: "#000",
      },
    });

    return {
      name: `frame-${yearIdx}`,
      data: tracesForYear,
      layout: {
        yaxis: {
          autorange: false,
          range: [0, yAxisMax],
        },
        annotations: [
          {
            text: year.toString(),
            xref: "paper",
            yref: "paper",
            x: 0.1,
            y: 0.92,
            xanchor: "left",
            yanchor: "top",
            showarrow: false,
            font: {
              size: 120,
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
        .reduce((sum, d) => sum + d.population, 0)
    : 0;
  
  const highestPopulation = hasData
    ? Math.max(
        ...years.map((year) =>
          demographicsData
            .filter((d) => d.year === year)
            .reduce((sum, d) => sum + d.population, 0)
        )
      )
    : 0;
  
  const lowestPopulation = hasData
    ? Math.min(
        ...years.map((year) =>
          demographicsData
            .filter((d) => d.year === year)
            .reduce((sum, d) => sum + d.population, 0)
        )
      )
    : 0;
  
  const highestPopulationYear = hasData
    ? years.find((year) =>
        demographicsData
          .filter((d) => d.year === year)
          .reduce((sum, d) => sum + d.population, 0) === highestPopulation
      )
    : null;
  
  const lowestPopulationYear = hasData
    ? years.find((year) =>
        demographicsData
          .filter((d) => d.year === year)
          .reduce((sum, d) => sum + d.population, 0) === lowestPopulation
      )
    : null;

  return (
    <div className="w-100" style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", minHeight: "100vh", paddingBottom: "40px" }}>
      <div className="container-fluid py-5">
        {/* Header */}
        <div className="text-center mb-5">
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "3.5rem" }}>👥</span>
          </div>
          <h1 className="fw-bold mb-3" style={{ fontSize: "2.5rem", color: "#2c3e50", letterSpacing: "-0.5px" }}>
            {t("demographicIndicatorTitle")}
          </h1>
          <p className="lead" style={{ color: "#555", fontSize: "1.1rem", marginBottom: "15px" }}>
            {t("demographicIndicatorSubtitle")}
          </p>
          <p
            className="fs-6"
            style={{ maxWidth: "650px", margin: "0 auto", color: "#777", lineHeight: "1.6" }}
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
              <p className="text-muted mt-3">
                {t("fetchingDemographicsData")}
              </p>
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
                  border: "1px solid #e0e0e0"
                }}
              >
                {/* Chart Header */}
                <div style={{ padding: "24px 32px", borderBottom: "2px solid #f0f0f0", background: "linear-gradient(135deg, #fff 0%, #f9f9f9 100%)" }}>
                  <h5 className="fw-bold mb-0" style={{ color: "#2c3e50", fontSize: "1.3rem" }}>
                    📊 {t("demographicChartTitle")}
                  </h5>
                </div>

                {/* Chart Area */}
                <div style={{ padding: "32px" }}>
                {demographicsData.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    {t("noData")}
                  </div>
                ) : (
                  <Plot
                    data={traces}
                    layout={{
                      title: {
                        text: t("populationByAgeGroup") + " (millions)",
                        font: { size: 18, color: "#2c3e50", family: "Arial, sans-serif" },
                        x: 0.5,
                        xanchor: "center",
                      },
                      barmode: "group",
                      xaxis: {
                        title: "",
                        tickangle: 0,
                        tickfont: { size: 12, color: "#555" },
                        showgrid: true,
                        gridwidth: 1,
                        gridcolor: "#f0f0f0",
                      },
                      yaxis: {
                        title: "",
                        autorange: false,
                        range: [0, yAxisMax],
                        tickfont: { size: 11, color: "#555" },
                        showgrid: true,
                        gridwidth: 1,
                        gridcolor: "#f5f5f5",
                      },
                      bargap: 0.3,
                      bargroupgap: 0.15,
                      margin: { l: 100, r: 40, t: 80, b: 180 },
                      annotations: [],
                      paper_bgcolor: "white",
                      plot_bgcolor: "#f8f8f8",
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
                    style={{ width: "100%", height: "600px" }}
                    useResizeHandler={true}
                  />
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
