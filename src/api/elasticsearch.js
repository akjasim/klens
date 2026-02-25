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
  indicator,
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

export async function fetchDemographicsData(
  raumbezug = "Bund",
  placeName = "Bundesrepublik Deutschland",
) {
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
                { match: { "name.keyword": placeName } },
                { match: { raumbezug } },
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

export async function fetchGenderData(
  raumbezug = "Bund",
  placeName = "Bundesrepublik Deutschland",
) {
  const malePayload = {
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
            { match: { bereich: "Absolutzahlen" } },
            { match: { indikator: "Bevölkerung männlich" } },
          ],
        },
      },
      sort: [{ zeitbezug: { order: "asc" } }],
    },
    indexName: "inkar",
  };

  const femalePayload = {
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
            { match: { bereich: "Absolutzahlen" } },
            { match: { indikator: "Bevölkerung weiblich" } },
          ],
        },
      },
      sort: [{ zeitbezug: { order: "asc" } }],
    },
    indexName: "inkar",
  };

  try {
    const [maleResult, femaleResult] = await Promise.all([
      executeQuery(malePayload),
      executeQuery(femalePayload),
    ]);

    const maleHits = maleResult?.hits?.hits || [];
    const femaleHits = femaleResult?.hits?.hits || [];

    // Transform into {year, gender, population} format
    const allData = [];

    maleHits.forEach((hit) => {
      const source = hit._source;
      allData.push({
        year: parseInt(source.zeitbezug, 10),
        gender: "Male",
        population: parseFloat(source.wert || 0),
      });
    });

    femaleHits.forEach((hit) => {
      const source = hit._source;
      allData.push({
        year: parseInt(source.zeitbezug, 10),
        gender: "Female",
        population: parseFloat(source.wert || 0),
      });
    });

    return allData;
  } catch (err) {
    console.error("Error fetching gender data:", err);
    return [];
  }
}

// Fetch total population (absolute numbers) for Germany (Bund)
export async function fetchTotalPopulation(
  raumbezug = "Bund",
  placeName = "Bundesrepublik Deutschland",
) {
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
            { match: { bereich: "Absolutzahlen" } },
            { match: { indikator: "Bevölkerung gesamt" } },
          ],
        },
      },
      sort: [{ zeitbezug: { order: "asc" } }],
    },
    indexName: "inkar",
  };

  try {
    const result = await executeQuery(payload);
    const hits = result?.hits?.hits || [];
    return hits.map((hit) => ({
      year: parseInt(hit._source?.zeitbezug, 10),
      population: parseFloat(hit._source?.wert || 0),
    }));
  } catch (err) {
    console.error("Error fetching total population:", err);
    return [];
  }
}

// Fetch geometry for all 16 German states (Bundesländer)
export async function fetchStateGeometry() {
  const payload = {
    indexName: "bundesamt_kartographie_bundeslaender",
    indexAction: "_search",
    requestType: "post",
    pretty: true,
    dataForRemote: {
      size: 16,
      query: {
        bool: {
          must: [{ term: { administrative_ebene: 2 } }],
          must_not: [{ wildcard: { "name.raw": "*Bodensee*" } }],
        },
      },
      sort: [{ beginn_lebenszeitintervall: { order: "desc" } }],
      collapse: { field: "name.raw" },
      _source: true,
    },
  };

  try {
    const result = await executeQuery(payload);
    const hits = result?.hits?.hits || [];
    return hits.map((hit) => ({
      name: hit._source?.name,
      geolocation: hit._source?.geolocation,
      amtlicher_regionalschluessel: hit._source?.amtlicher_regionalschluessel,
    }));
  } catch (err) {
    console.error("Error fetching state geometry:", err);
    return [];
  }
}

