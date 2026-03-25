const TOTAL_REASONS = 101;
const NORMAL_REASON_TOTAL = 100;
const HEART_SYMBOLS = ["❤", "♥", "♡"];

const state = {
  currentIndex: 1,
  lastOpenedIndex: 1,
  originButton: null,
  touchStartX: 0,
  touchStartY: 0,
  openedReasons: new Set(),
  transitionTimer: null,
  scrollNotificationTimer: null,
  scrollNotificationRemoveTimer: null,
  musicStarted: false,
};

const gallery = document.getElementById("gallery");
const finalReasonGallery = document.getElementById("final-reason-gallery");
const reasonCount = document.getElementById("reason-count");
const enterSiteButton = document.getElementById("enter-site");
const heroParticles = document.getElementById("hero-particles");
const bgMusic = document.getElementById("bg-music");
const loveMessageInput = document.getElementById("love-message");
const sendWhatsappButton = document.getElementById("send-whatsapp");
const WHATSAPP_NUMBER = "918860925427";

const viewer = document.getElementById("viewer");
const viewerStage = document.getElementById("viewer-stage");
const viewerImage = document.getElementById("viewer-image");
const viewerCaption = document.getElementById("viewer-caption");
const nextBottom = document.getElementById("next-bottom");
const prevBottom = document.getElementById("prev-bottom");
const template = document.getElementById("reason-card-template");

const INTRO_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

const makeSrc = (index) => `images/${index}.png`;

function revealReason(index) {
  state.openedReasons.add(index);
  const card = document.querySelector(`.reason-card[data-index="${index}"]`);

  if (card) {
    card.classList.add("opened");
  }
}

function buildCard(index, options = {}) {
  const { isFinal = false } = options;
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".reason-card");
  const item = fragment.querySelector(".reason-item");
  const badge = fragment.querySelector(".badge");
  const img = fragment.querySelector(".reason-image");
  const fallback = fragment.querySelector(".fallback");

  const label = `Love Note #${index}`;
  badge.textContent = label;
  card.dataset.index = String(index);
  card.setAttribute("aria-label", `Open ${label}`);

  if (isFinal) {
    card.classList.add("final-reason-card");
    item.classList.add("final-reason-item");
  }

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
    revealReason(index);
    state.originButton = card;
    openViewer(index);
  });

  return fragment;
}

function renderGallery() {
  const list = document.createDocumentFragment();

  for (let index = 1; index <= NORMAL_REASON_TOTAL; index += 1) {
    list.appendChild(buildCard(index));
  }

  gallery.appendChild(list);
  reasonCount.textContent = `${NORMAL_REASON_TOTAL} ways I love you + 1 final truth`;
}

function renderFinalReason() {
  if (!finalReasonGallery) {
    return;
  }

  finalReasonGallery.appendChild(buildCard(TOTAL_REASONS, { isFinal: true }));
}

function openViewer(index) {
  state.currentIndex = normalizeForOpen(index);
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

  if (state.transitionTimer) {
    clearTimeout(state.transitionTimer);
    state.transitionTimer = null;
  }

  viewer.classList.remove("is-transitioning");
  clearScrollToFinalNotification();

  viewer.close();
  document.body.style.overflow = "";

  if (state.originButton) {
    state.originButton.focus();
  }
}

function clearScrollToFinalNotification() {
  if (state.scrollNotificationTimer) {
    clearTimeout(state.scrollNotificationTimer);
    state.scrollNotificationTimer = null;
  }

  if (state.scrollNotificationRemoveTimer) {
    clearTimeout(state.scrollNotificationRemoveTimer);
    state.scrollNotificationRemoveTimer = null;
  }

  const existingNotification = document.querySelector(".scroll-to-final-notification");

  if (existingNotification) {
    existingNotification.remove();
  }
}

function handleBackdropClick(event) {
  if (event.target === viewer) {
    closeViewer();
  }
}

function normalize(index) {
  // Clamp between 1 and NORMAL_REASON_TOTAL (no wrapping)
  if (index < 1) {
    return 1;
  }

  if (index > NORMAL_REASON_TOTAL) {
    return NORMAL_REASON_TOTAL;
  }

  return index;
}

function normalizeForOpen(index) {
  if (index === TOTAL_REASONS) {
    return TOTAL_REASONS;
  }

  return normalize(index);
}

