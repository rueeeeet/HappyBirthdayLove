const TOTAL_REASONS = 101;
const HEART_SYMBOLS = ["❤", "♥", "♡"];

const state = {
  currentIndex: 1,
  lastOpenedIndex: 1,
  originButton: null,
  touchStartX: 0,
  touchStartY: 0,
};

const gallery = document.getElementById("gallery");
const reasonCount = document.getElementById("reason-count");
const randomButton = document.getElementById("open-random");
const jumpLatestButton = document.getElementById("jump-latest");
const topButton = document.getElementById("scroll-top");
const floatingTopButton = document.getElementById("floating-top");
const enterSiteButton = document.getElementById("enter-site");
const heroParticles = document.getElementById("hero-particles");

const viewer = document.getElementById("viewer");
const viewerStage = document.getElementById("viewer-stage");
const viewerImage = document.getElementById("viewer-image");
const viewerCaption = document.getElementById("viewer-caption");
const nextReason = document.getElementById("next-reason");
const prevReason = document.getElementById("prev-reason");
const nextBottom = document.getElementById("next-bottom");
const prevBottom = document.getElementById("prev-bottom");
const template = document.getElementById("reason-card-template");

const makeSrc = (index) => `images/${index}.png`;

function buildCard(index) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".reason-card");
  const badge = fragment.querySelector(".badge");
  const img = fragment.querySelector(".reason-image");
  const fallback = fragment.querySelector(".fallback");

  const label = `Reason ${index}`;
  badge.textContent = label;
  card.dataset.index = String(index);
  card.setAttribute("aria-label", `Open ${label}`);

  img.src = makeSrc(index);
  img.alt = `${label} image`;
  img.fetchPriority = index <= 6 ? "high" : "auto";

  img.addEventListener("load", () => {
    card.classList.add("loaded");
    fallback.hidden = true;
  });

  img.addEventListener("error", () => {
    fallback.hidden = false;
    card.classList.add("is-missing");
    img.alt = `${label} unavailable`;
  });

  card.addEventListener("click", () => {
    state.originButton = card;
    openViewer(index);
  });

  return fragment;
}

function renderGallery() {
  const list = document.createDocumentFragment();

  for (let index = 1; index <= TOTAL_REASONS; index += 1) {
    list.appendChild(buildCard(index));
  }

  gallery.appendChild(list);
  reasonCount.textContent = `${TOTAL_REASONS} reasons`;
}

function openViewer(index) {
  state.currentIndex = normalize(index);
  state.lastOpenedIndex = state.currentIndex;
  setViewerContent(state.currentIndex);

  if (!viewer.open) {
    viewer.showModal();
    document.body.style.overflow = "hidden";
  }
}

function closeViewer() {
  if (!viewer.open) {
    return;
  }

  viewer.close();
  document.body.style.overflow = "";

  if (state.originButton) {
    state.originButton.focus();
  }
}

function normalize(index) {
  if (index < 1) {
    return TOTAL_REASONS;
  }

  if (index > TOTAL_REASONS) {
    return 1;
  }

  return index;
}

function setViewerContent(index) {
  const current = normalize(index);
  const src = makeSrc(current);

  viewerImage.src = src;
  viewerImage.alt = `Reason ${current} image`;
  viewerCaption.textContent = `Reason ${current} of ${TOTAL_REASONS}`;
}

function shiftViewer(step) {
  state.currentIndex = normalize(state.currentIndex + step);
  state.lastOpenedIndex = state.currentIndex;
  setViewerContent(state.currentIndex);
}

function jumpToLatest() {
  const target = Number(state.lastOpenedIndex || 1);
  const button = gallery.querySelector(`[data-index="${target}"]`);

  if (button) {
    button.scrollIntoView({ behavior: "smooth", block: "center" });
    button.focus({ preventScroll: true });
  }
}

function randomReason() {
  const randomIndex = Math.floor(Math.random() * TOTAL_REASONS) + 1;
  const button = gallery.querySelector(`[data-index="${randomIndex}"]`);

  state.originButton = button;
  openViewer(randomIndex);
}

function handleViewerKeyboard(event) {
  if (!viewer.open) {
    return;
  }

  if (event.key === "ArrowRight") {
    shiftViewer(1);
  } else if (event.key === "ArrowLeft") {
    shiftViewer(-1);
  } else if (event.key === "Escape") {
    closeViewer();
  }
}

function bindSwipe() {
  viewerStage.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      state.touchStartX = touch.screenX;
      state.touchStartY = touch.screenY;
    },
    { passive: true }
  );

  viewerStage.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.screenX - state.touchStartX;
      const deltaY = touch.screenY - state.touchStartY;

      if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 70) {
        if (deltaX < 0) {
          shiftViewer(1);
        } else {
          shiftViewer(-1);
        }
      }
    },
    { passive: true }
  );
}

function updateTopButton() {
  const visible = window.scrollY > 420;
  floatingTopButton.style.display = visible ? "grid" : "none";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function unlockSite() {
  document.body.classList.remove("intro-active");
  const firstAction = document.getElementById("open-random");

  if (firstAction) {
    firstAction.focus({ preventScroll: true });
  }
}

function renderHeroParticles() {
  if (!heroParticles) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 16; i += 1) {
    const particle = document.createElement("span");
    particle.className = "hero-particle";
    particle.textContent = HEART_SYMBOLS[i % HEART_SYMBOLS.length];
    particle.style.left = `${Math.floor(Math.random() * 94) + 3}%`;
    particle.style.setProperty("--size", `${(Math.random() * 0.65 + 0.55).toFixed(2)}rem`);
    particle.style.setProperty("--duration", `${(Math.random() * 4 + 4.5).toFixed(2)}s`);
    particle.style.setProperty("--delay", `${(Math.random() * 4.4).toFixed(2)}s`);
    fragment.appendChild(particle);
  }

  heroParticles.appendChild(fragment);
}

function init() {
  renderHeroParticles();
  renderGallery();

  nextReason.addEventListener("click", () => shiftViewer(1));
  prevReason.addEventListener("click", () => shiftViewer(-1));
  nextBottom.addEventListener("click", () => shiftViewer(1));
  prevBottom.addEventListener("click", () => shiftViewer(-1));

  randomButton.addEventListener("click", randomReason);
  jumpLatestButton.addEventListener("click", jumpToLatest);
  topButton.addEventListener("click", scrollToTop);
  floatingTopButton.addEventListener("click", scrollToTop);

  if (enterSiteButton) {
    enterSiteButton.addEventListener("click", unlockSite);
  }

  viewer.addEventListener("close", closeViewer);
  viewerImage.addEventListener("error", () => {
    viewerCaption.textContent = `Reason ${state.currentIndex} is unavailable`;
  });

  window.addEventListener("keydown", handleViewerKeyboard);
  window.addEventListener("scroll", updateTopButton, { passive: true });

  bindSwipe();
  updateTopButton();
}

init();
