import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Plot from "react-plotly.js";
import { fetchUrbanizationData } from "../api/elasticsearch";
import { formatNumber } from "../helpers";

export default function Urbanization() {
  const { t } = useTranslation();
  const [urbanizationData, setUrbanizationData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("population");

  // Fetch urbanization data on mount
  useEffect(() => {
    const fetchData = async () => {
      setDataError(null);
      setDataLoading(true);
      setShowChart(false);

      try {
        const data = await fetchUrbanizationData();

        // Data is already transformed with { year, bundesland, population, indicatorName }
        const transformed = data
          .filter((d) => !isNaN(d.year) && !isNaN(d.population))
          .sort(
            (a, b) =>
              a.year - b.year || a.bundesland.localeCompare(b.bundesland)
          );

        setUrbanizationData(transformed);
        setShowChart(true);
      } catch (err) {
        setDataError(err.message || "Failed to fetch urbanization data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique years and Bundesländer
  const years = [...new Set(urbanizationData.map((d) => d.year))].sort(
    (a, b) => a - b
  );

  const bundesländer = [
    ...new Set(urbanizationData.map((d) => d.bundesland)),
  ].sort();

  // Calculate statistics
  const hasData = urbanizationData.length > 0;
  const maxPopulation = hasData
    ? Math.max(...urbanizationData.map((d) => d.population))
    : 0;
  const minPopulation = hasData
    ? Math.min(...urbanizationData.map((d) => d.population))
    : 0;

  // Build data for choropleth map - initial state (last year)
  const lastYear = years[years.length - 1];
  const initialData = bundesländer.map((bl) => {
    const found = urbanizationData.find(
      (d) => d.year === lastYear && d.bundesland === bl
    );
    return found ? found.population : 0;
  });

  const traces = [
    {
      type: "choropleth",
      locations: bundesländer,
      z: initialData,
      locationmode: "geojson-id",
      colorscale: "Viridis",
      text: bundesländer,
      hovertemplate: "<b>%{text}</b><br>Population: %{z:,.0f}<extra></extra>",
      colorbar: {
        title: "Population",
      },
    },
  ];

  // Build frames for animation (one per year)
  const frames = years.map((year, yearIdx) => {
    const yearData = bundesländer.map((bl) => {
      const found = urbanizationData.find(
        (d) => d.year === year && d.bundesland === bl
      );
      return found ? found.population : 0;
    });

    return {
      name: `frame-${yearIdx}`,
      data: [
        {
          z: yearData,
        },
      ],
      layout: {
        title: `Population by Bundesland - ${year}`,
      },
    };
  });

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
            {t("urbanizationTitle") || "Urbanization"}
          </h1>
          <p
            className="lead"
            style={{ color: "#555", fontSize: "1.1rem", marginBottom: "15px" }}
          >
            {t("urbanizationSubtitle") ||
              "Explore urbanization patterns across German states"}
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
            {t("urbanizationHelp") ||
              "View population distribution across Bundesländer over time"}
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
                {t("fetchingUrbanizationData") ||
                  "Fetching urbanization data..."}
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
                    📊{" "}
                    {t("urbanizationChartTitle") || "Population by Bundesland"}
                  </h5>
                </div>

                {/* Filters */}
                <div
                  style={{
                    padding: "16px 32px",
                    borderBottom: "1px solid #f0f0f0",
                    background: "#fafafa",
                  }}
                >
                  <label
                    style={{
                      marginBottom: "0",
                      color: "#555",
                      fontWeight: "500",
                    }}
                  >
                    Filter by:
                  </label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    style={{
                      marginLeft: "12px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="population">Population</option>
                    <option value="internet" disabled>
                      Internet Speed (Coming soon)
                    </option>
                  </select>
                </div>

                {/* Chart Area */}
                <div style={{ padding: "32px" }}>
                  {urbanizationData.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      {t("noData")}
                    </div>
                  ) : (
                    <Plot
                      data={traces}
                      layout={{
                        title: {
                          text: `Population by Bundesland - ${lastYear}`,
                          font: {
                            size: 18,
                            color: "#2c3e50",
                            family: "Arial, sans-serif",
                          },
                          x: 0.5,
                          xanchor: "center",
                        },
                        geo: {
                          scope: "europe",
                          projection: { type: "mercator" },
                          showland: true,
                          landcolor: "rgb(243, 243, 243)",
                          countrycolor: "rgb(204, 204, 204)",
                          coastcolor: "rgb(204, 204, 204)",
                          center: { lon: 10, lat: 51.5 },
                          projection: {
                            type: "albers usa",
                          },
                        },
                        margin: { l: 0, r: 0, t: 80, b: 150 },
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
                      config={{ responsive: true }}
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
