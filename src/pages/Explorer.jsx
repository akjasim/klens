import { useState } from "react";

const elasticUrl = "/api/proxy";

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

export default function ExplorerForm() {
  const [indexName, setIndexName] = useState("inkar");
  const [indexAction, setIndexAction] = useState("_search");
  const [requestType, setRequestType] = useState("GET");
  const [dataForRemoteText, setDataForRemoteText] = useState("{}");
  const [additionalPath, setAdditionalPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState("");

  function parseDataForRemote() {
    if (!dataForRemoteText || dataForRemoteText.trim() === "") return {};
    try {
      return JSON.parse(dataForRemoteText);
    } catch (e) {
      throw new Error("Invalid JSON in dataForRemote: " + e.message);
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
      setError("Cannot format: invalid JSON");
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
        setCopyFeedback("Copied!");
      } else {
        throw new Error("Clipboard not supported");
      }
    } catch (copyErr) {
      setCopyFeedback("Copy failed");
      console.error(copyErr);
    } finally {
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResponse(null);

    let dataForRemote;
    try {
      dataForRemote = parseDataForRemote();
    } catch (err) {
      setError(err.message);
      return;
    }

    const payload = {
      indexAction,
      requestType: requestType.toLowerCase(),
      pretty: true,
      dataForRemote,
    };
    if (indexName && indexName.trim() !== "") {
      payload.indexName = indexName;
    }

    if (additionalPath && additionalPath.trim() !== "") {
      payload.additionalPath = additionalPath;
    }

    try {
      setLoading(true);
      console.log("payload", payload);

      const res = await fetch(elasticUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Read body once, prefer JSON but fall back to text
      const raw = await res.text();
      if (raw) {
        try {
          const json = JSON.parse(raw);
          setResponse({ type: "json", data: json, status: res.status });
        } catch (parseErr) {
          setResponse({ type: "text", data: raw, status: res.status });
        }
      } else {
        setResponse({ type: "text", data: "", status: res.status });
      }
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-100 py-5 px-3">
      <div className="container-lg">
        <h2 className="mb-4 text-primary fw-bold">Query Builder</h2>

        <form onSubmit={handleSubmit} className="mb-4">
          <div
            className="bg-dark text-light rounded p-3"
            style={{ fontFamily: "Menlo, Monaco, monospace", fontSize: 14 }}
          >
            {/* Each field is a separate 'line' */}
            <div className="d-flex align-items-center mb-2">
              <div style={{ width: 170 }} className="text-white-50">
                indexName
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
                indexAction
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
                requestType
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
                dataForRemote
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
                additionalPath
              </div>
              <input
                className="form-control form-control-sm"
                value={additionalPath}
                onChange={(e) => setAdditionalPath(e.target.value)}
                placeholder="optional"
                style={{ maxWidth: 420 }}
              />
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={formatDataForRemote}
              >
                Format JSON
              </button>
              <button
                className="btn btn-success btn-sm"
                type="submit"
                disabled={loading}
              >
                {loading ? "Running…" : "Run"}
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
                Reset
              </button>
            </div>

            {error && <div className="mt-3 text-danger">{error}</div>}
          </div>
        </form>

        <div>
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 gap-2">
            <h4 className="mb-0">Response</h4>
            {response && (
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {response.status && (
                  <span className="text-muted small">
                    Status: {response.status}
                  </span>
                )}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={handleCopyResponse}
                  >
                    <span role="img" aria-label="Copy">
                      📋
                    </span>
                    Copy
                  </button>
                  {copyFeedback && (
                    <span className="small text-success">{copyFeedback}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div
            className="bg-light border rounded p-3"
            style={{ minHeight: 120 }}
          >
            {response ? (
              <>
                {response.type === "json" ? (
                  <pre
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {prettyJson(response.data)}
                  </pre>
                ) : (
                  <pre
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {response.data}
                  </pre>
                )}
              </>
            ) : (
              <div className="text-muted">
                Response will appear here after submitting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