// Fetch population data for a specific state (Bundesland)
export async function fetchStatePopulation(stateName) {
  const payload = {
    indexAction: "_search",
    requestType: "post",
    pretty: true,
    dataForRemote: {
      size: 100,
      query: {
        bool: {
          must: [
            { match: { "name.keyword": stateName } },
            { match: { raumbezug: "Bundesländer" } },
            { match: { bereich: "Absolutzahlen" } },
            { match: { indikator: "Bevölkerung gesamt" } },
          ],
        },
      },
      sort: [{ zeitbezug: { order: "asc" } }],
    },
    indexName: "inkar",
  };

  try {
    const result = await executeQuery(payload);
    const hits = result?.hits?.hits || [];
    return hits.map((hit) => ({
      year: parseInt(hit._source?.zeitbezug, 10),
      population: parseFloat(hit._source?.wert || 0),
    }));
  } catch (err) {
    console.error(`Error fetching population for ${stateName}:`, err);
    return [];
  }
}

// Fetch all states population data
export async function fetchAllStatesPopulation() {
  try {
    const states = await fetchStateGeometry();
    console.log("STATEs", states);
    const promises = states.map((state) =>
      fetchStatePopulation(state.name).then((data) => ({
        name: state.name,
        data,
      })),
    );
    const results = await Promise.all(promises);
    console.log("RESULTS", results);
    return results;
  } catch (err) {
    console.error("Error fetching all states population:", err);
    return [];
  }
}

// Fetch internet speed for a single state
export async function fetchStateInternetSpeed(stateName, speedType = "1000") {
  const speedIndicators = {
    1000: "Bandbreitenverfügbarkeit mindestens 1.000 Mbit/s",
    100: "Bandbreitenverfügbarkeit mindestens 100 Mbit/s",
    50: "Bandbreitenverfügbarkeit mindestens 50 Mbit/s",
  };

  const payload = {
    indexAction: "_search",
    requestType: "post",
    pretty: true,
    dataForRemote: {
      size: 100,
      query: {
        bool: {
          must: [
            { match: { "name.keyword": stateName } },
            { match: { raumbezug: "Bundesländer" } },
            { match: { bereich: "Verkehr und Erreichbarkeit" } },
            { match: { indikator: speedIndicators[speedType] } },
          ],
        },
      },
      sort: [{ zeitbezug: { order: "asc" } }],
    },
    indexName: "inkar",
  };

  try {
    const result = await executeQuery(payload);
    const hits = result?.hits?.hits || [];
    return hits.map((hit) => ({
      year: parseInt(hit._source?.zeitbezug, 10),
      speed: parseFloat(hit._source?.wert || 0),
    }));
  } catch (err) {
    console.error(`Error fetching internet speed for ${stateName}:`, err);
    return [];
  }
}

// Fetch all states internet speed data
export async function fetchAllStatesInternetSpeed(speedType = "1000") {
  try {
    const states = await fetchStateGeometry();
    const promises = states.map((state) =>
      fetchStateInternetSpeed(state.name, speedType).then((data) => ({
        name: state.name,
        data,
      })),
    );
    const results = await Promise.all(promises);
    return results;
  } catch (err) {
    console.error("Error fetching all states internet speed:", err);
    return [];
  }
}

// Fetch all valid Kreise names from the index using aggregation
export async function fetchAllKreiseNames() {
  const payload = {
    indexName: "inkar",
    indexAction: "_search",
    requestType: "post",
    dataForRemote: {
      size: 0,
      aggregations: {
        onlyAggregation: {
          terms: {
            field: "name.keyword",
            size: 800,
          },
        },
      },
      query: {
        bool: {
          must: [{ match: { raumbezug: "Kreise" } }],
        },
      },
    },
  };

  try {
    const result = await executeQuery(payload);
    const buckets = result?.aggregations?.onlyAggregation?.buckets || [];
    return buckets.map((b) => b.key).filter(Boolean);
  } catch (err) {
    console.error("Error fetching all Kreise names:", err);
    return [];
  }
}

