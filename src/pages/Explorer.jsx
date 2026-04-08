import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import esApi from "../api/elasticsearch";
const HISTORY_STORAGE_KEY = "delensQueryHistory";

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

export default function ExplorerForm() {
  const { t } = useTranslation();
  const [indexName, setIndexName] = useState("inkar");
  const [indexAction, setIndexAction] = useState("_search");
  const [requestType, setRequestType] = useState("GET");
  const [dataForRemoteText, setDataForRemoteText] = useState("{}");
  const [additionalPath, setAdditionalPath] = useState("");
  const [saveAsName, setSaveAsName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [history, setHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Failed to parse stored history", err);
      return [];
    }
  });
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Failed to persist history", err);
    }
  }, [history]);

  function parseDataForRemote(text) {
    if (!text || text.trim() === "") return {};
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`${t("invalidJsonInDataForRemote")}: ${e.message}`);
    }
  }

  function formatDataForRemote() {
    if (!dataForRemoteText || dataForRemoteText.trim() === "") {
      setDataForRemoteText("{}");
      return;
    }
    try {
      const parsed = JSON.parse(dataForRemoteText);
      setDataForRemoteText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError(t("cannotFormatInvalidJson"));
    }
  }

  async function handleCopyResponse() {
    if (!response) return;
    const text =
      response.type === "json"
        ? prettyJson(response.data)
        : String(response.data ?? "");
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(t("copied"));
      } else {
        throw new Error(t("clipboardNotSupported"));
      }
    } catch (copyErr) {
      setCopyFeedback(t("copyFailed"));
      console.error(copyErr);
    } finally {
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await executeQuery();
    setSaveAsName("");
  }

  function snapshotFormValues(overrides) {
    return {
      indexName: overrides?.indexName ?? indexName,
      indexAction: overrides?.indexAction ?? indexAction,
      requestType: overrides?.requestType ?? requestType,
      dataForRemoteText:
        overrides?.dataForRemoteText ?? dataForRemoteText ?? "{}",
      additionalPath: overrides?.additionalPath ?? additionalPath,
      saveAsName: overrides?.saveAsName ?? saveAsName,
    };
  }

  async function executeQuery(overrides) {
    const formValues = snapshotFormValues(overrides);
    setError(null);
    setResponse(null);
    let dataForRemote;
    try {
      dataForRemote = parseDataForRemote(formValues.dataForRemoteText);
    } catch (err) {
      setError(err.message);
      return;
    }

    const payload = {
      indexAction: formValues.indexAction,
      requestType: formValues.requestType.toLowerCase(),
      pretty: true,
      dataForRemote,
    };
    if (formValues.indexName && formValues.indexName.trim() !== "") {
      payload.indexName = formValues.indexName;
    }

    if (formValues.additionalPath && formValues.additionalPath.trim() !== "") {
      payload.additionalPath = formValues.additionalPath;
    }

    try {
      setLoading(true);
      const proxyRes = await esApi.postToProxy(payload);
      if (proxyRes.isJson) {
        setResponse({
          type: "json",
          data: proxyRes.data,
          status: proxyRes.status,
        });
      } else {
        setResponse({
          type: "text",
          data: proxyRes.data,
          status: proxyRes.status,
        });
      }

      if (formValues.saveAsName && formValues.saveAsName.trim() !== "") {
        const historyEntry = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),

          fields: {
            indexName: formValues.indexName,
            indexAction: formValues.indexAction,
            requestType: formValues.requestType,
            dataForRemoteText: formValues.dataForRemoteText,
            additionalPath: formValues.additionalPath,
            saveAsName: formValues.saveAsName,
          },
        };

        setHistory((prev) => [historyEntry, ...prev].slice(0, 25));
      }
    } catch (err) {
      setError(err.message || t("requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleHistoryRun(entry) {
    if (!entry?.fields) return;

    const f = entry.fields;

    setIndexName(f.indexName || "");
    setIndexAction(f.indexAction || "");
    setRequestType(f.requestType || "GET");
    setDataForRemoteText(f.dataForRemoteText || "{}");
    setAdditionalPath(f.additionalPath || "");
    setSaveAsName("");

    await executeQuery({
      indexName: f.indexName,
      indexAction: f.indexAction,
      requestType: f.requestType,
      dataForRemoteText: f.dataForRemoteText,
      additionalPath: f.additionalPath,
      saveAsName: "", // force disabled saving
    });
  }

  function handleDeleteHistory(entryId, event) {
    event?.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== entryId));
  }

  return (
    <div className="delens-page-shell w-100 py-5 px-3">
      <div className="container-lg">
        <div className="text-center mb-4">
          <span className="delens-chip mb-3">Advanced Query Studio</span>
          <h1 className="display-6 fw-bold mb-2 delens-hero-title">
            {t("explorerTitle")}
          </h1>
          <p className="mb-0 delens-hero-subtitle">
            Build, run, inspect, and iterate Elasticsearch queries in one
            workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div
            className="delens-code-panel p-3"
            style={{ fontFamily: "Menlo, Monaco, monospace", fontSize: 14 }}
          >
            {/* Each field is a separate 'line' */}
            <div className="d-flex align-items-center mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                {t("indexName")}
              </div>
              <input
                className="form-control form-control-sm"
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                style={{ maxWidth: 420 }}
              />
            </div>

            <div className="d-flex align-items-center mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                {t("indexAction")}
              </div>
              <input
                className="form-control form-control-sm"
                value={indexAction}
                onChange={(e) => setIndexAction(e.target.value)}
                style={{ maxWidth: 420 }}
              />
            </div>

            <div className="d-flex align-items-center mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                {t("requestType")}
              </div>
              <select
                className="form-select form-select-sm"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                style={{ maxWidth: 200 }}
              >
                <option>POST</option>
                <option>GET</option>
              </select>
            </div>

            <div className="d-flex align-items-start mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                {t("dataForRemote")}
              </div>
              <textarea
                value={dataForRemoteText}
                onChange={(e) => setDataForRemoteText(e.target.value)}
                onBlur={formatDataForRemote}
                rows={8}
                className="form-control"
                style={{
                  fontFamily: "Menlo, Monaco, monospace",
                  maxWidth: 720,
                }}
              />
            </div>

            <div className="d-flex align-items-center mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                {t("additionalPath")}
              </div>
              <input
                className="form-control form-control-sm"
                value={additionalPath}
                onChange={(e) => setAdditionalPath(e.target.value)}
                placeholder={t("optional")}
                style={{ maxWidth: 420 }}
              />
            </div>

            <div className="d-flex align-items-center mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                {t("saveAsNameOptional")}
              </div>
              <input
                className="form-control form-control-sm"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder={t("myQueryName")}
                style={{ maxWidth: 420 }}
              />
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={formatDataForRemote}
              >
                {t("formatJson")}
              </button>
              <button
                className="btn btn-success btn-sm"
                type="submit"
                disabled={loading}
              >
                {loading ? t("running") : t("run")}
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => {
                  setIndexName("inkar");
                  setIndexAction("_search");
                  setRequestType("GET");
                  setDataForRemoteText("{}");
                  setAdditionalPath("");
                  setError(null);
                  setResponse(null);
                }}
              >
                {t("reset")}
              </button>
            </div>

            {error && <div className="mt-3 text-danger">{error}</div>}
          </div>
        </form>

        <div className="d-flex flex-column flex-lg-row gap-3 align-items-stretch">
          <div
            className="flex-grow-1 d-flex flex-column"
            style={{ height: "420px" }}
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 gap-2">
              <h4 className="mb-0">{t("response")}</h4>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {response?.status && (
                  <span className="text-muted small">
                    {t("status")}: {response.status}
                  </span>
                )}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={handleCopyResponse}
                    disabled={!response}
                  >
                    <span role="img" aria-label="Copy">
                      📋
                    </span>
                    {t("copy")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setHistoryOpen((prev) => !prev)}
                    disabled={history.length === 0}
                  >
                    {historyOpen ? t("hideHistory") : t("showHistory")}
                  </button>
                  {copyFeedback && (
                    <span className="small text-success">{copyFeedback}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="delens-response-box p-3 flex-grow-1 overflow-auto">
              {response ? (
                <>
                  {response.type === "json" ? (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                      }}
                    >
                      {prettyJson(response.data)}
                    </pre>
                  ) : (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                      }}
                    >
                      {response.data}
                    </pre>
                  )}
                </>
              ) : (
                <div className="text-muted">{t("responsePlaceholder")}</div>
              )}
            </div>
          </div>
          {historyOpen && (
            <div
              className="delens-history-panel p-3 flex-shrink-0 d-flex flex-column history-panel"
              style={{ height: "420px" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">{t("history")}</h5>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger p-0"
                    onClick={() => setHistory([])}
                    disabled={history.length === 0}
                    title={t("deleteAllHistory")}
                  >
                    <span role="img" aria-label="Delete all">
                      🗑️
                    </span>
                  </button>
                  <span className="badge bg-secondary">{history.length}</span>
                </div>
              </div>
              {history.length === 0 ? (
                <p className="text-muted small mb-0">
                  Run a query to populate history.
                </p>
              ) : (
                <div className="list-group overflow-auto" style={{ flex: 1 }}>
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="list-group-item list-group-item-action mb-2 text-start"
                      onClick={() => handleHistoryRun(entry)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="fw-semibold small d-block">
                            {entry.fields.saveAsName ||
                              entry.fields.indexAction}
                          </span>
                          {entry.fields.indexName && (
                            <span className="small text-truncate d-block">
                              Index: {entry.fields.indexName}
                            </span>
                          )}
                        </div>
                        <div className="text-end">
                          <span className="small text-muted d-block">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-danger p-0"
                            onClick={(event) =>
                              handleDeleteHistory(entry.id, event)
                            }
                          >
                            <span role="img" aria-label="Delete entry">
                              🗑️
                            </span>
                          </button>
                        </div>
                      </div>
                      {entry.responsePreview && (
                        <div className="history-preview small mt-1 text-truncate">
                          {entry.responsePreview}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
