import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Plot from "react-plotly.js";
import {
  fetchRaumbezugTerms,
  fetchPlaceNamesForRaumbezug,
  fetchBereichForPlace,
  fetchIndicatorsForPlace,
  fetchTimeSeriesData,
} from "../api/elasticsearch";

export default function TimeSeries() {
  const { t } = useTranslation();
  const [raumbezug, setRaumbezug] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [raumbezugOptions, setRaumbezugOptions] = useState([]);
  const [raumLoading, setRaumLoading] = useState(false);
  const [raumError, setRaumError] = useState(null);
  const [placeOptions, setPlaceOptions] = useState([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [bereich, setBereich] = useState("");
  const [bereichOptions, setBereichOptions] = useState([]);
  const [bereichLoading, setBereichLoading] = useState(false);
  const [bereichError, setBereichError] = useState(null);
  const [indicator, setIndicator] = useState("");
  const [indicatorOptions, setIndicatorOptions] = useState([]);
  const [indicatorLoading, setIndicatorLoading] = useState(false);
  const [indicatorError, setIndicatorError] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  const handleApply = async (e) => {
    e.preventDefault();
    setDataError(null);
    setDataLoading(true);
    setShowChart(false);

    try {
      // Fetch data for all selected places
      const dataByPlace = await Promise.all(
        selectedPlaces.map(async (place) => {
          const hits = await fetchTimeSeriesData(
            raumbezug,
            place,
            bereich,
            indicator
          );
          const transformed = hits
            .map((hit) => {
              const source = hit._source;
              return {
                year: parseInt(source.zeitbezug, 10),
                value: parseFloat(source.wert || 0),
              };
            })
            .filter((d) => !isNaN(d.year) && !isNaN(d.value))
            .sort((a, b) => a.year - b.year);

          return { place, data: transformed };
        })
      );

      setTimeSeriesData(dataByPlace);
      setShowChart(true);
    } catch (err) {
      setDataError(err.message || "Failed to fetch data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleReset = () => {
    setRaumbezug("");
    setSelectedPlaces([]);
    setBereich("");
    setIndicator("");
    setShowChart(false);
    setTimeSeriesData([]);
    setDataError(null);
  };

  // Load Raumbezug terms from Elasticsearch on mount (via shared API)
  useEffect(() => {
    let cancelled = false;
    setRaumError(null);
    setRaumLoading(true);
    fetchRaumbezugTerms()
      .then((terms) => {
        if (!cancelled) setRaumbezugOptions(terms);
      })
      .catch((err) => {
        if (!cancelled) setRaumError(err.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setRaumLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // When a raumbezug is selected, load place names for that raumbezug (via helper)
  useEffect(() => {
    if (!raumbezug) {
      setPlaceOptions([]);
      setPlaceError(null);
      setPlaceLoading(false);
      return;
    }

    let cancelled = false;
    setPlaceLoading(true);
    setPlaceError(null);
    fetchPlaceNamesForRaumbezug(raumbezug)
      .then((terms) => {
        if (!cancelled) setPlaceOptions(terms);
      })
      .catch((err) => {
        if (!cancelled) setPlaceError(err.message || "Failed to load places");
      })
      .finally(() => {
        if (!cancelled) setPlaceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [raumbezug]);

  // When both raumbezug and placeName are selected, load bereich options
  useEffect(() => {
    if (!raumbezug || selectedPlaces.length === 0) {
      setBereichOptions([]);
      setBereichError(null);
      setBereichLoading(false);
      setBereich("");
      return;
    }

    let cancelled = false;
    setBereichLoading(true);
    setBereichError(null);
    fetchBereichForPlace(raumbezug, selectedPlaces[0])
      .then((terms) => {
        if (!cancelled) setBereichOptions(terms);
      })
      .catch((err) => {
        if (!cancelled)
          setBereichError(err.message || "Failed to load bereich");
      })
      .finally(() => {
        if (!cancelled) setBereichLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [raumbezug, selectedPlaces]);

  // When raumbezug, placeName and bereich are selected, load indicators
  useEffect(() => {
    if (!raumbezug || selectedPlaces.length === 0 || !bereich) {
      setIndicatorOptions([]);
      setIndicatorError(null);
      setIndicatorLoading(false);
      setIndicator("");
      return;
    }

    let cancelled = false;
    setIndicatorLoading(true);
    setIndicatorError(null);
    fetchIndicatorsForPlace(raumbezug, selectedPlaces[0], bereich)
      .then((terms) => {
        if (!cancelled) setIndicatorOptions(terms);
      })
      .catch((err) => {
        if (!cancelled)
          setIndicatorError(err.message || "Failed to load indicators");
      })
      .finally(() => {
        if (!cancelled) setIndicatorLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [raumbezug, selectedPlaces, bereich]);

  // Process data for multiple places
  const colors = [
    "#0d6efd",
    "#198754",
    "#dc3545",
    "#ffc107",
    "#0dcaf0",
    "#6f42c1",
    "#fd7e14",
  ];

  // Extract data for insights (use first dataset for now)
  const hasData =
    timeSeriesData.length > 0 && timeSeriesData[0]?.data.length > 1;
  const firstDataset = timeSeriesData[0]?.data || [];

  const first = hasData ? firstDataset[0] : null;
  const last = hasData ? firstDataset[firstDataset.length - 1] : null;
  const totalChange = hasData ? last.value - first.value : 0;
  const totalChangePct =
    hasData && first.value !== 0
      ? (totalChange / Math.abs(first.value)) * 100
      : 0;
  const maxPoint = hasData
    ? firstDataset.reduce((a, b) => (b.value > a.value ? b : a))
    : null;
  const minPoint = hasData
    ? firstDataset.reduce((a, b) => (b.value < a.value ? b : a))
    : null;
  const deltas = hasData
    ? firstDataset.slice(1).map((d, i) => ({
        year: d.year,
        delta: d.value - firstDataset[i].value,
      }))
    : [];
  const biggestRise = deltas.length
    ? deltas.reduce((a, b) => (b.delta > a.delta ? b : a))
    : null;
  const biggestDrop = deltas.length
    ? deltas.reduce((a, b) => (b.delta < a.delta ? b : a))
    : null;

  // Calculate global min/max across all datasets for consistent axis
  let allYears = [];
  let allValues = [];
  timeSeriesData.forEach(({ data }) => {
    allYears = allYears.concat(data.map((d) => d.year));
    allValues = allValues.concat(data.map((d) => d.value));
  });

  const minYear = allYears.length > 0 ? Math.min(...allYears) : 0;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : 0;
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  const valuePadding = (maxValue - minValue) * 0.1;

  // Get unique years across all datasets for animation
  const uniqueYears = [...new Set(allYears)].sort((a, b) => a - b);

  // Build frames for animation
  const frames = uniqueYears.map((year, frameIndex) => ({
    name: `frame-${frameIndex}`,
    data: timeSeriesData.map(({ place, data }, idx) => {
      const upToYear = data.filter((d) => d.year <= year);
      return {
        x: upToYear.map((d) => d.year),
        y: upToYear.map((d) => d.value),
        mode: "lines+markers",
        name: place,
        line: { width: 3, color: colors[idx % colors.length] },
        marker: { size: 8 },
      };
    }),
    layout: {
      xaxis: {
        range: [minYear - 0.5, maxYear + 0.5],
      },
      yaxis: {
        range: [minValue - valuePadding, maxValue + valuePadding],
      },
      annotations: [
        {
          text: year.toString(),
          xref: "paper",
          yref: "paper",
          x: 0.85,
          y: 0.5,
          xanchor: "right",
          yanchor: "middle",
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
  }));

  return (
    <div className="w-100 py-4 px-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold text-primary mb-3">
            📊 {t("timeSeriesTitle")}
          </h1>
          <p className="lead text-muted">{t("timeSeriesSubtitle")}</p>
          <p
            className="fs-6 text-secondary"
            style={{ maxWidth: "600px", margin: "0 auto" }}
          >
            {t("timeSeriesHelp")}
          </p>
        </div>

        {/* Selection Form */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <form onSubmit={handleApply}>
                  <div className="row g-3">
                    {/* Raumbezug Dropdown */}
                    <div className="col-md-6">
                      <label
                        htmlFor="raumbezug"
                        className="form-label text-muted fw-semibold"
                      >
                        {t("raumbezug")}
                      </label>
                      <select
                        id="raumbezug"
                        className="form-select"
                        value={raumbezug}
                        onChange={(e) => {
                          setRaumbezug(e.target.value);
                          // clear place and indicator selection when raumbezug changes
                          setPlaceName("");
                          setBereich("");
                          setIndicator("");
                        }}
                      >
                        <option value="">
                          {raumLoading
                            ? t("loading")
                            : t("selectRaumbezug") + "..."}
                        </option>
                        {raumError && (
                          <option
                            value=""
                            disabled
                          >{`Error: ${raumError}`}</option>
                        )}
                        {!raumLoading &&
                          !raumError &&
                          raumbezugOptions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Place Name Multi-Select */}
                    <div className="col-md-6">
                      <label
                        htmlFor="placeName"
                        className="form-label text-muted fw-semibold"
                      >
                        {t("place")} ({selectedPlaces.length} selected)
                      </label>
                      <div
                        className="border rounded p-2"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        {!raumbezug ? (
                          <div className="text-muted small">
                            {t("firstSelectRaumbezug")}
                          </div>
                        ) : placeLoading ? (
                          <div className="text-muted small">
                            {t("loadingPlaces")}
                          </div>
                        ) : placeError ? (
                          <div className="text-danger small">
                            Error: {placeError}
                          </div>
                        ) : placeOptions.length === 0 ? (
                          <div className="text-muted small">
                            No places available
                          </div>
                        ) : (
                          placeOptions.map((p) => (
                            <div key={p} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`place-${p}`}
                                checked={selectedPlaces.includes(p)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPlaces([...selectedPlaces, p]);
                                  } else {
                                    setSelectedPlaces(
                                      selectedPlaces.filter(
                                        (place) => place !== p
                                      )
                                    );
                                  }
                                  setBereich("");
                                  setIndicator("");
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`place-${p}`}
                                style={{ fontSize: "0.9rem" }}
                              >
                                {p}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bereich Dropdown (full width) */}
                  <div className="row g-3 mt-3">
                    <div className="col-12">
                      <label
                        htmlFor="bereich"
                        className="form-label text-muted fw-semibold"
                      >
                        {t("category")}
                      </label>
                      <select
                        id="bereich"
                        className="form-select"
                        value={bereich}
                        onChange={(e) => {
                          setBereich(e.target.value);
                          setIndicator("");
                        }}
                        disabled={selectedPlaces.length === 0 || bereichLoading}
                      >
                        <option value="">
                          {selectedPlaces.length === 0
                            ? t("selectPlaceFirst")
                            : bereichLoading
                            ? t("loadingBereich")
                            : bereichError
                            ? `Error: ${bereichError}`
                            : t("selectBereich") + "..."}
                        </option>
                        {!bereichLoading &&
                          !bereichError &&
                          bereichOptions.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                      </select>
                      {bereichError && (
                        <div className="text-danger small mt-1">
                          {bereichError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indicator input (full width) */}
                  <div className="row g-3 mt-3">
                    <div className="col-12">
                      <label
                        htmlFor="indicator"
                        className="form-label text-muted fw-semibold"
                      >
                        {t("indicator")}
                      </label>
                      <select
                        id="indicator"
                        className="form-select"
                        value={indicator}
                        onChange={(e) => setIndicator(e.target.value)}
                        disabled={
                          !bereich ||
                          indicatorLoading ||
                          (indicatorOptions && indicatorOptions.length === 0)
                        }
                      >
                        <option value="">
                          {!bereich
                            ? t("selectBereichFirst")
                            : indicatorLoading
                            ? t("loadingIndicators")
                            : indicatorError
                            ? `Error: ${indicatorError}`
                            : indicatorOptions && indicatorOptions.length === 0
                            ? t("indicator") + " " + t("notFound")
                            : t("selectIndicator") + "..."}
                        </option>
                        {!indicatorLoading &&
                          !indicatorError &&
                          indicatorOptions.map((it) => (
                            <option key={it} value={it}>
                              {it}
                            </option>
                          ))}
                      </select>
                      {indicatorError && (
                        <div className="text-danger small mt-1">
                          {indicatorError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        !raumbezug ||
                        selectedPlaces.length === 0 ||
                        !bereich ||
                        !indicator ||
                        dataLoading
                      }
                    >
                      {dataLoading ? t("loading") : t("apply")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleReset}
                    >
                      {t("reset")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {dataLoading && (
          <div className="row justify-content-center">
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t("loading")}</span>
              </div>
              <p className="text-muted mt-3">{t("fetchingData")}</p>
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
            <div className="col-lg-8">
              <div
                className="bg-white border rounded-3 shadow-sm p-4 h-100"
                style={{ overflow: "hidden" }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="text-primary fw-semibold mb-0">
                    {t("chartTitle")}
                  </h5>
                </div>

                {/* Insights Panel */}
                {hasData && (
                  <div className="alert alert-light border mb-3">
                    <div className="small">
                      <div className="mb-2">
                        <span className="badge bg-primary text-light me-2">
                          {raumbezug || t("raumbezug")}
                        </span>
                        <span className="badge bg-secondary text-light me-2">
                          {selectedPlaces.length > 0
                            ? selectedPlaces.join(", ")
                            : t("place")}
                        </span>
                        <span className="badge bg-info text-dark me-2">
                          {bereich || t("category")}
                        </span>
                        <span className="badge bg-dark text-light">
                          {indicator || t("indicator")}
                        </span>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-md-6">
                          <div className="mb-2">
                            <strong>{t("overallTrend")}:</strong>{" "}
                            <span
                              className={
                                totalChange >= 0
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {totalChange >= 0 ? "↑" : "↓"}{" "}
                              {totalChange.toFixed(2)} (
                              {totalChangePct.toFixed(1)}%)
                            </span>
                          </div>
                          {maxPoint && (
                            <div className="mb-2">
                              <strong>{t("peak")}:</strong>{" "}
                              <span className="text-primary">
                                {maxPoint.year} · {maxPoint.value.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {minPoint && (
                            <div>
                              <strong>{t("low")}:</strong>{" "}
                              <span className="text-secondary">
                                {minPoint.year} · {minPoint.value.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          {biggestRise && biggestRise.delta > 0 && (
                            <div className="mb-2">
                              <strong>{t("biggestRise")}:</strong>{" "}
                              <span className="text-success">
                                +{biggestRise.delta.toFixed(2)} {t("in")}{" "}
                                {biggestRise.year}
                              </span>
                            </div>
                          )}
                          {biggestDrop && biggestDrop.delta < 0 && (
                            <div>
                              <strong>{t("sharpestDrop")}:</strong>{" "}
                              <span className="text-danger">
                                {biggestDrop.delta.toFixed(2)} {t("in")}{" "}
                                {biggestDrop.year}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-muted fst-italic">
                        {timeSeriesData.length > 1 ? (
                          <>{t("compareNote")}</>
                        ) : (
                          <>
                            {t("insightsExplanation")} <em>{t("category")}</em>{" "}
                            {t("forContext")}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {timeSeriesData.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    {t("noData")}
                  </div>
                ) : (
                  <Plot
                    data={timeSeriesData.map(({ place, data }, idx) => ({
                      x: data.map((d) => d.year),
                      y: data.map((d) => d.value),
                      mode: "lines+markers",
                      name: place,
                      line: { width: 3, color: colors[idx % colors.length] },
                      marker: { size: 8 },
                    }))}
                    layout={{
                      title: t("dataOverTime"),
                      xaxis: {
                        title: t("year"),
                        dtick: 1,
                        range:
                          timeSeriesData.length > 0
                            ? [minYear - 0.5, maxYear + 0.5]
                            : undefined,
                      },
                      yaxis: {
                        title: t("value"),
                        range:
                          timeSeriesData.length > 0
                            ? [minValue - valuePadding, maxValue + valuePadding]
                            : undefined,
                      },
                      showlegend: timeSeriesData.length > 1,
                      legend: {
                        x: 1,
                        xanchor: "right",
                        y: 1,
                      },
                      // autosize: true,
                      margin: { l: 50, r: 30, t: 50, b: 100 },
                      // Let frames control annotations (year watermark)
                      annotations: [],

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
                                  transition: { duration: 0 },
                                  frame: { duration: 500, redraw: true },
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
                          active: uniqueYears.length - 1,
                          currentvalue: { visible: false },
                          pad: { l: 100, t: 55 },
                          steps: uniqueYears.map((year, idx) => ({
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
                    style={{ width: "100%", height: "560px" }}
                    useResizeHandler={true}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
