// Lightweight Elasticsearch proxy helpers that call the Netlify function at /api/proxy
async function postToProxy(payload) {
  const res = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    return { status: res.status, isJson: true, data: json };
  } catch (e) {
    return { status: res.status, isJson: false, data: text };
  }
}

export async function executeQuery(payload) {
  const r = await postToProxy(payload);
  if (r.isJson) return r.data;
  // If backend returned plain text, throw with message
  throw new Error(typeof r.data === "string" ? r.data : "Non-JSON response");
}

export async function fetchTerms(field, query = null, size = 800) {
  const payload = {
    indexName: "inkar",
    indexAction: "_search",
    requestType: "post",
    dataForRemote: {
      size: 0,
      aggregations: {
        onlyAggregation: {
          terms: { field, size },
        },
      },
    },
  };

  if (query) payload.dataForRemote.query = query;

  const r = await postToProxy(payload);
  if (!r.isJson) throw new Error("Invalid response from server");

  const buckets =
    r.data && r.data.aggregations && r.data.aggregations.onlyAggregation
      ? r.data.aggregations.onlyAggregation.buckets
      : [];

  return buckets
    .map((b) => b.key)
    .filter(Boolean)
    .sort();
}

export async function fetchRaumbezugTerms() {
  return fetchTerms("raumbezug");
}

export async function fetchPlaceNamesForRaumbezug(raumbezug) {
  if (!raumbezug) return [];
  const query = { bool: { must: [{ match: { raumbezug } }] } };
  return fetchTerms("name.keyword", query);
}

export async function fetchBereichForPlace(raumbezug, placeName) {
  if (!raumbezug || !placeName) return [];
  const query = {
    bool: {
      must: [
        { match: { raumbezug } },
        { match: { "name.keyword": placeName } },
      ],
    },
  };
  return fetchTerms("bereich", query);
}

export async function fetchIndicatorsForPlace(raumbezug, placeName, bereich) {
  if (!raumbezug || !placeName || !bereich) return [];
  const query = {
    bool: {
      must: [
        { match: { raumbezug } },
        { match: { "name.keyword": placeName } },
        { match: { bereich } },
      ],
    },
  };
  return fetchTerms("indikator", query);
}

export async function fetchTimeSeriesData(
  raumbezug,
  placeName,
  bereich,
  indicator
) {
  if (!raumbezug || !placeName || !bereich || !indicator) {
    throw new Error("Missing required parameters");
  }

  const payload = {
    indexAction: "_search",
    requestType: "post",
    pretty: true,
    dataForRemote: {
      size: 100,
      query: {
        bool: {
          must: [
            { match: { "name.keyword": placeName } },
            { match: { raumbezug } },
            { match: { bereich } },
            { match: { indikator: indicator } },
          ],
        },
      },
    },
    indexName: "inkar",
  };

  const result = await executeQuery(payload);
  return result?.hits?.hits || [];
}

export default {
  postToProxy,
  executeQuery,
  fetchRaumbezugTerms,
  fetchPlaceNamesForRaumbezug,
  fetchBereichForPlace,
  fetchIndicatorsForPlace,
  fetchTimeSeriesData,
};
