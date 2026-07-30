(function () {
  const video = document.getElementById("cameraFeed");
  const canvas = document.getElementById("captureCanvas");
  const overlay = document.getElementById("cameraOverlay");
  const overlayMsg = document.getElementById("overlayMessage");
  const retryBtn = document.getElementById("retryBtn");
  const shutterBtn = document.getElementById("shutterBtn");
  const statusDot = document.getElementById("statusDot");
  const shotsCounter = document.getElementById("shotsCounter");
  const galleryGrid = document.getElementById("galleryGrid");
  const emptyMsg = document.getElementById("emptyMsg");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const tabBtns = document.querySelectorAll(".tab-btn");

  let currentFilter = "original";
  let shotCount = 0;
  let stream = null;

  // ---------- Frame overlay (Max Verstappen frame PNG, must have transparent bg) ----------
  const frameImg = new Image();
  frameImg.src = document.getElementById("frameOverlay").src;
  let frameReady = false;
  frameImg.onload = () => { frameReady = true; };
  frameImg.onerror = () => { console.warn("Frame overlay image not found — check static/booth/img/frame-max.png"); };

  // ---------- Filters (CSS applied live to <video> + baked into canvas on capture) ----------
  const FILTER_CSS = {
    original: "none",
    rbr: "contrast(1.15) saturate(1.4) hue-rotate(-6deg)",
    mono: "grayscale(1) contrast(1.1)",
    speed: "contrast(1.2) saturate(1.3) blur(0.4px)",
  };

  function applyFilterPreview(name) {
    video.style.filter = FILTER_CSS[name] || "none";
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      applyFilterPreview(currentFilter);
    });
  });

  // ---------- Tabs ----------
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
      document.getElementById("panel-" + btn.dataset.tab).classList.remove("hidden");
    });
  });

  // ---------- Camera permission ----------
  async function startCamera() {
    overlay.classList.remove("hidden");
    overlayMsg.textContent = "Requesting camera access...";
    retryBtn.classList.add("hidden");

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      video.srcObject = stream;
      overlay.classList.add("hidden");
      shutterBtn.classList.remove("hidden");
      statusDot.textContent = "LIVE";
      statusDot.classList.add("live");
    } catch (err) {
      overlayMsg.textContent = "Camera access denied — grant permission to start";
      retryBtn.classList.remove("hidden");
      shutterBtn.classList.add("hidden");
      statusDot.textContent = "OFFLINE";
      statusDot.classList.remove("live");
      console.error("getUserMedia error:", err);
    }
  }

  retryBtn.addEventListener("click", startCamera);
  window.addEventListener("load", startCamera);

  // ---------- Capture ----------
  function drawFilterOnCanvas(ctx, w, h) {
    // ctx.filter mirrors the CSS preview so the saved photo matches what was seen
    ctx.filter = FILTER_CSS[currentFilter] || "none";
    ctx.save();
    ctx.scale(-1, 1); // undo the mirrored preview so text/orientation is natural in the saved file
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();
    ctx.filter = "none";

    // Bake the frame overlay on top, unmirrored and unfiltered, same as it appears on screen
    if (frameReady) {
      ctx.drawImage(frameImg, 0, 0, w, h);
    }
  }

  shutterBtn.addEventListener("click", async () => {
    if (!stream) return;

    shutterBtn.classList.add("flash");
    setTimeout(() => shutterBtn.classList.remove("flash"), 250);

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    drawFilterOnCanvas(ctx, w, h);

    const dataUrl = canvas.toDataURL("image/png");
    await uploadPhoto(dataUrl, currentFilter);
  });

  // ---------- Upload to Django backend ----------
  async function uploadPhoto(dataUrl, filterUsed) {
    try {
      const res = await fetch("/api/save-photo/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data: dataUrl, filter_used: filterUsed }),
      });
      const result = await res.json();
      if (result.ok) {
        addPhotoToGallery(result.url, result.filter_used);
        shotCount += 1;
        shotsCounter.textContent = shotCount + " SHOTS";
      } else {
        console.error("Upload failed:", result.error);
      }
    } catch (err) {
      console.error("Network error while uploading photo:", err);
    }
  }

  function addPhotoToGallery(url, filterUsed) {
    if (emptyMsg) emptyMsg.remove();
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.innerHTML = `<img src="${url}" alt="Captured photo"><span class="gallery-tag">${filterUsed}</span>`;
    galleryGrid.prepend(item);
  }
})();
