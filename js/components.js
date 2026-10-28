/**
 * Reusable render functions shared across the page. Every function takes
 * data from SITE_CONTENT (js/content.js) and returns an HTML string; the
 * page injects the result into a placeholder element. Keeping markup
 * generation here means a schedule, credential, or gallery item only has
 * one template to update.
 */

function renderCredentialTimelineItem(credential) {
  const teacherLine = credential.teacher ? `<p class="credential-teacher">${credential.teacher}</p>` : "";
  return `
    <li class="credential-timeline-item">
      <h3 class="credential-title">${credential.title}</h3>
      ${teacherLine}
    </li>
  `;
}

function renderScheduleRow(entry) {
  return `<li class="schedule-row"><span class="marker-day">${entry.day}</span><span>${entry.time}</span></li>`;
}

/**
 * The three "ways to practice" panels — deliberately three different
 * accent colors (terracotta / apricot-with-plum-framing / burgundy) rather
 * than uniform cards, per the site's color-rhythm system.
 */
function renderPracticePanels() {
  const publicClass = SITE_CONTENT.publicClasses[0];
  const online = SITE_CONTENT.onlineClasses;
  const priv = SITE_CONTENT.privateInstruction;

  const santaFePanel = `
    <article class="practice-panel practice-panel--terracotta">
      <span class="practice-panel-label">Santa Fe Classes</span>
      <h3>${publicClass.name}</h3>
      <p style="font-weight:600;"><span class="nowrap">${publicClass.venueName} &middot;</span> <span class="nowrap">${publicClass.venueCity}</span></p>
      <ul class="practice-panel-schedule">${publicClass.schedule.map(renderScheduleRow).join("")}</ul>
      <p class="practice-panel-note">${publicClass.registrationNote}</p>
      <div class="practice-panel-actions">
        <a class="btn btn-primary" href="${publicClass.registrationUrl}" target="_blank" rel="noopener noreferrer">
          ${publicClass.registrationLabel}<span class="visually-hidden"> (opens ${publicClass.venueName} in a new tab)</span>
        </a>
        <a class="text-link" href="${publicClass.venueUrl}" target="_blank" rel="noopener noreferrer">
          ${publicClass.venueLinkLabel}<span class="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
    </article>
  `;

  const privatePanel = `
    <article class="practice-panel practice-panel--apricot">
      <span class="practice-panel-label">Private Instruction</span>
      <h3>One-on-One, Personally Guided</h3>
      <p>${priv.description}</p>
      <div class="practice-panel-actions">
        <a class="btn btn-primary" href="#contact" data-inquiry="private-lessons">Inquire About Private Instruction</a>
      </div>
    </article>
  `;

  const onlinePanel = `
    <article class="practice-panel practice-panel--burgundy">
      <span class="practice-panel-label">Online Practice</span>
      <h3>${online.heading}</h3>
      <ul class="practice-panel-schedule">${online.schedule.map(renderScheduleRow).join("")}</ul>
      <p class="practice-panel-note">Class times shown in ${online.timezoneLabel}.</p>
      <div class="practice-panel-actions">
        <a class="btn btn-primary" href="#contact" data-inquiry="online-instruction">Inquire About Zoom Classes</a>
      </div>
    </article>
  `;

  return santaFePanel + privatePanel + onlinePanel;
}

function renderTestimonialCard(testimonial) {
  return `
    <blockquote class="testimonial-card">
      <p class="testimonial-quote">&ldquo;${testimonial.quote}&rdquo;</p>
      <footer class="testimonial-attribution">&mdash; ${testimonial.attribution}</footer>
    </blockquote>
  `;
}

function renderGalleryItem(image, index) {
  const eager = index < 2; // keep the first couple of images out of lazy-load for a stable above-the-fold layout
  const loading = eager ? "eager" : "lazy";
  // Tiles size themselves to each photo's own aspect ratio (see .gallery-grid
  // in style.css), so no part of the pose is cropped away.
  const ratio = (image.width / image.height).toFixed(4);
  return `
    <li class="gallery-item" style="--ratio: ${ratio};">
      <button type="button" class="gallery-trigger" data-gallery-index="${index}" aria-haspopup="dialog">
        <picture>
          <source srcset="images/${image.base}-thumb.webp" type="image/webp" />
          <img
            src="images/${image.base}-thumb.jpg"
            alt="${image.alt}"
            width="${image.width}"
            height="${image.height}"
            loading="${loading}"
            decoding="async"
          />
        </picture>
      </button>
    </li>
  ${image.rowEnd ? '\n    <li class="gallery-break" aria-hidden="true"></li>' : ""}`;
}

function renderInquiryOptions(selectedValue) {
  return SITE_CONTENT.contact.inquiryTypes
    .map((opt) => {
      const selected = opt.value === selectedValue ? " selected" : "";
      return `<option value="${opt.value}"${selected}>${opt.label}</option>`;
    })
    .join("");
}
