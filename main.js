import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

// ─── Scene Data ──────────────────────────────────────────
// Scene coordinate system (SHARP/OpenCV): x right, y down, z forward
// Actual Gaussian positions: center ≈ (0, 0, 2.2), Z=[0.88, 4.11]
const SCENES = [
  { path: "/splats/1apex.ply", label: "Apex I" },
  { path: "/splats/2apex.ply", label: "Apex II" },
  { path: "/splats/3apex.ply", label: "Apex III" },
  { path: "/splats/4apex.ply", label: "Apex IV" },
];

// ─── State ───────────────────────────────────────────────
let currentSceneIndex = -1;
let viewer = null;
let isLoading = false;

// ─── DOM ─────────────────────────────────────────────────
const container = document.getElementById("splat-container");
const loadingOverlay = document.getElementById("loading-overlay");
const sceneButtons = document.querySelectorAll(".scene-btn");

// ─── Viewer Setup ────────────────────────────────────────
function createViewer() {
  viewer = new GaussianSplats3D.Viewer({
    // Camera up is -Y in OpenCV convention
    cameraUp: [0, -1, 0],
    // Camera at origin, looking at scene center
    initialCameraPosition: [0, 0, 0],
    initialCameraLookAt: [0, 0, 2.2],
    rootElement: container,
    sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: true,
    integerBasedSort: true,
    halfPrecisionCovariancesOnGPU: true,
    antialiased: false,
    sphericalHarmonicsDegree: 0,
    dynamicScene: false,
    renderMode: GaussianSplats3D.RenderMode.Always,
    freeIntermediateSplatData: true,
    logLevel: GaussianSplats3D.LogLevel.Debug,
  });
}

// ─── Scene Loading ───────────────────────────────────────
async function loadScene(index) {
  if (isLoading || index === currentSceneIndex) return;
  isLoading = true;

  showLoading(`Loading ${SCENES[index].label}…`);
  updateActiveButton(index);

  // Dispose old viewer and create fresh one
  if (viewer) {
    try { viewer.dispose(); } catch (e) { console.warn("Dispose:", e); }
    viewer = null;
    container.innerHTML = "";
  }

  createViewer();
  currentSceneIndex = index;

  try {
    await viewer.addSplatScene(SCENES[index].path, {
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: false,
      progressiveLoad: false,
      format: GaussianSplats3D.SceneFormat.Ply,
    });
    viewer.start();
    console.log("Scene loaded and started:", SCENES[index].label);

    setTimeout(() => {
      hideLoading();
      isLoading = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to load scene:", err);
    hideLoading();
    isLoading = false;
  }
}

// ─── Loading UI ──────────────────────────────────────────
function showLoading(text) {
  loadingOverlay.classList.remove("hidden");
  const loadingText = loadingOverlay.querySelector(".loading-text");
  if (loadingText) loadingText.textContent = text;
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

// ─── Button State ────────────────────────────────────────
function updateActiveButton(index) {
  sceneButtons.forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
}

// ─── Event Listeners ─────────────────────────────────────
sceneButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const index = parseInt(btn.dataset.scene, 10);
    loadScene(index);
  });
});

document.addEventListener("keydown", (e) => {
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= SCENES.length) {
    loadScene(num - 1);
  }
});

// ─── Init ────────────────────────────────────────────────
loadScene(0);
