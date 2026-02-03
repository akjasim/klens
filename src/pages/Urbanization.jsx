import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { geoMercator } from "d3-geo";
import {
  fetchStateGeometry,
  fetchAllStatesPopulation,
} from "../api/elasticsearch";
import { formatNumber } from "../helpers";

export default function Urbanization() {
  const { t } = useTranslation();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshesRef = useRef([]);
  const cameraStateRef = useRef(null);

  const [stateData, setStateData] = useState([]);
  const [populationData, setPopulationData] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [availableYears, setAvailableYears] = useState([]);
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [colorScheme, setColorScheme] = useState("heat"); // 'heat' or 'choropleth'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const animationIntervalRef = useRef(null);

  // Fetch state geometry and population data
  useEffect(() => {
    const fetchData = async () => {
      setDataError(null);
      setDataLoading(true);

      try {
        // Fetch all state geometries
        const states = await fetchStateGeometry();

        // Fetch population data for all states
        const popData = await fetchAllStatesPopulation();

        // Extract available years from population data
        const yearsSet = new Set();
        popData.forEach((stateEntry) => {
          stateEntry.data.forEach((entry) => yearsSet.add(entry.year));
        });
        const years = Array.from(yearsSet).sort((a, b) => a - b);

        setStateData(states);
        setPopulationData(popData);
        setAvailableYears(years);
        if (years.length > 0) {
          setSelectedYear(years[0]); // Default to first year
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setDataError(err.message || "Failed to fetch data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize Three.js scene with 3D Population Terrain
  useEffect(() => {
    if (
      !mountRef.current ||
      stateData.length === 0 ||
      populationData.length === 0 ||
      availableYears.length === 0
    )
      return;

    // Save camera state before cleanup
    if (cameraRef.current) {
      cameraStateRef.current = {
        position: cameraRef.current.position.clone(),
        target: new THREE.Vector3(0, 0, 0),
      };
    }

    // Clean up previous scene
    if (sceneRef.current) {
      meshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      meshesRef.current = [];
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (
          mountRef.current &&
          rendererRef.current.domElement.parentNode === mountRef.current
        ) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    }

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    sceneRef.current = scene;

    // Setup camera
    const width = mountRef.current.clientWidth;
    const height = isFullscreen ? window.innerHeight : 600;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);

    // Restore saved camera position or use default
    if (cameraStateRef.current) {
      camera.position.copy(cameraStateRef.current.position);
    } else {
      camera.position.set(25.82, 4.72, -799.57);
    }
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup OrbitControls for interactivity
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.screenSpacePanning = true; // Pan in screen space, not world space
    controls.minDistance = 50; // Allow zooming much closer
    controls.maxDistance = 1500; // Allow zooming much farther
    controls.minPolarAngle = 0; // Allow looking straight down
    controls.maxPolarAngle = Math.PI; // Allow looking from any angle
    controls.target.set(0, 0, 0); // Center of rotation
    controls.update();

    // Setup lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 200);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Setup projection (PHASE 2 - Convert lat/lon to map projection)
    const projection = geoMercator()
      .center([10.5, 51.2])
      .scale(3000)
      .translate([0, 0]);

    // Find population range for color scaling across ALL years for consistent color mapping
    let minPop = Infinity;
    let maxPop = -Infinity;

    populationData.forEach((stateEntry) => {
      stateEntry.data.forEach((yearData) => {
        const population = yearData.population / 1000; // Convert to thousands
        if (population > 0) {
          minPop = Math.min(minPop, population);
          maxPop = Math.max(maxPop, population);
        }
      });
    });

    console.log(
      `Population range (thousands): ${minPop.toFixed(0)} - ${maxPop.toFixed(0)}`,
    );

    // Color scale function - supports multiple schemes
    const getColor = (population) => {
      const normalized = (population - minPop) / (maxPop - minPop);

      if (colorScheme === "heat") {
        // Yellow (0) → Orange (0.5) → Red (1)
        if (normalized < 0.5) {
          // Yellow to Orange: green goes from 255 to 127
          const r = 255;
          const g = Math.round(255 - normalized * 2 * 128); // 255 -> 127
          const b = 0;
          return new THREE.Color(`rgb(${r},${g},${b})`);
        } else {
          // Orange to Red: green goes from 127 to 0
          const r = 255;
          const g = Math.round(127 * (1 - (normalized - 0.5) * 2)); // 127 -> 0
          const b = 0;
          return new THREE.Color(`rgb(${r},${g},${b})`);
        }
      } else {
        // Choropleth: Light Blue (0) → Dark Blue (1)
        const r = Math.round(255 * (1 - normalized * 0.7)); // 255 to 76
        const g = Math.round(200 * (1 - normalized * 0.8)); // 200 to 40
        const b = Math.round(255 * (1 - normalized * 0.2)); // 255 to 204
        return new THREE.Color(`rgb(${r},${g},${b})`);
      }
    };

    // Create 3D terrain for each state (PHASE 3 - Population = Height)
    stateData.forEach((state, stateIndex) => {
      if (!state.geolocation || !state.geolocation.coordinates) {
        return;
      }

      // Get population for this state (selected year) - convert to thousands
      const popEntry = populationData.find((e) => e.name === state.name);
      let population = 0;
      if (popEntry && popEntry.data.length > 0) {
        const yearData = popEntry.data.find((d) => d.year === selectedYear);
        population =
          (yearData ? yearData.population : popEntry.data[0].population || 0) /
          1000; // Convert to thousands
      }

      // Convert population (in thousands) to height - larger scale since numbers are in thousands
      const heightScale = 0.05; // Much larger scale for thousands (0.00005 * 1000)
      const terrainHeight = Math.max(3, population * heightScale);

      // Calculate normalized value for debugging
      const normalized = (population - minPop) / (maxPop - minPop);

      // Color by population
      const color = getColor(population);

      console.log(
        `${state.name}: ${population.toFixed(0)}k (norm: ${normalized.toFixed(3)}) → height ${terrainHeight.toFixed(1)}, color: rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`,
      );

      // PHASE 2: Convert polygons to 3D shapes
      const shapes = [];
      state.geolocation.coordinates.forEach((polygon) => {
        let outerRing = polygon[0];

        // Handle mixed coordinate formats
        if (outerRing && Array.isArray(outerRing) && outerRing.length > 0) {
          const firstElement = outerRing[0];
          if (typeof firstElement === "number") {
            outerRing = polygon;
          }
        }

        if (!outerRing || outerRing.length < 3) {
          return;
        }

        const shape = new THREE.Shape();
        let validPoints = 0;

        outerRing.forEach((coord, idx) => {
          const [lon, lat] = coord;
          const [x, y] = projection([lon, lat]);

          if (isNaN(x) || isNaN(y)) {
            return;
          }

          validPoints++;

          if (idx === 0) {
            shape.moveTo(-x, -y);
          } else {
            shape.lineTo(-x, -y);
          }
        });

        if (validPoints >= 3) {
          shapes.push(shape);
        }
      });

      if (shapes.length === 0) {
        return;
      }

      // PHASE 3: Create extruded geometry with population-based height
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: terrainHeight,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 2,
      });

      // Create material with the calculated color
      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.7,
        side: THREE.DoubleSide,
        emissive: color,
        emissiveIntensity: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Calculate bounding box area for prioritization (smaller states like Berlin)
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const area = (bbox.max.x - bbox.min.x) * (bbox.max.y - bbox.min.y);

      mesh.userData = {
        name: state.name,
        population: population,
        color: color,
        area: area,
      };

      // PHASE 4: Add border edges for terrain definition
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 }),
      );
      mesh.add(line);

      scene.add(mesh);
      meshesRef.current.push(mesh);
    });

    console.log("Total terrain meshes created:", meshesRef.current.length);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredMesh = null;

    const onMouseMove = (event) => {
      if (!mountRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Only check intersection with terrain meshes (not sprites)
      const terrainMeshes = meshesRef.current.filter(
        (mesh) => mesh.type === "Mesh",
      );
      const intersects = raycaster.intersectObjects(terrainMeshes, false);

      // Reset previous highlight
      if (currentHoveredMesh && currentHoveredMesh.material) {
        currentHoveredMesh.material.emissiveIntensity = 0.2;
        currentHoveredMesh = null;
      }

      if (intersects.length > 0) {
        // Define enclave states that are inside other states
        const enclaveStates = ["Berlin", "Bremen", "Hamburg"];

        // Check if any enclave state is in the intersections
        let selectedIntersect = null;

        for (const intersect of intersects) {
          const stateName = intersect.object.userData.name;
          if (enclaveStates.includes(stateName)) {
            selectedIntersect = intersect;
            break;
          }
        }

        // If no enclave found, use the first (closest) intersection
        if (!selectedIntersect) {
          selectedIntersect = intersects[0];
        }

        const intersectedMesh = selectedIntersect.object;
        const stateInfo = intersectedMesh.userData;

        if (stateInfo && stateInfo.name) {
          // Only update if state changed (prevents flickering)
          if (
            !currentHoveredMesh ||
            currentHoveredMesh.userData.name !== stateInfo.name
          ) {
            setHoveredState(stateInfo);
            setTooltipPosition({ x: event.clientX, y: event.clientY });
          }

          // Highlight effect
          currentHoveredMesh = intersectedMesh;
          if (intersectedMesh.material) {
            intersectedMesh.material.emissiveIntensity = 0.5;
          }
        }
      } else {
        setHoveredState(null);
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationId);
      meshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      meshesRef.current = [];
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (
          mountRef.current &&
          rendererRef.current.domElement &&
          rendererRef.current.domElement.parentNode === mountRef.current
        ) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [
    stateData,
    populationData,
    selectedYear,
    availableYears,
    colorScheme,
    isFullscreen,
  ]);

  // Play/pause animation effect
  useEffect(() => {
    if (isPlaying && availableYears.length > 0) {
      animationIntervalRef.current = setInterval(() => {
        setSelectedYear((currentYear) => {
          const currentIndex = availableYears.indexOf(currentYear);
          if (currentIndex < availableYears.length - 1) {
            return availableYears[currentIndex + 1];
          } else {
            // Stop at end (don't loop)
            setIsPlaying(false);
            return currentYear;
          }
        });
      }, 1000); // Normal speed: 1 second per year
    } else if (isFastForward && availableYears.length > 0) {
      animationIntervalRef.current = setInterval(() => {
        setSelectedYear((currentYear) => {
          const currentIndex = availableYears.indexOf(currentYear);
          if (currentIndex < availableYears.length - 1) {
            return availableYears[currentIndex + 1];
          } else {
            // Loop back to start for infinite loop
            return availableYears[0];
          }
        });
      }, 200); // 5x speed: 200ms per year (5 years per second)
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPlaying, isFastForward, availableYears]);

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
              "Explore population patterns across German states in 3D"}
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
                {t("fetchingUrbanizationData") || "Fetching data..."}
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

        {/* 3D Map Display */}
        {!dataLoading && !dataError && stateData.length > 0 && (
          <div className="row g-4 justify-content-center">
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h5
                      className="fw-bold mb-0"
                      style={{ color: "#2c3e50", fontSize: "1.3rem" }}
                    >
                      🏔️ 3D Population Terrain Map
                    </h5>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#999",
                        marginTop: "8px",
                        marginBottom: "0",
                      }}
                    >
                      Height = Population | Color = Density
                    </p>
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "6px",
                      border: "2px solid #007bff",
                      background: isFullscreen ? "#007bff" : "#fff",
                      color: isFullscreen ? "#fff" : "#007bff",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      transition: "all 0.3s ease",
                    }}
                    title={
                      isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                    }
                  >
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </button>
                </div>

                {/* 3D Canvas */}
                <div
                  style={{
                    padding: "32px",
                    ...(isFullscreen && {
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      zIndex: 9999,
                      background: "#fff",
                      padding: "0",
                    }),
                  }}
                >
                  {/* Fullscreen Exit Button */}
                  {isFullscreen && (
                    <button
                      onClick={() => setIsFullscreen(false)}
                      style={{
                        position: "fixed",
                        top: "20px",
                        right: "20px",
                        zIndex: 10001,
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "2px solid #dc3545",
                        background: "#fff",
                        color: "#dc3545",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#dc3545";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "#fff";
                        e.target.style.color = "#dc3545";
                      }}
                    >
                      Exit Fullscreen
                    </button>
                  )}
                  <div
                    ref={mountRef}
                    style={{
                      width: "100%",
                      height: isFullscreen ? "100vh" : "600px",
                      background: "#f0f4f8",
                    }}
                  />

                  {/* Year Slider and Play/Pause Controls */}
                  {availableYears.length > 0 && (
                    <div
                      style={{
                        ...(isFullscreen
                          ? {
                              position: "fixed",
                              bottom: "20px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: "90%",
                              maxWidth: "1200px",
                              zIndex: 10000,
                            }
                          : {
                              marginTop: "24px",
                            }),
                        padding: "20px",
                        background: isFullscreen
                          ? "rgba(255, 255, 255, 0.95)"
                          : "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        boxShadow: isFullscreen
                          ? "0 8px 32px rgba(0,0,0,0.2)"
                          : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flex: 1,
                          }}
                        >
                          {/* Color Scheme Toggle */}
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              padding: "4px",
                              background: "#f0f0f0",
                              borderRadius: "6px",
                            }}
                          >
                            <button
                              onClick={() => setColorScheme("heat")}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "4px",
                                border: "none",
                                background:
                                  colorScheme === "heat"
                                    ? "#ff6b35"
                                    : "transparent",
                                color: colorScheme === "heat" ? "#fff" : "#666",
                                fontWeight:
                                  colorScheme === "heat" ? "bold" : "normal",
                                cursor: "pointer",
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                              }}
                              title="Heat map: Yellow → Orange → Red"
                            >
                              Heat
                            </button>
                            <button
                              onClick={() => setColorScheme("choropleth")}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "4px",
                                border: "none",
                                background:
                                  colorScheme === "choropleth"
                                    ? "#004c97"
                                    : "transparent",
                                color:
                                  colorScheme === "choropleth"
                                    ? "#fff"
                                    : "#666",
                                fontWeight:
                                  colorScheme === "choropleth"
                                    ? "bold"
                                    : "normal",
                                cursor: "pointer",
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                              }}
                              title="Choropleth: Light Blue → Dark Blue"
                            >
                              Choropleth
                            </button>
                          </div>

                          {/* Fast Forward Button */}
                          <button
                            onClick={() => {
                              setIsFastForward(!isFastForward);
                              if (!isFastForward) {
                                setIsPlaying(false); // Stop normal play if starting fast forward
                              }
                            }}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "6px",
                              border: "2px solid #17a2b8",
                              background: isFastForward ? "#17a2b8" : "#fff",
                              color: isFastForward ? "#fff" : "#17a2b8",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "bold",
                              transition: "all 0.3s ease",
                            }}
                            title="Fast forward (5x speed, infinite loop)"
                          >
                            ⏩
                          </button>

                          {/* Play/Pause Button */}
                          <button
                            onClick={() => {
                              // If at last year and clicking play, reset to first year
                              if (
                                !isPlaying &&
                                selectedYear ===
                                  availableYears[availableYears.length - 1]
                              ) {
                                setSelectedYear(availableYears[0]);
                              }
                              setIsPlaying(!isPlaying);
                              if (!isPlaying) {
                                setIsFastForward(false); // Stop fast forward if starting normal play
                              }
                            }}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              border: "2px solid #007bff",
                              background: isPlaying ? "#007bff" : "#fff",
                              color: isPlaying ? "#fff" : "#007bff",
                              fontSize: "18px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isPlaying) {
                                e.target.style.background = "#f0f8ff";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isPlaying) {
                                e.target.style.background = "#fff";
                              }
                            }}
                          >
                            {isPlaying ? "⏸" : "▶"}
                          </button>

                          {/* Year Display */}
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: "bold",
                              color: "#2c3e50",
                              minWidth: "80px",
                            }}
                          >
                            {selectedYear}
                          </div>

                          {/* Slider */}
                          <input
                            type="range"
                            min={0}
                            max={availableYears.length - 1}
                            value={availableYears.indexOf(selectedYear)}
                            onChange={(e) => {
                              setIsPlaying(false);
                              setSelectedYear(
                                availableYears[parseInt(e.target.value)],
                              );
                            }}
                            style={{
                              flex: 1,
                              height: "8px",
                              borderRadius: "4px",
                              outline: "none",
                              background: `linear-gradient(to right, #007bff 0%, #007bff ${
                                (availableYears.indexOf(selectedYear) /
                                  (availableYears.length - 1)) *
                                100
                              }%, #ddd ${
                                (availableYears.indexOf(selectedYear) /
                                  (availableYears.length - 1)) *
                                100
                              }%, #ddd 100%)`,
                              cursor: "pointer",
                            }}
                          />

                          {/* Year Range */}
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#999",
                              minWidth: "100px",
                              textAlign: "right",
                            }}
                          >
                            {availableYears[0]} -{" "}
                            {availableYears[availableYears.length - 1]}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend - only show when not in fullscreen */}
                {!isFullscreen && (
                  <div
                    style={{
                      padding: "16px 32px",
                      borderTop: "1px solid #f0f0f0",
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ fontSize: "0.9rem", color: "#555" }}>
                      <strong>Color Scale:</strong>{" "}
                      {colorScheme === "heat"
                        ? "Yellow (Low) → Red (High)"
                        : "Light Blue (Low) → Dark Blue (High)"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#999",
                        marginTop: "8px",
                      }}
                    >
                      Hover over states to see details
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredState && (
          <div
            style={{
              position: "fixed",
              left: tooltipPosition.x + 15,
              top: tooltipPosition.y + 15,
              background: "rgba(0, 0, 0, 0.9)",
              color: "white",
              padding: "12px 16px",
              borderRadius: "8px",
              pointerEvents: "none",
              zIndex: isFullscreen ? 10002 : 1000,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                marginBottom: "6px",
              }}
            >
              {hoveredState.name}
            </div>
            <div style={{ color: "#aaa", fontSize: "13px" }}>
              Population:{" "}
              <span style={{ color: "#fff", fontWeight: "500" }}>
                {formatNumber(Math.round(hoveredState.population * 1000))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