function setViewerContent(index) {
  const current = normalizeForOpen(index);
  const src = makeSrc(current);

  const applyContent = () => {
    revealReason(current);
    viewerImage.src = src;
    viewerImage.alt = `Way ${current} image`;
    viewerCaption.textContent =
      current === TOTAL_REASONS
        ? `Way ${current} \u2022 The final truth`
        : `Way ${current} of ${TOTAL_REASONS}`;
  };

  const shouldAnimate = viewer.open && Boolean(viewerImage.getAttribute("src"));

  if (!shouldAnimate) {
    applyContent();
    return;
  }

  if (state.transitionTimer) {
    clearTimeout(state.transitionTimer);
  }

  viewer.classList.add("is-transitioning");

  state.transitionTimer = window.setTimeout(() => {
    applyContent();
    viewer.classList.remove("is-transitioning");
    state.transitionTimer = null;
  }, 140);
}

function shiftViewer(step) {
  const nextIndex = state.currentIndex + step;
  
  // Check if trying to go forward (left swipe) from 100th reason
  if (state.currentIndex === NORMAL_REASON_TOTAL && step === 1) {
    showScrollToFinalNotification();
    return;
  }
  
  // Check if trying to go backward (right swipe) from 1st
  if (state.currentIndex === 1 && step === -1) {
    return;
  }
  
  state.currentIndex = normalize(nextIndex);
  state.lastOpenedIndex = state.currentIndex;
  setViewerContent(state.currentIndex);
}

function showScrollToFinalNotification() {
  clearScrollToFinalNotification();

  const notification = document.createElement("div");
  notification.className = "scroll-to-final-notification";
  notification.textContent = "👉 Scroll down to see the final truth ✨";

  const host = viewer && viewer.open ? viewer : document.body;
  host.appendChild(notification);

  state.scrollNotificationTimer = window.setTimeout(() => {
    notification.style.animation = "slideDown 0.3s ease-out";
    state.scrollNotificationRemoveTimer = window.setTimeout(() => {
      notification.remove();
      state.scrollNotificationRemoveTimer = null;
    }, 300);
    state.scrollNotificationTimer = null;
  }, 2500);
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

function unlockSite() {
  document.documentElement.classList.remove("intro-active");
  document.body.classList.remove("intro-active");
  playBackgroundMusic();
  const firstAction = document.querySelector(".reason-card");

  if (firstAction) {
    firstAction.focus({ preventScroll: true });
  }

  // Request fullscreen
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log(`Fullscreen request failed: ${err.message}`);
    });
  } else if (document.documentElement.webkitRequestFullscreen) {
    // Safari support
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) {
    // Firefox support
    document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.msRequestFullscreen) {
    // IE11 support
    document.documentElement.msRequestFullscreen();
  }
}

function preventIntroScroll(event) {
  if (!document.body.classList.contains("intro-active")) {
    return;
  }

  event.preventDefault();
}

function handleIntroKeyboardScroll(event) {
  if (!document.body.classList.contains("intro-active")) {
    return;
  }

  if (INTRO_SCROLL_KEYS.has(event.key)) {
    event.preventDefault();
  }
}

function playBackgroundMusic() {
  if (!bgMusic || state.musicStarted) {
    return;
  }

  bgMusic.volume = 0.6;
  const playPromise = bgMusic.play();

  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => {
        state.musicStarted = true;
      })
      .catch(() => {
        // Ignore playback failures and keep UI flow uninterrupted.
      });
  } else {
    state.musicStarted = true;
  }
}

function sendMessageToWhatsapp() {
  if (!loveMessageInput) {
    return;
  }

  const message = loveMessageInput.value;

  if (!message || !message.trim()) {
    window.alert("Please write a message first.");
    loveMessageInput.focus();
    return;
  }

  const text = `A message for you🥺:\nSent by your bhonduuu🥺🥺😭\n\n${message}`;
  const params = new URLSearchParams({ text });
  const url = `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

  // Fallback for environments that block popups; keep flow reliable on mobile.
  if (!openedWindow) {
    window.location.href = url;
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
  // Keep both root elements in sync so intro scroll lock is reliable.
  document.documentElement.classList.add("intro-active");
  document.body.classList.add("intro-active");

  renderHeroParticles();
  renderGallery();
  renderFinalReason();

  nextBottom.addEventListener("click", () => shiftViewer(1));
  prevBottom.addEventListener("click", () => shiftViewer(-1));

  if (enterSiteButton) {
    enterSiteButton.addEventListener("click", unlockSite);
  }

  if (sendWhatsappButton) {
    sendWhatsappButton.addEventListener("click", sendMessageToWhatsapp);
  }

  viewer.addEventListener("close", closeViewer);
  viewer.addEventListener("click", handleBackdropClick);
  viewerImage.addEventListener("error", () => {
    viewerCaption.textContent = `Way ${state.currentIndex} is unavailable`;
  });

  window.addEventListener("wheel", preventIntroScroll, { passive: false });
  window.addEventListener("touchmove", preventIntroScroll, { passive: false });
  window.addEventListener("keydown", handleIntroKeyboardScroll);
  window.addEventListener("keydown", handleViewerKeyboard);

  bindSwipe();
}

init();
