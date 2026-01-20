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

export async function fetchDemographicsData() {
  // Age group indicators in German
  const ageGroupIndicators = [
    "Einwohner unter 3 Jahren",
    "Einwohner von 3 bis unter 6 Jahren",
    "Einwohner von 6 bis unter 18 Jahren",
    "Einwohner von 18 bis unter 25 Jahren",
    "Einwohner von 25 bis unter 30 Jahren",
    "Einwohner von 30 bis unter 50 Jahren",
    "Einwohner von 50 bis unter 65 Jahren",
    "Einwohner von 65 bis unter 75 Jahren",
    "Einwohner 75 Jahre und älter",
  ];

  // Map German indicator names to display age ranges
  const indicatorToAgeGroup = {
    "Einwohner unter 3 Jahren": "0-3",
    "Einwohner von 3 bis unter 6 Jahren": "3-6",
    "Einwohner von 6 bis unter 18 Jahren": "6-18",
    "Einwohner von 18 bis unter 25 Jahren": "18-25",
    "Einwohner von 25 bis unter 30 Jahren": "25-30",
    "Einwohner von 30 bis unter 50 Jahren": "30-50",
    "Einwohner von 50 bis unter 65 Jahren": "50-65",
    "Einwohner von 65 bis unter 75 Jahren": "65-75",
    "Einwohner 75 Jahre und älter": "75+",
  };

  try {
    // Fetch data for all age group indicators in parallel
    const promises = ageGroupIndicators.map((indicator) => {
      const payload = {
        indexAction: "_search",
        requestType: "post",
        pretty: true,
        dataForRemote: {
          size: 100,
          query: {
            bool: {
              must: [
                { match: { "name.keyword": "Bundesrepublik Deutschland" } },
                { match: { raumbezug: "Bund" } },
                { match: { bereich: "Bevölkerung" } },
                { match: { indikator: indicator } },
              ],
            },
          },
          sort: [{ zeitbezug: { order: "asc" } }],
        },
        indexName: "inkar",
      };

      return executeQuery(payload).then((result) => ({
        indicator,
        hits: result?.hits?.hits || [],
      }));
    });

    // Wait for all requests to complete
    const allResults = await Promise.all(promises);

    // Transform all results into a flat array with age group labels
    const allData = [];
    allResults.forEach(({ indicator, hits }) => {
      const ageGroup = indicatorToAgeGroup[indicator];
      hits.forEach((hit) => {
        const source = hit._source;
        allData.push({
          year: parseInt(source.zeitbezug, 10),
          ageGroup: ageGroup || indicator,
          population: parseFloat(source.wert || 0),
          indicatorName: indicator,
        });
      });
    });

    return allData;
  } catch (err) {
    console.error("Error fetching demographics data:", err);
    return [];
  }
}

export default {
  postToProxy,
  executeQuery,
  fetchRaumbezugTerms,
  fetchPlaceNamesForRaumbezug,
  fetchBereichForPlace,
  fetchIndicatorsForPlace,
  fetchTimeSeriesData,
  fetchDemographicsData,
};
