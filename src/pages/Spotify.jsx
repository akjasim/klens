import { useState } from "react";
import { useTranslation } from "react-i18next";
import esApi from "../api/elasticsearch";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function Explorer() {
  const { t } = useTranslation();
  const [results, setResults] = useState({
    whiteStripes: null,
    queenBowie: null,
    beatlesLove: null,
  });
  const [activeQuery, setActiveQuery] = useState(null);

  const queries = {
    whiteStripes: {
      label:
        '1) How many entries can be found in the index for the group "White Stripes"?',
      explanation:
        "This query uses `query_string` with quotes on the field `artists.name`. " +
        'It searches for documents containing the tokens "White" and "Stripes" in order. ' +
        "Using quotes will make sure that these tokens are treated as a phrase. " +
        "If we were to remove the quotes around, it would be treated as White OR Stripes, which could yield unwanted results." +
        "Also, we can use match_phrase instead of query_string which will do consecutive ordered matching by default. We can also use slop if we want to have flexibility of allowing words in between." +
        "For example, using match_phrase with slop of 1 would look like this: " +
        'dataForRemote: "{"query":{"match_phrase":{"artists.name":{"query":"White Stripes","slop":1}}},"size":5,"track_total_hits":true}"',
      data: {
        indexAction: "_search",
        indexName: "spotify_tracks",
        requestType: "post",
        dataForRemote: {
          query: {
            query_string: {
              query: '"White Stripes"',
              fields: ["artists.name"],
            },
          },
          size: 30,
          track_total_hits: true,
        },
        pretty: true,
      },
    },
    queenBowie: {
      label:
        "2) How many entries can be found in the index for songs that Queen created together with David Bowie?",
      explanation:
        "We use `bool.must` to combine `term` and `match_phrase`. " +
        "It finds songs where the artist name is exactly 'Queen' (using `term query on .keyword`) " +
        "and where 'David Bowie' appears (using `match_phrase`). " +
        "The reason why we used Queen as exact match is because of the fact that there might be other people having same first name Queen but different last name, we don't want to match that. While query_string was used for Queen, got to see an entry with Queen as first name but a different last name." +
        "Also match_phrase is used for David Bowie because using query string without quotes would yield unexpected results due to the fact that it will be considered as David OR Bowie.",
      data: {
        indexAction: "_search",
        indexName: "spotify_tracks",
        requestType: "post",
        dataForRemote: {
          query: {
            bool: {
              must: [
                { term: { "artists.name.keyword": "Queen" } },
                { match_phrase: { "artists.name": "David Bowie" } },
              ],
            },
          },
          size: 30,
          track_total_hits: true,
        },
        pretty: true,
      },
    },
    beatlesLove: {
      label:
        "3) How many entries can be found in the index for songs by the Beatles that contain the word 'Love'?",
      explanation:
        'We could technically do this without using bool, like "query_string": {"query": "(artists.name:Beatles) AND (name:Love)"}. But, we used bool because we have explicit control over each condition.' +
        "We could change individual condition to be match_phrase/term if we wanted to, but this cannot be achieved with the single query string clause. Also, in terms of readability, bool is an advantage." +
        "This query uses a `bool.must` combining two `query_string` queries: " +
        "one for `artists.name:Beatles` and one for `name:Love`. " +
        "For these single-word queries, quotes are not necessary. " +
        "It searches for songs by Beatles where the song name contains 'Love'. ",
      data: {
        indexAction: "_search",
        indexName: "spotify_tracks",
        requestType: "post",
        dataForRemote: {
          query: {
            bool: {
              must: [
                {
                  query_string: { query: "Beatles", fields: ["artists.name"] },
                },
                { query_string: { query: "Love", fields: ["name"] } },
              ],
            },
          },
          size: 30,
          track_total_hits: true,
        },
        pretty: true,
      },
    },
  };

  async function fetchResult(key) {
    setActiveQuery(key);
    const proxyRes = await esApi.postToProxy(queries[key].data);
    if (proxyRes.isJson) {
      const json = proxyRes.data;
      const count = json?.hits?.total?.value || 0;
      setResults((prev) => ({ ...prev, [key]: count }));
    } else {
      // fallback: no JSON result, set zero
      setResults((prev) => ({ ...prev, [key]: 0 }));
    }
  }

  return (
    <div className="w-100 py-5 px-3">
      <div className="container-xl">
        <div className="row g-4">
          {/* Left Column: Questions */}
          <div className="col-12 col-lg-4">
            <div className="sticky-top" style={{ top: "100px" }}>
              <h2 className="mb-4 text-primary fw-bold">
                {t("spotifyExplorer")}
              </h2>
              {Object.keys(queries).map((key) => (
                <div key={key} className="mb-3 card shadow-sm border-0">
                  <div className="card-body">
                    <p className="card-text fw-semibold small mb-3">
                      {queries[key].label}
                    </p>
                    <button
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => fetchResult(key)}
                    >
                      {t("runQuery")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: One Query Result */}
          <div className="col-12 col-lg-8">
            {activeQuery ? (
              <>
                <div className="mb-4">
                  <h3 className="mb-3 text-primary fw-bold">
                    {t("queryResult")}
                  </h3>
                  <div className="p-4 border-start border-4 border-primary bg-white rounded shadow-sm">
                    <strong className="text-secondary">
                      {queries[activeQuery].label}
                    </strong>
                    <p className="mt-3 fs-4 mb-0">
                      <b className="text-primary">
                        {results[activeQuery] ?? t("loading")}
                      </b>
                      <span className="text-muted ms-2 fw-normal">
                        {t("entriesFound")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="mb-3 text-primary fw-bold">
                    {t("explanation")}
                  </h3>
                  <div className="p-3 bg-white border rounded shadow-sm text-secondary">
                    {queries[activeQuery].explanation}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="mb-3 text-primary fw-bold">
                    {t("requestPayload")}
                  </h3>
                  <pre className="bg-dark text-white p-3 rounded overflow-auto shadow-sm">
                    {JSON.stringify(
                      queries[activeQuery].data.dataForRemote,
                      null,
                      2,
                    )}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-3 text-primary fw-bold">
                    📊 Visualization
                  </h3>
                  {Object.values(results).some((v) => v !== null) ? (
                    <div className="bg-white p-4 rounded shadow-sm">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              key: "whiteStripes",
                              name: "White Stripes",
                              count: results.whiteStripes || 0,
                            },
                            {
                              key: "queenBowie",
                              name: "Queen & Bowie",
                              count: results.queenBowie || 0,
                            },
                            {
                              key: "beatlesLove",
                              name: "Beatles Love",
                              count: results.beatlesLove || 0,
                            },
                          ]}
                          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e0e0e0"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 14, fill: "#555" }}
                            interval={0}
                          />
                          <YAxis tick={{ fontSize: 14, fill: "#555" }} />
                          <Tooltip
                            cursor={{ fill: "rgba(0,0,0,0.05)" }}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                            }}
                          />
                          <Bar
                            dataKey="count"
                            radius={[10, 10, 0, 0]}
                            barSize={50}
                          >
                            {[
                              { key: "whiteStripes" },
                              { key: "queenBowie" },
                              { key: "beatlesLove" },
                            ].map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.key === activeQuery
                                    ? "#0d6efd"
                                    : "#adb5bd"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">
                      {t("runQueriesToSeeChart")}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ minHeight: "500px" }}
              >
                <div className="text-center">
                  <h5 className="text-secondary fw-normal">
                    👈 Select a query to view its details
                  </h5>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
