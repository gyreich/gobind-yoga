/**
 * Contact section behavior:
 *  - Populates the inquiry-type <select> from SITE_CONTENT.
 *  - Any element with `data-inquiry="value"` (the panel buttons in
 *    #practice) sets that inquiry type when clicked, then lets the browser
 *    follow its normal #contact anchor link — no page navigation needed
 *    since everything lives on one page.
 *  - A `?inquiry=` query parameter is still honored on load, for any
 *    external link that points straight at #contact with a preselected type.
 *  - LAUNCH REQUIREMENT: SITE_CONTENT.contact.formConnected is false because
 *    no email address or form-handling service has been supplied yet (see
 *    CONTENT_NEEDED.md). The form renders fully but submitting it shows an
 *    honest "not connected yet" status instead of a fake success message.
 */
(function () {
  function setInquiry(value) {
    const select = document.getElementById("inquiry-type");
    if (select && SITE_CONTENT.contact.inquiryTypes.some((t) => t.value === value)) {
      select.value = value;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("inquiry-type");
    if (select) {
      select.innerHTML = renderInquiryOptions(null);
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("inquiry");
      if (requested) setInquiry(requested);
    }

    document.querySelectorAll("[data-inquiry]").forEach((el) => {
      el.addEventListener("click", () => setInquiry(el.dataset.inquiry));
    });

    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!SITE_CONTENT.contact.formConnected) {
        status.textContent =
          "This form isn't connected to an inbox yet, so it can't be submitted online. Please check back soon — Gobind Yoga's contact details will appear on this page once available.";
      } else {
        status.textContent = "Thank you — your message has been sent.";
      }
      status.classList.add("is-visible");
      status.setAttribute("role", "status");
      status.focus();
    });
  });
})();