// Fetch geometry for all Kreise (districts) in a specific state
export async function fetchKreiseGeometryForState(stateName) {
  const payload = {
    indexName: "bundesamt_kartographie_kreise",
    indexAction: "_search",
    requestType: "post",
    pretty: true,
    dataForRemote: {
      size: 500,
      query: {
        bool: {
          must: [{ term: { administrative_ebene: 4 } }],
        },
      },
      _source: true,
    },
  };

  try {
    const result = await executeQuery(payload);
    const hits = result?.hits?.hits || [];

    // Filter Kreise that belong to the selected state by checking the first 2 digits of amtlicher_regionalschluessel
    const stateGeometry = await fetchStateGeometry();
    const stateRSKey = stateGeometry.find(
      (s) => s.name === stateName,
    )?.amtlicher_regionalschluessel;

    if (!stateRSKey) {
      console.warn(`Could not find state: ${stateName}`);
      return [];
    }

    // Get the first 2 digits which represent the state code
    const stateCode = stateRSKey.substring(0, 2);

    return hits
      .filter((hit) =>
        hit._source?.amtlicher_regionalschluessel?.startsWith(stateCode),
      )
      .map((hit) => ({
        name: hit._source?.name,
        displayName: hit._source?.name,
        designation: hit._source?.bezeichnung,
        geolocation: hit._source?.geolocation,
        amtlicher_regionalschluessel: hit._source?.amtlicher_regionalschluessel,
      }));
  } catch (err) {
    console.error(`Error fetching Kreise geometry for ${stateName}:`, err);
    return [];
  }
}

// Fetch population data for all Kreise in a state
export async function fetchAllKreisePopulationForState(stateName) {
  try {
    const kreise = await fetchKreiseGeometryForState(stateName);

    if (kreise.length === 0) {
      console.warn(`No Kreise found for state: ${stateName}`);
      return [];
    }

    // Fetch all valid Kreise names from the index
    const validKreiseNames = await fetchAllKreiseNames();

    // All possible suffixes/prefixes for Kreise names
    const kreiseSuffixes = [
      "",
      ", Stadt",
      ", Landkreis",
      "Landkreis ",
      ", Freie und Hansestadt",
      ", Hansestadt",
      ", Klingenstadt",
      ", Landeshauptstadt",
      ", Stadt der FernUniversität",
      ", Stadtkreis",
      ", Wissenschaftsstadt",
      ", documenta-Stadt",
      ", kreisfreie Stadt",
    ];

    // For each geometry Kreise, find the best-matched name from valid Kreise names
    const kreiseWithMatchedNames = kreise
      .map((k) => {
        // Try all suffixes to find a match in valid names
        for (const suffix of kreiseSuffixes) {
          let variant;
          if (suffix.startsWith("Landkreis ")) {
            variant = `${suffix}${k.name}`;
          } else if (suffix) {
            variant = `${k.name}${suffix}`;
          } else {
            variant = k.name;
          }
          if (validKreiseNames.includes(variant)) {
            return { originalName: k.name, matchedName: variant };
          }
        }
        return null;
      })
      .filter(Boolean); // Remove Kreise with no match

    // Fetch data for each matched Kreise (one request per Kreise)
    const promises = kreiseWithMatchedNames.map((k) => {
      const payload = {
        indexAction: "_search",
        requestType: "post",
        pretty: true,
        dataForRemote: {
          size: 100,
          query: {
            bool: {
              must: [
                { match: { "name.keyword": k.matchedName } },
                { match: { raumbezug: "Kreise" } },
                { match: { bereich: "Absolutzahlen" } },
                { match: { indikator: "Bevölkerung gesamt" } },
              ],
            },
          },
          sort: [{ zeitbezug: { order: "asc" } }],
        },
        indexName: "inkar",
      };

      return executeQuery(payload)
        .then((result) => ({
          name: k.originalName,
          data: (result?.hits?.hits || []).map((hit) => ({
            year: parseInt(hit._source?.zeitbezug, 10),
            population: parseFloat(hit._source?.wert || 0),
          })),
        }))
        .catch(() => ({ name: k.originalName, data: [] }));
    });

    const results = await Promise.all(promises);
    return results.filter((r) => r.data.length > 0);
  } catch (err) {
    console.error(`Error fetching Kreise population for ${stateName}:`, err);
    return [];
  }
}

