/**
 * Shared header + footer for the one-page site. Navigation is anchor-based
 * (in-page section links) rather than separate pages, with a scroll-spy
 * that highlights whichever section is currently in view.
 */
(function () {
  const NAV_ITEMS = [
    { key: "home", href: "#home", label: "Home" },
    { key: "about", href: "#about", label: "About Swaran" },
    { key: "ashtanga", href: "#ashtanga", label: "What Is Ashtanga?" },
    { key: "practice", href: "#practice", label: "Practice with Swaran", primary: true },
    { key: "gallery", href: "#gallery", label: "Gallery" },
    { key: "contact", href: "#contact", label: "Contact" },
  ];

  function renderNavLinks() {
    return NAV_ITEMS.map((item) => {
      const classes = ["nav-link"];
      if (item.primary) classes.push("nav-link--cta");
      return `<li><a class="${classes.join(" ")}" href="${item.href}" data-nav-key="${item.key}">${item.label}</a></li>`;
    }).join("");
  }

  function renderHeader() {
    return `
      <div class="container header-inner">
        <a href="#home" class="brand" aria-label="Gobind Yoga — home">
          <img src="images/gobind-yoga-logo.png" alt="Gobind Yoga" class="brand-logo" width="900" height="264" />
        </a>
        <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">
          <span class="nav-toggle-icon" aria-hidden="true"></span>
        </button>
        <nav id="primary-nav" class="primary-nav" aria-label="Primary">
          <ul>${renderNavLinks()}</ul>
        </nav>
      </div>
    `;
  }

  function renderFooter() {
    const year = new Date().getFullYear();
    const social = (window.SITE_CONTENT && SITE_CONTENT.social) || [];
    const socialLinks = social.length
      ? `<ul class="footer-social">${social
          .map(
            (s) =>
              `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`
          )
          .join("")}</ul>`
      : "";

    return `
      <div class="container footer-inner">
        <div class="footer-brand">
          <img src="images/gobind-yoga-logo.png" alt="Gobind Yoga" class="footer-logo" width="900" height="264" />
          <p class="footer-tagline">${SITE_CONTENT.business.tagline}</p>
          <p class="footer-serving">${SITE_CONTENT.business.servingLine}</p>
        </div>
        <nav class="footer-nav" aria-label="Footer">
          <ul>${NAV_ITEMS.map((i) => `<li><a href="${i.href}">${i.label}</a></li>`).join("")}</ul>
        </nav>
        ${socialLinks}
      </div>
      <div class="container">
        <div class="ornament-rule"><span class="line"></span><span class="diamond"></span><span class="line"></span></div>
        <p class="footer-copyright">&copy; ${year} Gobind Yoga. All rights reserved.</p>
      </div>
    `;
  }

  function wireMobileNav(header) {
    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector("#primary-nav");
    if (!toggle || !nav) return;

    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };
    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      nav.classList.add("is-open");
    };

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    });

    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    const mediaQuery = window.matchMedia("(min-width: 901px)");
    mediaQuery.addEventListener("change", (e) => {
      if (e.matches) close();
    });
  }

  function wireScrollSpy() {
    const links = document.querySelectorAll(".nav-link[data-nav-key]");
    if (!links.length) return;
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.key)).filter(Boolean);
    if (!sections.length) return;

    const setActive = (key) => {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.navKey === key);
        if (link.dataset.navKey === key) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((section) => observer.observe(section));
  }

  window.initLayout = function initLayout() {
    const headerEl = document.getElementById("site-header");
    const footerEl = document.getElementById("site-footer");
    if (headerEl) {
      headerEl.innerHTML = renderHeader();
      wireMobileNav(headerEl);
    }
    if (footerEl) {
      footerEl.innerHTML = renderFooter();
    }
    wireScrollSpy();
  };
})();
