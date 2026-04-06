import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { geoMercator } from "d3-geo";
import {
  fetchStateGeometry,
  fetchAllStatesPopulation,
  fetchAllStatesInternetSpeed,
  fetchAllStatesBirthRate,
  fetchAllStatesDeathRate,
  fetchAllStatesImmigrationRate,
  fetchAllStatesEmigrationRate,
  fetchKreiseGeometryForState,
  fetchAllKreisePopulationForState,
  fetchAllKreiseInternetSpeedForState,
  fetchAllKreiseBirthRateForState,
  fetchAllKreiseDeathRateForState,
  fetchAllKreiseImmigrationRateForState,
  fetchAllKreiseEmigrationRateForState,
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
  const kreiseMountRef = useRef(null);
  const kreiseSceneRef = useRef(null);
  const kreiseCameraRef = useRef(null);
  const kreiseRendererRef = useRef(null);
  const kreiseMeshesRef = useRef([]);
  const kreiseCameraStateRef = useRef(null);
  const stateControlsRef = useRef(null);
  const kreiseControlsRef = useRef(null);

  const [stateData, setStateData] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [internetSpeedData, setInternetSpeedData] = useState([]);
  const [birthRateData, setBirthRateData] = useState([]);
  const [deathRateData, setDeathRateData] = useState([]);
  const [immigrationRateData, setImmigrationRateData] = useState([]);
  const [emigrationRateData, setEmigrationRateData] = useState([]);
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
  const [dataCategory, setDataCategory] = useState("population"); // 'population' or 'internetSpeed'
  const [speedType, setSpeedType] = useState("1000"); // '1000', '100', or '50' for internet speed
  const animationIntervalRef = useRef(null);

  const rateCategories = new Set([
    "birthRate",
    "deathRate",
    "immigrationRate",
    "emigrationRate",
  ]);

  // Kreise view state
  const [selectedState, setSelectedState] = useState(null); // Name of clicked state to view Kreise
  const [kreiseData, setKreiseData] = useState([]);
  const [kreisePopulationData, setKreisePopulationData] = useState([]);
  const [kreiseInternetSpeedData, setKreiseInternetSpeedData] = useState([]);
  const [kreiseBirthRateData, setKreiseBirthRateData] = useState([]);
  const [kreiseDeathRateData, setKreiseDeathRateData] = useState([]);
  const [kreiseImmigrationRateData, setKreiseImmigrationRateData] = useState(
    [],
  );
  const [kreiseEmigrationRateData, setKreiseEmigrationRateData] = useState([]);
  const [kreiseLoading, setKreiseLoading] = useState(false);

  const categoryMeta = {
    population: {
      label: "Population",
      subtitle: "Height = Population | Color = Density",
      unit: "k",
      heightScale: 0.05,
      valueKey: "population",
    },
    internetSpeed: {
      label: "Internet Speed",
      subtitle: "Height = Availability % | Color = Coverage Level",
      unit: "%",
      heightScale: 5,
      valueKey: "speed",
    },
    birthRate: {
      label: "Birth Rate",
      subtitle: "Height = Births per 1,000 people | Color = Coverage Level",
      unit: "‰",
      heightScale: 8,
      valueKey: "birthRate",
    },
    deathRate: {
      label: "Death Rate",
      subtitle: "Height = Deaths per 1,000 people | Color = Coverage Level",
      unit: "‰",
      heightScale: 8,
      valueKey: "deathRate",
    },
    immigrationRate: {
      label: "Immigration Rate",
      subtitle: "Height = Zuzugsrate per 1,000 people | Color = Coverage Level",
      unit: "‰",
      heightScale: 8,
      valueKey: "immigrationRate",
    },
    emigrationRate: {
      label: "Emigration Rate",
      subtitle:
        "Height = Fortzugsrate per 1,000 people | Color = Coverage Level",
      unit: "‰",
      heightScale: 8,
      valueKey: "emigrationRate",
    },
  };

  const getCategoryMeta = (category) =>
    categoryMeta[category] || categoryMeta.population;

  const getStateCategoryData = (category) => {
    if (category === "population") return populationData;
    if (category === "internetSpeed") return internetSpeedData;
    if (category === "birthRate") return birthRateData;
    if (category === "immigrationRate") return immigrationRateData;
    if (category === "emigrationRate") return emigrationRateData;
    return deathRateData;
  };

  const getKreiseCategoryData = (category) => {
    if (category === "population") return kreisePopulationData;
    if (category === "internetSpeed") return kreiseInternetSpeedData;
    if (category === "birthRate") return kreiseBirthRateData;
    if (category === "immigrationRate") return kreiseImmigrationRateData;
    if (category === "emigrationRate") return kreiseEmigrationRateData;
    return kreiseDeathRateData;
  };

  const getCategoryValue = (yearData, category) => {
    if (category === "population") return yearData?.population ?? 0;
    if (category === "internetSpeed") return yearData?.speed ?? 0;
    if (category === "birthRate") return yearData?.birthRate ?? 0;
    if (category === "deathRate") return yearData?.deathRate ?? 0;
    if (category === "immigrationRate") return yearData?.immigrationRate ?? 0;
    if (category === "emigrationRate") return yearData?.emigrationRate ?? 0;
    return 0;
  };

  const getPopulationForEntry = (series, entryName, year) => {
    const entry = series.find((item) => item.name === entryName);
    const yearData = entry?.data.find((item) => item.year === year);
    return yearData?.population ?? 0;
  };

  // Fetch state geometry and all state-level indicator data
  useEffect(() => {
    const fetchData = async () => {
      setDataError(null);
      setDataLoading(true);

      try {
        // Fetch all state geometries
        const states = await fetchStateGeometry();

        // Fetch population data for all states
        const popData = await fetchAllStatesPopulation();

        // Fetch the remaining indicators in parallel
        const [
          speedData,
          birthData,
          deathData,
          immigrationData,
          emigrationData,
        ] = await Promise.all([
          fetchAllStatesInternetSpeed(speedType),
          fetchAllStatesBirthRate(),
          fetchAllStatesDeathRate(),
          fetchAllStatesImmigrationRate(),
          fetchAllStatesEmigrationRate(),
        ]);

        setStateData(states);
        setPopulationData(popData);
        setInternetSpeedData(speedData);
        setBirthRateData(birthData);
        setDeathRateData(deathData);
        setImmigrationRateData(immigrationData);
        setEmigrationRateData(emigrationData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setDataError(err.message || "Failed to fetch data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [speedType]);

  useEffect(() => {
    const activeData = getStateCategoryData(dataCategory);
    if (!Array.isArray(activeData)) {
      setAvailableYears([]);
      return;
    }
    const yearsSet = new Set();

    activeData.forEach((stateEntry) => {
      stateEntry.data.forEach((entry) => yearsSet.add(entry.year));
    });

    const years = Array.from(yearsSet).sort((a, b) => a - b);
    setAvailableYears(years);

    if (years.length > 0) {
      setSelectedYear((currentYear) =>
        years.includes(currentYear) ? currentYear : years[0],
      );
    }
  }, [
    dataCategory,
    populationData,
    internetSpeedData,
    birthRateData,
    deathRateData,
    immigrationRateData,
    emigrationRateData,
  ]);

  // Fetch Kreise data when a state is selected
  useEffect(() => {
    if (!selectedState) {
      setKreiseData([]);
      setKreisePopulationData({});
      setKreiseInternetSpeedData({});
      setKreiseBirthRateData({});
      setKreiseDeathRateData({});
      setKreiseImmigrationRateData({});
      setKreiseEmigrationRateData({});
      return;
    }

    const fetchKreiseData = async () => {
      setKreiseLoading(true);
      try {
        const geometry = await fetchKreiseGeometryForState(selectedState);
        const popData = await fetchAllKreisePopulationForState(selectedState);
        const speedData = await fetchAllKreiseInternetSpeedForState(
          selectedState,
          speedType,
        );
        const birthData = await fetchAllKreiseBirthRateForState(selectedState);
        const deathData = await fetchAllKreiseDeathRateForState(selectedState);
        const immigrationData =
          await fetchAllKreiseImmigrationRateForState(selectedState);
        const emigrationData =
          await fetchAllKreiseEmigrationRateForState(selectedState);

        setKreiseData(geometry);
        setKreisePopulationData(popData);
        setKreiseInternetSpeedData(speedData);
        setKreiseBirthRateData(birthData);
        setKreiseDeathRateData(deathData);
        setKreiseImmigrationRateData(immigrationData);
        setKreiseEmigrationRateData(emigrationData);
      } catch (err) {
        console.error(`Error fetching Kreise data for ${selectedState}:`, err);
      } finally {
        setKreiseLoading(false);
      }
    };

    fetchKreiseData();
  }, [selectedState, speedType]);

  // Cleanup Kreise canvas and scene when selectedState is null
  useEffect(() => {
    if (selectedState === null) {
      // Dispose renderer
      if (kreiseRendererRef.current) {
        kreiseRendererRef.current.dispose();
        kreiseRendererRef.current = null;
      }
      // Dispose meshes
      kreiseMeshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      kreiseMeshesRef.current = [];
      // Dispose scene
      kreiseSceneRef.current = null;
      // Clear refs
      kreiseCameraRef.current = null;
      // Remove canvas from DOM if it still exists
      if (kreiseMountRef.current) {
        while (kreiseMountRef.current.firstChild) {
          kreiseMountRef.current.removeChild(kreiseMountRef.current.firstChild);
        }
      }
    }
  }, [selectedState]);

  // Initialize Three.js scene with 3D Terrain (Population or Internet Speed)
  useEffect(() => {
    if (
      !mountRef.current ||
      stateData.length === 0 ||
      getStateCategoryData(dataCategory).length === 0 ||
      availableYears.length === 0
    )
      return;

    // Get the active dataset based on category
    const activeData = getStateCategoryData(dataCategory);

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
    controls.maxDistance = 1700; // Allow zooming much farther
    controls.minPolarAngle = 0; // Allow looking straight down
    controls.maxPolarAngle = Math.PI; // Allow looking from any angle
    controls.target.set(0, 0, 0); // Center of rotation
    controls.update();
    stateControlsRef.current = controls;

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

    // Find data range for color scaling across ALL years for consistent color mapping
    let minValue = Infinity;
    let maxValue = -Infinity;

    activeData.forEach((stateEntry) => {
      stateEntry.data.forEach((yearData) => {
        let value = getCategoryValue(yearData, dataCategory);
        if (dataCategory === "population") {
          value /= 1000; // Convert to thousands
        }
        if (value > 0) {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });

    // Fallback to avoid invalid color normalization when all values are missing/identical.
    if (!isFinite(minValue) || !isFinite(maxValue) || maxValue <= minValue) {
      minValue = 0;
      maxValue = 1;
    }

    const logUnit = getCategoryMeta(dataCategory).unit;
    console.log(
      `${getCategoryMeta(dataCategory).label} range: ${minValue.toFixed(1)}${logUnit} - ${maxValue.toFixed(1)}${logUnit}`,
    );

    // Color scale function - supports multiple schemes
    const getColor = (value) => {
      const range = maxValue - minValue;
      const normalized =
        range > 0 ? Math.max(0, Math.min(1, (value - minValue) / range)) : 0;

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
        // Cool gradient: Light Blue (0) → Dark Blue (1)
        const r = Math.round(255 * (1 - normalized * 0.7)); // 255 to 76
        const g = Math.round(200 * (1 - normalized * 0.8)); // 200 to 40
        const b = Math.round(255 * (1 - normalized * 0.2)); // 255 to 204
        return new THREE.Color(`rgb(${r},${g},${b})`);
      }
    };

    // Create 3D terrain for each state (Data value = Height)
    stateData.forEach((state) => {
      if (!state.geolocation || !state.geolocation.coordinates) {
        return;
      }

      // Get data for this state (selected year)
      const dataEntry = activeData.find((e) => e.name === state.name);
      let value = 0;
      let displayValue = 0;
      const categoryInfo = getCategoryMeta(dataCategory);
      let displayLabel = categoryInfo.label;

      if (dataEntry && dataEntry.data.length > 0) {
        const yearData = dataEntry.data.find((d) => d.year === selectedYear);
        const selectedData = yearData || dataEntry.data[0];
        const rateYear = selectedData.year;
        value = getCategoryValue(selectedData, dataCategory);
        if (dataCategory === "population") {
          value /= 1000; // Convert to thousands
          displayValue = value * 1000; // For display purposes
        } else if (
          dataCategory === "birthRate" ||
          dataCategory === "deathRate" ||
          dataCategory === "immigrationRate" ||
          dataCategory === "emigrationRate"
        ) {
          const population = getPopulationForEntry(
            populationData,
            state.name,
            rateYear,
          );
          displayValue = (population * value) / 1000;
          displayLabel =
            dataCategory === "birthRate"
              ? "Estimated births"
              : dataCategory === "deathRate"
                ? "Estimated deaths"
                : dataCategory === "immigrationRate"
                  ? "Estimated immigrants"
                  : "Estimated emigrants";
        } else {
          displayValue = value;
        }
      }

      // Convert value to height with category-aware scaling.
      // For rate indicators (per 1,000), use normalized height to avoid huge spikes.
      const heightScale = categoryInfo.heightScale;
      const normalized =
        maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
      const clampedNormalized = Math.max(0, Math.min(1, normalized));
      const terrainHeight = rateCategories.has(dataCategory)
        ? 3 + clampedNormalized * 117
        : Math.max(3, value * heightScale);

      // Color by value
      const color = getColor(value);

      const unit = categoryInfo.unit;
      console.log(
        `${state.name}: ${value.toFixed(dataCategory === "population" ? 0 : 1)}${unit} (norm: ${normalized.toFixed(3)}) → height ${terrainHeight.toFixed(1)}, color: rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`,
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
        value: value,
        displayValue: displayValue,
        dataCategory: dataCategory,
        color: color,
        area: area,
        unit: unit,
        displayLabel: displayLabel,
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

    // Improved click detection: only trigger click if mouse hasn't moved significantly (not a drag)
    let mouseDownPos = null;
    const CLICK_THRESHOLD = 5; // pixels

    const onMouseDown = (event) => {
      mouseDownPos = { x: event.clientX, y: event.clientY };
    };
    const onMouseUp = (event) => {
      if (!mouseDownPos) return;
      const dx = event.clientX - mouseDownPos.x;
      const dy = event.clientY - mouseDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > CLICK_THRESHOLD) {
        mouseDownPos = null;
        return; // Considered a drag, not a click
      }
      // Only trigger click if mouse didn't move much
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const terrainMeshes = meshesRef.current.filter(
        (mesh) => mesh.type === "Mesh",
      );
      const intersects = raycaster.intersectObjects(terrainMeshes, false);
      if (intersects.length > 0) {
        const enclaveStates = ["Berlin", "Bremen", "Hamburg"];
        let selectedIntersect = null;
        for (const intersect of intersects) {
          const stateName = intersect.object.userData.name;
          if (enclaveStates.includes(stateName)) {
            selectedIntersect = intersect;
            break;
          }
        }
        if (!selectedIntersect) {
          selectedIntersect = intersects[0];
        }
        const intersectedMesh = selectedIntersect.object;
        const stateInfo = intersectedMesh.userData;
        if (stateInfo && stateInfo.name) {
          setSelectedState(stateInfo.name);
        }
      }
      mouseDownPos = null;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
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
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
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
    internetSpeedData,
    selectedYear,
    availableYears,
    colorScheme,
    isFullscreen,
    dataCategory,
    selectedState,
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

  // Initialize Kreise 3D scene
  useEffect(() => {
    // Clean up Kreise renderer and canvas when selectedState is null or conditions aren't met
    if (
      !kreiseMountRef.current ||
      !selectedState ||
      kreiseData.length === 0 ||
      getKreiseCategoryData(dataCategory).length === 0
    ) {
      // Always clean up when these conditions aren't met
      if (kreiseRendererRef.current && kreiseMountRef.current) {
        kreiseRendererRef.current.dispose();
        if (
          kreiseRendererRef.current.domElement &&
          kreiseRendererRef.current.domElement.parentNode ===
            kreiseMountRef.current
        ) {
          kreiseMountRef.current.removeChild(
            kreiseRendererRef.current.domElement,
          );
        }
        kreiseRendererRef.current = null;
      }
      kreiseMeshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      kreiseMeshesRef.current = [];
      return;
    }

    const activeKreiseData = getKreiseCategoryData(dataCategory);

    // Save camera state before cleanup
    if (kreiseCameraRef.current && kreiseControlsRef.current) {
      kreiseCameraStateRef.current = {
        position: kreiseCameraRef.current.position.clone(),
        target: kreiseControlsRef.current.target.clone(),
      };
    }
    // Clean up previous scene
    if (kreiseSceneRef.current) {
      kreiseMeshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      kreiseMeshesRef.current = [];
      if (kreiseRendererRef.current) {
        kreiseRendererRef.current.dispose();
        if (
          kreiseMountRef.current &&
          kreiseRendererRef.current.domElement &&
          kreiseRendererRef.current.domElement.parentNode ===
            kreiseMountRef.current
        ) {
          kreiseMountRef.current.removeChild(
            kreiseRendererRef.current.domElement,
          );
        }
      }
    }

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    kreiseSceneRef.current = scene;

    // Setup camera
    const width = kreiseMountRef.current.clientWidth;
    const height = isFullscreen ? window.innerHeight : 600;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);

    // Restore previous camera position/target if available, else use default
    if (kreiseCameraStateRef.current) {
      camera.position.copy(kreiseCameraStateRef.current.position);
    } else {
      camera.position.set(4.29, 0.78, -49.81);
    }
    camera.lookAt(0, 0, 0);
    kreiseCameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    kreiseMountRef.current.appendChild(renderer.domElement);
    kreiseRendererRef.current = renderer;

    // Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.screenSpacePanning = true;
    controls.minDistance = 50;
    controls.maxDistance = 1700;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    if (kreiseCameraStateRef.current) {
      controls.target.copy(kreiseCameraStateRef.current.target);
    } else {
      controls.target.set(0, 0, 0);
    }
    controls.update();
    kreiseControlsRef.current = controls;

    // Setup lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 200);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Calculate bounding box of all Kreise to center the projection
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    kreiseData.forEach((kreise) => {
      if (!kreise.geolocation || !kreise.geolocation.coordinates) return;
      kreise.geolocation.coordinates.forEach((polygon) => {
        let outerRing = polygon[0];
        if (outerRing && Array.isArray(outerRing) && outerRing.length > 0) {
          const firstElement = outerRing[0];
          if (typeof firstElement === "number") {
            outerRing = polygon;
          }
        }
        if (!outerRing) return;
        outerRing.forEach(([lon, lat]) => {
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        });
      });
    });

    // Calculate center and scale for Kreise
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    // Calculate scale to fit Kreise data in view (adjust divisor to fit your needs)
    const scale = Math.min(
      3000,
      3000 * (1 / Math.max(lonRange, latRange)) * 0.8,
    );

    // Setup projection centered on Kreise data
    const projection = geoMercator()
      .center([centerLon, centerLat])
      .scale(scale)
      .translate([0, 0]);

    // Find data range for color scaling
    let minValue = Infinity;
    let maxValue = -Infinity;

    activeKreiseData.forEach((kreisEntry) => {
      kreisEntry.data.forEach((yearData) => {
        let value = getCategoryValue(yearData, dataCategory);
        if (dataCategory === "population") {
          value /= 1000;
        }
        if (value > 0) {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });

    if (!isFinite(minValue) || !isFinite(maxValue) || maxValue <= minValue) {
      minValue = 0;
      maxValue = 1;
    }

    console.log(
      `Kreise ${getCategoryMeta(dataCategory).label} range: ${minValue.toFixed(1)}${getCategoryMeta(dataCategory).unit} - ${maxValue.toFixed(1)}${getCategoryMeta(dataCategory).unit}`,
    );

    // Color scale function
    const getColor = (value) => {
      const range = maxValue - minValue;
      const normalized =
        range > 0 ? Math.max(0, Math.min(1, (value - minValue) / range)) : 0;

      if (colorScheme === "heat") {
        if (normalized < 0.5) {
          const r = 255;
          const g = Math.round(255 - normalized * 2 * 128);
          const b = 0;
          return new THREE.Color(`rgb(${r},${g},${b})`);
        } else {
          const r = 255;
          const g = Math.round(127 * (1 - (normalized - 0.5) * 2));
          const b = 0;
          return new THREE.Color(`rgb(${r},${g},${b})`);
        }
      } else {
        const r = Math.round(255 * (1 - normalized * 0.7));
        const g = Math.round(200 * (1 - normalized * 0.8));
        const b = Math.round(255 * (1 - normalized * 0.2));
        return new THREE.Color(`rgb(${r},${g},${b})`);
      }
    };

    // Create 3D terrain for each Kreise
    kreiseData.forEach((kreise) => {
      if (!kreise.geolocation || !kreise.geolocation.coordinates) {
        return;
      }

      const kreiseLabel = kreise.displayName || kreise.name;

      // Get data for this Kreise
      const dataEntry = activeKreiseData.find((e) => e.name === kreiseLabel);
      let value = 0;
      let displayValue = 0;
      const categoryInfo = getCategoryMeta(dataCategory);
      let displayLabel = categoryInfo.label;

      if (dataEntry && dataEntry.data.length > 0) {
        const yearData = dataEntry.data.find((d) => d.year === selectedYear);
        const selectedData = yearData || dataEntry.data[0];
        const rateYear = selectedData.year;
        value = getCategoryValue(selectedData, dataCategory);
        if (dataCategory === "population") {
          value /= 1000;
          displayValue = value * 1000;
        } else if (
          dataCategory === "birthRate" ||
          dataCategory === "deathRate" ||
          dataCategory === "immigrationRate" ||
          dataCategory === "emigrationRate"
        ) {
          const population = getPopulationForEntry(
            kreisePopulationData,
            kreiseLabel,
            rateYear,
          );
          displayValue = (population * value) / 1000;
          displayLabel =
            dataCategory === "birthRate"
              ? "Estimated births"
              : dataCategory === "deathRate"
                ? "Estimated deaths"
                : dataCategory === "immigrationRate"
                  ? "Estimated immigrants"
                  : "Estimated emigrants";
        } else {
          displayValue = value;
        }
      }

      // Convert value to height with category-aware scaling.
      // For rate indicators (per 1,000), use normalized height to avoid huge spikes.
      const heightScale = categoryInfo.heightScale;
      const normalized =
        maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
      const clampedNormalized = Math.max(0, Math.min(1, normalized));
      const terrainHeight = rateCategories.has(dataCategory)
        ? 3 + clampedNormalized * 117
        : Math.max(3, value * heightScale);

      const color = getColor(value);

      // Create 3D shapes
      const shapes = [];
      kreise.geolocation.coordinates.forEach((polygon) => {
        let outerRing = polygon[0];

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

      // Create extruded geometry
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: terrainHeight,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 2,
      });

      // Create material
      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.7,
        side: THREE.DoubleSide,
        emissive: color,
        emissiveIntensity: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const area = (bbox.max.x - bbox.min.x) * (bbox.max.y - bbox.min.y);

      mesh.userData = {
        name: kreiseLabel,
        value: value,
        displayValue: displayValue,
        dataCategory: dataCategory,
        color: color,
        area: area,
        unit: categoryInfo.unit,
        displayLabel: displayLabel,
      };

      // Add border edges
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 }),
      );
      mesh.add(line);

      scene.add(mesh);
      kreiseMeshesRef.current.push(mesh);
    });

    console.log("Total Kreise meshes created:", kreiseMeshesRef.current.length);

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
      if (!kreiseMountRef.current) return;

      const rect = kreiseMountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Only check intersection with terrain meshes (not sprites)
      const terrainMeshes = kreiseMeshesRef.current.filter(
        (mesh) => mesh.type === "Mesh",
      );
      const intersects = raycaster.intersectObjects(terrainMeshes, false);

      // Reset previous highlight
      if (currentHoveredMesh && currentHoveredMesh.material) {
        currentHoveredMesh.material.emissiveIntensity = 0.2;
        currentHoveredMesh = null;
      }

      if (intersects.length > 0) {
        // Use the first (closest) intersection
        const selectedIntersect = intersects[0];

        const intersectedMesh = selectedIntersect.object;
        const kreiseInfo = intersectedMesh.userData;

        if (kreiseInfo && kreiseInfo.name) {
          // Only update if state changed (prevents flickering)
          if (
            !currentHoveredMesh ||
            currentHoveredMesh.userData.name !== kreiseInfo.name
          ) {
            setHoveredState(kreiseInfo);
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
      if (!kreiseMountRef.current) return;
      const width = kreiseMountRef.current.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationId);
      kreiseMeshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      kreiseMeshesRef.current = [];
      if (kreiseRendererRef.current) {
        kreiseRendererRef.current.dispose();
        if (
          kreiseMountRef.current &&
          kreiseRendererRef.current.domElement &&
          kreiseRendererRef.current.domElement.parentNode ===
            kreiseMountRef.current
        ) {
          kreiseMountRef.current.removeChild(
            kreiseRendererRef.current.domElement,
          );
        }
      }
    };
  }, [
    selectedState,
    kreiseData,
    kreisePopulationData,
    kreiseInternetSpeedData,
    selectedYear,
    colorScheme,
    isFullscreen,
    dataCategory,
  ]);

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
              "Explore demographic and connectivity patterns across German states in 3D"}
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

        {/* 3D Map Display - State Level View */}
        {!selectedState &&
          !dataLoading &&
          !dataError &&
          stateData.length > 0 && (
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
                        🏔️ 3D {getCategoryMeta(dataCategory).label} Terrain Map
                      </h5>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#999",
                          marginTop: "8px",
                          marginBottom: "0",
                        }}
                      >
                        {getCategoryMeta(dataCategory).subtitle}
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
                            {/* Data Category Toggle */}
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
                                onClick={() => setDataCategory("population")}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: "4px",
                                  border: "none",
                                  background:
                                    dataCategory === "population"
                                      ? "#28a745"
                                      : "transparent",
                                  color:
                                    dataCategory === "population"
                                      ? "#fff"
                                      : "#666",
                                  fontWeight:
                                    dataCategory === "population"
                                      ? "bold"
                                      : "normal",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.3s ease",
                                }}
                                title="Population data"
                              >
                                Population
                              </button>
                              <button
                                onClick={() => setDataCategory("internetSpeed")}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: "4px",
                                  border: "none",
                                  background:
                                    dataCategory === "internetSpeed"
                                      ? "#17a2b8"
                                      : "transparent",
                                  color:
                                    dataCategory === "internetSpeed"
                                      ? "#fff"
                                      : "#666",
                                  fontWeight:
                                    dataCategory === "internetSpeed"
                                      ? "bold"
                                      : "normal",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.3s ease",
                                }}
                                title="Internet speed data"
                              >
                                Internet Speed
                              </button>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                  }}
                                >
                                  <button
                                    onClick={() => setDataCategory("birthRate")}
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: "4px",
                                      border: "none",
                                      background:
                                        dataCategory === "birthRate"
                                          ? "#c0392b"
                                          : "transparent",
                                      color:
                                        dataCategory === "birthRate"
                                          ? "#fff"
                                          : "#666",
                                      fontWeight:
                                        dataCategory === "birthRate"
                                          ? "bold"
                                          : "normal",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      transition: "all 0.3s ease",
                                    }}
                                    title="Birth rate data (people born per 1,000 people)"
                                  >
                                    Birth
                                  </button>
                                  <button
                                    onClick={() => setDataCategory("deathRate")}
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: "4px",
                                      border: "none",
                                      background:
                                        dataCategory === "deathRate"
                                          ? "#34495e"
                                          : "transparent",
                                      color:
                                        dataCategory === "deathRate"
                                          ? "#fff"
                                          : "#666",
                                      fontWeight:
                                        dataCategory === "deathRate"
                                          ? "bold"
                                          : "normal",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      transition: "all 0.3s ease",
                                    }}
                                    title="Death rate data (people died per 1,000 people)"
                                  >
                                    Death
                                  </button>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      setDataCategory("immigrationRate")
                                    }
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: "4px",
                                      border: "none",
                                      background:
                                        dataCategory === "immigrationRate"
                                          ? "#2e7d32"
                                          : "transparent",
                                      color:
                                        dataCategory === "immigrationRate"
                                          ? "#fff"
                                          : "#666",
                                      fontWeight:
                                        dataCategory === "immigrationRate"
                                          ? "bold"
                                          : "normal",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      transition: "all 0.3s ease",
                                    }}
                                    title="Zuzugsrate data (people moving in per 1,000 people)"
                                  >
                                    Immigration
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDataCategory("emigrationRate")
                                    }
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: "4px",
                                      border: "none",
                                      background:
                                        dataCategory === "emigrationRate"
                                          ? "#6c757d"
                                          : "transparent",
                                      color:
                                        dataCategory === "emigrationRate"
                                          ? "#fff"
                                          : "#666",
                                      fontWeight:
                                        dataCategory === "emigrationRate"
                                          ? "bold"
                                          : "normal",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      transition: "all 0.3s ease",
                                    }}
                                    title="Fortzugsrate data (people moving out per 1,000 people)"
                                  >
                                    Emigration
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Speed Tier Toggle (Internet Speed only) */}
                            {dataCategory === "internetSpeed" && (
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
                                  onClick={() => setSpeedType("50")}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      speedType === "50"
                                        ? "#28a745"
                                        : "transparent",
                                    color: speedType === "50" ? "#fff" : "#666",
                                    fontWeight:
                                      speedType === "50" ? "bold" : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="50 Mbit/s availability"
                                >
                                  50 Mbit/s
                                </button>
                                <button
                                  onClick={() => setSpeedType("100")}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      speedType === "100"
                                        ? "#ffc107"
                                        : "transparent",
                                    color:
                                      speedType === "100" ? "#000" : "#666",
                                    fontWeight:
                                      speedType === "100" ? "bold" : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="100 Mbit/s availability"
                                >
                                  100 Mbit/s
                                </button>
                                <button
                                  onClick={() => setSpeedType("1000")}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      speedType === "1000"
                                        ? "#dc3545"
                                        : "transparent",
                                    color:
                                      speedType === "1000" ? "#fff" : "#666",
                                    fontWeight:
                                      speedType === "1000" ? "bold" : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="1000 Mbit/s (1 Gbit/s) availability"
                                >
                                  1000 Mbit/s
                                </button>
                              </div>
                            )}

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
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
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
                                    color:
                                      colorScheme === "heat" ? "#fff" : "#666",
                                    fontWeight:
                                      colorScheme === "heat"
                                        ? "bold"
                                        : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="Warm gradient: Yellow → Orange → Red"
                                >
                                  Warm
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
                                  title="Cool gradient: Light Blue → Dark Blue"
                                >
                                  Cool
                                </button>
                              </div>
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
                                setIsFastForward(false);
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
                        <strong>Category:</strong>{" "}
                        {dataCategory === "internetSpeed"
                          ? `${speedType} Mbit/s availability`
                          : getCategoryMeta(dataCategory).label}
                      </div>
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

        {/* 3D Map Display - Kreise Level View */}
        {selectedState && !kreiseLoading && kreiseData.length > 0 && (
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
                      🏔️ 3D {getCategoryMeta(dataCategory).label} Kreise Map -{" "}
                      {selectedState}
                    </h5>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#999",
                        marginTop: "8px",
                        marginBottom: "0",
                      }}
                    >
                      Kreise (districts) separated by administrative borders
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    {/* Fullscreen Button for Kreise */}
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
                    {/* Back Button */}
                    <button
                      onClick={() => setSelectedState(null)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "6px",
                        border: "2px solid #dc3545",
                        background: "#fff",
                        color: "#dc3545",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
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
                      title="Back to state-level view"
                    >
                      ← Back to States
                    </button>
                  </div>
                </div>

                {/* 3D Canvas */}
                <div
                  style={{
                    padding: isFullscreen ? "0" : "32px",
                    ...(isFullscreen && {
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      zIndex: 9999,
                      background: "#fff",
                    }),
                  }}
                >
                  {/* Fullscreen Exit Button for Kreise */}
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
                    ref={kreiseMountRef}
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
                          {/* Data Category Toggle */}
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
                              onClick={() => setDataCategory("population")}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "4px",
                                border: "none",
                                background:
                                  dataCategory === "population"
                                    ? "#28a745"
                                    : "transparent",
                                color:
                                  dataCategory === "population"
                                    ? "#fff"
                                    : "#666",
                                fontWeight:
                                  dataCategory === "population"
                                    ? "bold"
                                    : "normal",
                                cursor: "pointer",
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                              }}
                              title="Population data"
                            >
                              Population
                            </button>
                            <button
                              onClick={() => setDataCategory("internetSpeed")}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "4px",
                                border: "none",
                                background:
                                  dataCategory === "internetSpeed"
                                    ? "#17a2b8"
                                    : "transparent",
                                color:
                                  dataCategory === "internetSpeed"
                                    ? "#fff"
                                    : "#666",
                                fontWeight:
                                  dataCategory === "internetSpeed"
                                    ? "bold"
                                    : "normal",
                                cursor: "pointer",
                                fontSize: "13px",
                                transition: "all 0.3s ease",
                              }}
                              title="Internet speed data"
                            >
                              Internet Speed
                            </button>
                          </div>

                          {/* Speed Tier Toggle (Internet Speed only) */}
                          {dataCategory === "internetSpeed" && (
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
                                onClick={() => setSpeedType("50")}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "4px",
                                  border: "none",
                                  background:
                                    speedType === "50"
                                      ? "#28a745"
                                      : "transparent",
                                  color: speedType === "50" ? "#fff" : "#666",
                                  fontWeight:
                                    speedType === "50" ? "bold" : "normal",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.3s ease",
                                }}
                                title="50 Mbit/s availability"
                              >
                                50 Mbit/s
                              </button>
                              <button
                                onClick={() => setSpeedType("100")}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "4px",
                                  border: "none",
                                  background:
                                    speedType === "100"
                                      ? "#ffc107"
                                      : "transparent",
                                  color: speedType === "100" ? "#000" : "#666",
                                  fontWeight:
                                    speedType === "100" ? "bold" : "normal",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.3s ease",
                                }}
                                title="100 Mbit/s availability"
                              >
                                100 Mbit/s
                              </button>
                              <button
                                onClick={() => setSpeedType("1000")}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "4px",
                                  border: "none",
                                  background:
                                    speedType === "1000"
                                      ? "#dc3545"
                                      : "transparent",
                                  color: speedType === "1000" ? "#fff" : "#666",
                                  fontWeight:
                                    speedType === "1000" ? "bold" : "normal",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.3s ease",
                                }}
                                title="1000 Mbit/s (1 Gbit/s) availability"
                              >
                                1000 Mbit/s
                              </button>
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              padding: "4px",
                              background: "#f0f0f0",
                              borderRadius: "6px",
                            }}
                          >
                            <div style={{ display: "flex", gap: "8px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                <button
                                  onClick={() => setDataCategory("birthRate")}
                                  style={{
                                    padding: "8px 16px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      dataCategory === "birthRate"
                                        ? "#c0392b"
                                        : "transparent",
                                    color:
                                      dataCategory === "birthRate"
                                        ? "#fff"
                                        : "#666",
                                    fontWeight:
                                      dataCategory === "birthRate"
                                        ? "bold"
                                        : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="Birth rate data (people born per 1,000 people)"
                                >
                                  Birth
                                </button>
                                <button
                                  onClick={() => setDataCategory("deathRate")}
                                  style={{
                                    padding: "8px 16px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      dataCategory === "deathRate"
                                        ? "#34495e"
                                        : "transparent",
                                    color:
                                      dataCategory === "deathRate"
                                        ? "#fff"
                                        : "#666",
                                    fontWeight:
                                      dataCategory === "deathRate"
                                        ? "bold"
                                        : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="Death rate data (people died per 1,000 people)"
                                >
                                  Death
                                </button>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    setDataCategory("immigrationRate")
                                  }
                                  style={{
                                    padding: "8px 16px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      dataCategory === "immigrationRate"
                                        ? "#2e7d32"
                                        : "transparent",
                                    color:
                                      dataCategory === "immigrationRate"
                                        ? "#fff"
                                        : "#666",
                                    fontWeight:
                                      dataCategory === "immigrationRate"
                                        ? "bold"
                                        : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="Zuzugsrate data (people moving in per 1,000 people)"
                                >
                                  Immigration
                                </button>
                                <button
                                  onClick={() =>
                                    setDataCategory("emigrationRate")
                                  }
                                  style={{
                                    padding: "8px 16px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      dataCategory === "emigrationRate"
                                        ? "#6c757d"
                                        : "transparent",
                                    color:
                                      dataCategory === "emigrationRate"
                                        ? "#fff"
                                        : "#666",
                                    fontWeight:
                                      dataCategory === "emigrationRate"
                                        ? "bold"
                                        : "normal",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "all 0.3s ease",
                                  }}
                                  title="Fortzugsrate data (people moving out per 1,000 people)"
                                >
                                  Emigration
                                </button>
                              </div>
                            </div>
                          </div>

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
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
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
                                  color:
                                    colorScheme === "heat" ? "#fff" : "#666",
                                  fontWeight:
                                    colorScheme === "heat" ? "bold" : "normal",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  transition: "all 0.3s ease",
                                }}
                                title="Warm gradient: Yellow → Orange → Red"
                              >
                                Warm
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
                                title="Cool gradient: Light Blue → Dark Blue"
                              >
                                Cool
                              </button>
                            </div>
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
                              if (
                                !isPlaying &&
                                selectedYear ===
                                  availableYears[availableYears.length - 1]
                              ) {
                                setSelectedYear(availableYears[0]);
                              }
                              setIsPlaying(!isPlaying);
                              if (!isPlaying) {
                                setIsFastForward(false);
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
                              setIsFastForward(false);
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

                {/* Legend */}
                <div
                  style={{
                    padding: "16px 32px",
                    borderTop: "1px solid #f0f0f0",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: "0.9rem", color: "#555" }}>
                    <strong>Category:</strong>{" "}
                    {dataCategory === "internetSpeed"
                      ? `${speedType} Mbit/s availability`
                      : getCategoryMeta(dataCategory).label}
                  </div>
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
                    Hover over Kreise to see details. Click states on the main
                    map to zoom in.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kreise Loading State */}
        {selectedState && kreiseLoading && (
          <div className="row justify-content-center">
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t("loading")}</span>
              </div>
              <p className="text-muted mt-3">
                {t("loading") || "Loading Kreise data for"} {selectedState}...
              </p>
            </div>
          </div>
        )}

        {/* Kreise Error State */}
        {selectedState && !kreiseLoading && kreiseData.length === 0 && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="alert alert-warning" role="alert">
                <strong>No data:</strong> No Kreise data found for{" "}
                {selectedState}.
                <button
                  onClick={() => setSelectedState(null)}
                  style={{
                    marginLeft: "16px",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "none",
                    background: "#ffc107",
                    color: "#000",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Back to States
                </button>
              </div>
            </div>
          </div>
        )}

        {hoveredState && (
          <div
            key={`${hoveredState.name}-${hoveredState.dataCategory}-${hoveredState.displayValue}`}
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
              {hoveredState.dataCategory === "population" ? (
                <>
                  Population:{" "}
                  <span style={{ color: "#fff", fontWeight: "500" }}>
                    {formatNumber(Math.round(hoveredState.displayValue))}
                  </span>
                </>
              ) : hoveredState.dataCategory === "internetSpeed" ? (
                <>
                  {speedType} Mbit/s Availability:{" "}
                  <span style={{ color: "#fff", fontWeight: "500" }}>
                    {hoveredState.displayValue.toFixed(1)}%
                  </span>
                </>
              ) : (
                <div>
                  <div>
                    Rate (per 1,000):{" "}
                    <span style={{ color: "#fff", fontWeight: "500" }}>
                      {typeof hoveredState.value === "number"
                        ? hoveredState.value.toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <div>
                    {hoveredState.displayLabel ||
                      getCategoryMeta(hoveredState.dataCategory).label}
                    :{" "}
                    <span style={{ color: "#fff", fontWeight: "500" }}>
                      {formatNumber(Math.round(hoveredState.displayValue))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
