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
  const [placeName, setPlaceName] = useState("");
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
      const hits = await fetchTimeSeriesData(
        raumbezug,
        placeName,
        bereich,
        indicator
      );
      // Transform ES hits to { year, value } format
      // ES documents have 'zeitbezug' (time reference) and 'wert' (value)
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

      setTimeSeriesData(transformed);
      setShowChart(true);
    } catch (err) {
      setDataError(err.message || "Failed to fetch data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleReset = () => {
    setRaumbezug("");
    setPlaceName("");
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
    if (!raumbezug || !placeName) {
      setBereichOptions([]);
      setBereichError(null);
      setBereichLoading(false);
      setBereich("");
      return;
    }

    let cancelled = false;
    setBereichLoading(true);
    setBereichError(null);
    fetchBereichForPlace(raumbezug, placeName)
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
  }, [raumbezug, placeName]);

  // When raumbezug, placeName and bereich are selected, load indicators
  useEffect(() => {
    if (!raumbezug || !placeName || !bereich) {
      setIndicatorOptions([]);
      setIndicatorError(null);
      setIndicatorLoading(false);
      setIndicator("");
      return;
    }

    let cancelled = false;
    setIndicatorLoading(true);
    setIndicatorError(null);
    fetchIndicatorsForPlace(raumbezug, placeName, bereich)
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
  }, [raumbezug, placeName, bereich]);

  // Extract arrays for chart
  const years = timeSeriesData.map((d) => d.year);
  const values = timeSeriesData.map((d) => d.value);

  // Calculate overall min/max for consistent axis ranges
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valuePadding = (maxValue - minValue) * 0.1;
  const hasData = timeSeriesData.length > 1;
  const first = hasData ? timeSeriesData[0] : null;
  const last = hasData ? timeSeriesData[timeSeriesData.length - 1] : null;
  const totalChange = hasData ? last.value - first.value : 0;
  const totalChangePct =
    hasData && first.value !== 0
      ? (totalChange / Math.abs(first.value)) * 100
      : 0;
  const maxPoint = hasData
    ? timeSeriesData.reduce((a, b) => (b.value > a.value ? b : a))
    : null;
  const minPoint = hasData
    ? timeSeriesData.reduce((a, b) => (b.value < a.value ? b : a))
    : null;
  const deltas = hasData
    ? timeSeriesData.slice(1).map((d, i) => ({
        year: d.year,
        delta: d.value - timeSeriesData[i].value,
      }))
    : [];
  const biggestRise = deltas.length
    ? deltas.reduce((a, b) => (b.delta > a.delta ? b : a))
    : null;
  const biggestDrop = deltas.length
    ? deltas.reduce((a, b) => (b.delta < a.delta ? b : a))
    : null;

  // Build frames for animation
  const frames = timeSeriesData.map((d, i) => ({
    name: `frame-${i}`,
    data: [
      {
        x: years.slice(0, i + 1),
        y: values.slice(0, i + 1),
        mode: "lines+markers",
      },
    ],
    layout: {
      xaxis: {
        range: [minYear - 0.5, maxYear + 0.5],
      },
      yaxis: {
        range: [minValue - valuePadding, maxValue + valuePadding],
      },
      annotations: [
        {
          text: d.year.toString(),
          xref: "paper",
          yref: "paper",
          x: 0.95,
          y: 0.95,
          xanchor: "right",
          yanchor: "top",
          showarrow: false,
          font: {
            size: 80,
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

                    {/* Place Name Dropdown */}
                    <div className="col-md-6">
                      <label
                        htmlFor="placeName"
                        className="form-label text-muted fw-semibold"
                      >
                        {t("place")}
                      </label>
                      <select
                        id="placeName"
                        className="form-select"
                        value={placeName}
                        onChange={(e) => {
                          setPlaceName(e.target.value);
                          setBereich("");
                          setIndicator("");
                        }}
                        disabled={!raumbezug || placeLoading}
                      >
                        <option value="">
                          {!raumbezug
                            ? t("firstSelectRaumbezug")
                            : placeLoading
                            ? t("loadingPlaces")
                            : placeError
                            ? `Error: ${placeError}`
                            : t("selectPlace") + "..."}
                        </option>
                        {!placeLoading &&
                          !placeError &&
                          placeOptions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                      </select>
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
                        disabled={!placeName || bereichLoading}
                      >
                        <option value="">
                          {!placeName
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
                        !placeName ||
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
                          {placeName || t("place")}
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
                        {t("insightsExplanation")} <em>{t("category")}</em>{" "}
                        {t("forContext")}
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
                    data={[
                      {
                        x: years,
                        y: values,
                        mode: "lines+markers",
                        line: { width: 3, color: "#0d6efd" },
                        marker: { size: 8 },
                      },
                    ]}
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
                          active: timeSeriesData.length - 1,
                          currentvalue: { visible: false },
                          pad: { l: 100, t: 55 },
                          steps: timeSeriesData.map((d, idx) => ({
                            label: d.year.toString(),
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
                          // x: 0.1,
                          // y: 0,
                          // len: 0.9,
                          // xanchor: "left",
                          // yanchor: "top",
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
