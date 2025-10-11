import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function App() {
  const [results, setResults] = useState({
    whiteStripes: null,
    queenBowie: null,
    beatlesLove: null,
  });

  const elasticUrl = "/api/proxy";

  const queries = {
    whiteStripes: {
      label:
        "1️⃣ How many entries can be found in the index for the group 'White Stripes'?",
      data: {
        indexAction: "_search",
        indexName: "spotify_tracks",
        requestType: "post",
        dataForRemote: {
          query: {
            query_string: {
              query: "artists.name:White Stripes",
            },
          },
          size: 5,
          track_total_hits: true,
        },
        pretty: true,
      },
    },
    queenBowie: {
      label:
        "2️⃣ How many entries can be found in the index for songs that Queen created together with David Bowie?",
      data: {
        indexAction: "_search",
        indexName: "spotify_tracks",
        requestType: "post",
        dataForRemote: {
          query: {
            bool: {
              must: [
                { query_string: { query: "artists.name:Queen" } },
                { query_string: { query: "artists.name:'David Bowie'" } },
              ],
            },
          },
          size: 5,
          track_total_hits: true,
        },
        pretty: true,
      },
    },
    beatlesLove: {
      label:
        "3️⃣ How many entries can be found in the index for songs by the Beatles that contain the word 'Love'?",
      data: {
        indexAction: "_search",
        indexName: "spotify_tracks",
        requestType: "post",
        dataForRemote: {
          query: {
            bool: {
              must: [
                { query_string: { query: "artists.name:Beatles" } },
                { query_string: { query: "name:Love" } },
              ],
            },
          },
          size: 5,
          track_total_hits: true,
        },
        pretty: true,
      },
    },
  };

  async function fetchResult(key) {
    const response = await fetch(elasticUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(queries[key].data),
    });
    const json = await response.json();
    const count = json?.hits?.total?.value || 0;
    setResults((prev) => ({ ...prev, [key]: count }));
  }

  const chartData = Object.entries(results)
    .filter(([_, v]) => v !== null)
    .map(([k, v]) => ({
      name: queries[k].label.split("?")[0],
      count: v,
    }));

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Left Column: Questions */}
        <div className="col-md-4 mb-4">
          <h1 className="mb-4 text-primary">🎵 KLens – Spotify Data Explorer</h1>
          {Object.keys(queries).map((key) => (
            <div key={key} className="mb-3 card shadow-sm">
              <div className="card-body">
                <p className="card-text fw-semibold">{queries[key].label}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => fetchResult(key)}
                >
                  Run Query
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Results & Visualization */}
        <div className="col-md-8">
          <div className="mb-4">
            <h2 className="mb-3">🧮 Query Results</h2>
            {Object.entries(results).map(([key, value]) => (
              <div
                key={key}
                className="mb-3 p-3 border-start border-4 border-primary bg-white rounded shadow-sm"
              >
                <strong>{queries[key].label}</strong>
                <p className="mt-1">
                  → <b>{value ?? "No data yet"}</b> entries found
                </p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <h2 className="mb-3">📘 Explanation</h2>
            <ul className="list-group">
              <li className="list-group-item">
                <b>Query 1:</b> Searches all tracks where{" "}
                <code>artists.name</code> contains "White Stripes".
              </li>
              <li className="list-group-item">
                <b>Query 2:</b> Uses <code>bool.must</code> to find tracks where
                both "Queen" and "David Bowie" appear as artists.
              </li>
              <li className="list-group-item">
                <b>Query 3:</b> Finds tracks where <code>artists.name</code> is
                "Beatles" and the song <code>name</code> contains "Love".
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3">📊 Visualization</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#0d6efd"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">Run some queries to visualize results</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