// Fetch internet speed data for all Kreise in a state
export async function fetchAllKreiseInternetSpeedForState(
  stateName,
  speedType = "1000",
) {
  const speedIndicators = {
    1000: "Bandbreitenverfügbarkeit mindestens 1.000 Mbit/s",
    100: "Bandbreitenverfügbarkeit mindestens 100 Mbit/s",
    50: "Bandbreitenverfügbarkeit mindestens 50 Mbit/s",
  };

  try {
    const kreise = await fetchKreiseGeometryForState(stateName);

    if (kreise.length === 0) {
      console.warn(`No Kreise found for state: ${stateName}`);
      return [];
    }

    // Fetch all valid Kreise names from the index
    const validKreiseNames = await fetchAllKreiseNames();

    // All possible suffixes/prefixes for Kreise names
    const kreiseSuffixes = [
      "",
      ", Stadt",
      ", Landkreis",
      "Landkreis ",
      ", Freie und Hansestadt",
      ", Hansestadt",
      ", Klingenstadt",
      ", Landeshauptstadt",
      ", Stadt der FernUniversität",
      ", Stadtkreis",
      ", Wissenschaftsstadt",
      ", documenta-Stadt",
      ", kreisfreie Stadt",
    ];

    // For each geometry Kreise, find the best-matched name from valid Kreise names
    const kreiseWithMatchedNames = kreise
      .map((k) => {
        // Try all suffixes to find a match in valid names
        for (const suffix of kreiseSuffixes) {
          let variant;
          if (suffix.startsWith("Landkreis ")) {
            variant = `${suffix}${k.name}`;
          } else if (suffix) {
            variant = `${k.name}${suffix}`;
          } else {
            variant = k.name;
          }
          if (validKreiseNames.includes(variant)) {
            return { originalName: k.name, matchedName: variant };
          }
        }
        return null;
      })
      .filter(Boolean); // Remove Kreise with no match

    // Fetch data for each matched Kreise (one request per Kreise)
    const promises = kreiseWithMatchedNames.map((k) => {
      const payload = {
        indexAction: "_search",
        requestType: "post",
        pretty: true,
        dataForRemote: {
          size: 100,
          query: {
            bool: {
              must: [
                { match: { "name.keyword": k.matchedName } },
                { match: { raumbezug: "Kreise" } },
                { match: { bereich: "Verkehr und Erreichbarkeit" } },
                { match: { indikator: speedIndicators[speedType] } },
              ],
            },
          },
          sort: [{ zeitbezug: { order: "asc" } }],
        },
        indexName: "inkar",
      };

      return executeQuery(payload)
        .then((result) => ({
          name: k.originalName,
          data: (result?.hits?.hits || []).map((hit) => ({
            year: parseInt(hit._source?.zeitbezug, 10),
            speed: parseFloat(hit._source?.wert || 0),
          })),
        }))
        .catch(() => ({ name: k.originalName, data: [] }));
    });

    const results = await Promise.all(promises);
    return results.filter((r) => r.data.length > 0);
  } catch (err) {
    console.error(
      `Error fetching Kreise internet speed for ${stateName}:`,
      err,
    );
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
  fetchGenderData,
  fetchTotalPopulation,
  fetchStateGeometry,
  fetchStatePopulation,
  fetchAllStatesPopulation,
  fetchStateInternetSpeed,
  fetchAllStatesInternetSpeed,
  fetchKreiseGeometryForState,
  fetchAllKreisePopulationForState,
  fetchAllKreiseInternetSpeedForState,
};
