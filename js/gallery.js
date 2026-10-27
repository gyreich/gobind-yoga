/**
 * Accessible lightbox for the gallery page. Works entirely from
 * SITE_CONTENT.gallery so the image list only needs to change in content.js.
 */
(function () {
  function initGallery() {
    const grid = document.getElementById("gallery-grid");
    const lightbox = document.getElementById("lightbox");
    if (!grid || !lightbox) return;

    const images = SITE_CONTENT.gallery;
    grid.innerHTML = images.map(renderGalleryItem).join("");

    const figureImg = lightbox.querySelector(".lightbox-figure img");
    const figureSource = lightbox.querySelector(".lightbox-figure source");
    const caption = lightbox.querySelector(".lightbox-figcaption");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const prevBtn = lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox.querySelector(".lightbox-next");

    let currentIndex = 0;
    let lastFocused = null;

    function show(index) {
      currentIndex = (index + images.length) % images.length;
      const image = images[currentIndex];
      figureSource.srcset = `images/${image.base}.webp`;
      figureImg.src = `images/${image.base}.jpg`;
      figureImg.alt = image.alt;
      caption.textContent = image.alt;
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      closeBtn.focus();
      document.addEventListener("keydown", onKeydown);
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(currentIndex + 1);
      if (e.key === "ArrowLeft") show(currentIndex - 1);
      if (e.key === "Tab") {
        const focusable = [closeBtn, prevBtn, nextBtn];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    grid.addEventListener("click", (e) => {
      const trigger = e.target.closest(".gallery-trigger");
      if (!trigger) return;
      open(Number(trigger.dataset.galleryIndex));
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => show(currentIndex - 1));
    nextBtn.addEventListener("click", () => show(currentIndex + 1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
  }

  document.addEventListener("DOMContentLoaded", initGallery);
})();
