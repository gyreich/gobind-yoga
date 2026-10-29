/**
 * Contact section behavior:
 *  - Populates the inquiry-type <select> from SITE_CONTENT.
 *  - Any element with `data-inquiry="value"` (the panel buttons in
 *    #practice) sets that inquiry type when clicked, then lets the browser
 *    follow its normal #contact anchor link — no page navigation needed
 *    since everything lives on one page.
 *  - A `?inquiry=` query parameter is still honored on load, for any
 *    external link that points straight at #contact with a preselected type.
 *  - Submitting posts the message to Web3Forms, which emails it to
 *    Swaran's inbox. Replying to that email goes straight to the visitor.
 *    If sending fails, the status points visitors to the email address.
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

    const button = form.querySelector('button[type="submit"]');

    function showStatus(message) {
      status.textContent = message;
      status.classList.add("is-visible");
      status.setAttribute("role", "status");
      status.focus();
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const contact = SITE_CONTENT.contact;
      if (!contact.formConnected) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const inquiry = contact.inquiryTypes.find((t) => t.value === data.get("inquiryType"));
      const payload = {
        access_key: contact.web3formsAccessKey,
        subject: `New inquiry from gobindyoga.com: ${inquiry ? inquiry.label : "General question"}`,
        from_name: "Gobind Yoga website",
        name: data.get("name"),
        email: data.get("email"),
        replyto: data.get("email"),
        "What is this about?": inquiry ? inquiry.label : "",
        message: data.get("message"),
        botcheck: data.get("botcheck") ? true : "",
      };

      button.disabled = true;
      showStatus("Sending…");
      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        form.reset();
        showStatus("Thank you. Your message has been sent, and Swaran will be in touch soon.");
      } catch (err) {
        showStatus(`Sorry, your message couldn't be sent. Please try again, or email ${contact.email}.`);
      } finally {
        button.disabled = false;
      }
    });
  });
})();
