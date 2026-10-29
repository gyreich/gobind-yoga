/**
 * Gobind Yoga — centralized site content.
 *
 * This is the single source of truth for schedules, venues, credentials,
 * contact options, and testimonials. Every page reads from this object
 * instead of hard-coding copies of the same facts, so a schedule or link
 * change only has to happen once, here.
 *
 * Fields set to `null` or empty arrays are real content gaps, not display
 * bugs — see CONTENT_NEEDED.md. Pages check for these and hide the related
 * UI gracefully rather than showing a placeholder to visitors.
 */
const SITE_CONTENT = {
  business: {
    name: "Gobind Yoga",
    tagline: "Ashtanga with Swaran",
    instructorName: "Swaran Kaur Khalsa",
    areaServed: "Santa Fe, New Mexico",
    servingLine: "Serving Santa Fe, New Mexico",
  },

  hero: {
    heading: "Ashtanga Yoga with Swaran Khalsa",
    positioning:
      "Develop strength, steadiness, and self-awareness through a traditional, personally guided Ashtanga practice in Santa Fe, NM.",
  },

  bio: {
    paragraphs: [
      "Swaran Kaur Khalsa has practiced yoga for more than 30 years and has taught since 2006.",
      "She is authorized in Level 1 and Level 2 Ashtanga Yoga by Manju Jois. She is grateful for extensive Ashtanga training with outstanding teachers including Manju Jois, Annie Pace, Tim Miller, and Mary Jo Mulligan.",
      "Her current practice spans the Primary through Advanced Series.",
    ],
  },

  // "Authorization & Training" — list only what has been explicitly confirmed.
  // Do not add dates, certifying bodies, or credential numbers not supplied.
  credentials: [
    {
      title: "Level 1 and Level 2 Authorization",
      teacher: "Manju Jois",
    },
    {
      title: "Primary, Intermediate, and Third Series Teacher Training",
      teacher: "Tim Miller",
    },
    {
      title: "Intermediate Series and Teacher Training",
      teacher: "David Garrigues",
    },
    {
      title: "Pranayama and Meditation Training",
      teacher: null,
    },
  ],

  ashtanga: {
    intro:
      "Ashtanga is a traditional, breath-linked practice built from a progressive series of postures. The Mysore method — named for the city in India where this style of teaching developed — is the traditional way Ashtanga is learned: each student practices their own evolving sequence in a shared room, with individual guidance rather than a single pace set for everyone.",
    mysoreDescription: [
      "Mysore Ashtanga is open to every level of experience. Students practice at their own pace within a shared class while receiving individual instruction according to their needs and ability. Movement is mindful, with an emphasis on breath awareness.",
      "The set sequence does not need to be memorized before attending. Postures are taught progressively, with new postures introduced as each student is ready. Modifications are offered to accommodate physical needs and challenges. All ages and beginners are welcome.",
    ],
  },

  // Public classes and events. Structured as a list so new venues, workshops,
  // or seasonal schedule changes can be added without touching page markup.
  publicClasses: [
    {
      id: "mysore-luminecta",
      name: "Mysore Ashtanga Classes",
      venueName: "Luminecta Studio",
      venueCity: "Santa Fe, NM",
      schedule: [
        { day: "Tuesday", time: "9:15–10:45 a.m." },
        { day: "Thursday", time: "9:15–10:45 a.m." },
      ],
      venueUrl: "https://www.innersoundyoga.org/",
      venueLinkLabel: "Visit Luminecta Studio",
      registrationUrl: "https://www.innersoundyoga.org/pages/upcoming",
      registrationLabel: "View Current Schedule and Register",
      registrationNote:
        "Registration and payment for these classes are handled by the hosting venue.",
    },
  ],

  onlineClasses: {
    heading: "Zoom Mysore Ashtanga Classes",
    schedule: [
      { day: "Monday", time: "9:15–10:30 a.m." },
      { day: "Wednesday", time: "9:15–10:30 a.m." },
      { day: "Friday", time: "9:15–10:30 a.m." },
    ],
    // Confirmed: Santa Fe, NM observes Mountain Time (MST in winter, MDT
    // during daylight saving). Displayed as "Mountain Time" rather than a
    // fixed MST/MDT label so it stays accurate year-round.
    timezoneLabel: "Mountain Time (Santa Fe, NM)",
    registrationProcess: null, // CONTENT NEEDED — see CONTENT_NEEDED.md
  },

  privateInstruction: {
    description:
      "Private instruction offers individually guided Ashtanga practice — a good fit for beginners, established practitioners returning to or deepening a practice, and students who need modifications or help building consistency.",
    showPricing: false, // CONTENT NEEDED — see CONTENT_NEEDED.md
    serviceArea: null, // CONTENT NEEDED — see CONTENT_NEEDED.md
  },

  contact: {
    // Forwards to gobindyoga108@gmail.com through Cloudflare Email Routing.
    email: "hello@gobindyoga.com",
    phone: null,
    // The contact form posts to Web3Forms, which emails each message to
    // gobindyoga108@gmail.com. The access key is public by design: it only
    // names the inbox, and the form is limited to https://gobindyoga.com.
    formConnected: true,
    web3formsAccessKey: "f444f853-0042-4e02-9c75-572d5e4b1585",
    inquiryTypes: [
      { value: "private-lessons", label: "Private lessons" },
      { value: "online-instruction", label: "Online instruction" },
      { value: "workshops", label: "Workshops" },
      { value: "host-inquiry", label: "Hosting Swaran (studio, club, or health facility)" },
      { value: "general", label: "General question" },
    ],
  },

  // Real testimonials only. Leave empty until approved copy + attribution
  // preference is supplied. No testimonials section is rendered on the page
  // while `enabled` is false — see CONTENT_NEEDED.md for how to add one.
  testimonials: {
    enabled: false,
    items: [
      // Example shape once content is approved:
      // { quote: "...", attribution: "First name + last initial, first name only, or 'Anonymous student'" }
    ],
  },

  // Real, verified accounts only.
  social: [
    // { label: "Instagram", url: "https://instagram.com/..." }
  ],

  // Gallery-only photos. Images already used elsewhere on the page (hero,
  // About, Training, Ashtanga sections) are deliberately left out so the
  // gallery never repeats them. `width`/`height` are the pixel size of the
  // processed image; the gallery uses them to show every photo uncropped.
  gallery: [
    // Two rows; rowEnd: true closes a row. Row one runs tall, wide, medium,
    // tall with burgundy at both ends and in the middle. Row two puts the
    // standing twist in the center, with the seated photo (mirrored so she
    // faces in) on the left and the arm balance (legs reaching in) on the
    // right; their red mat and red backpack frame the middle.
    {
      base: "hero-standing-bind",
      alt: "Swaran balances on one leg in a standing pose, hands pressed together at her chest, practicing in a sunlit studio.",
      width: 872,
      height: 2304,
    },
    {
      base: "seated-forward-fold-home",
      alt: "Swaran practices a deep seated forward fold on a mat at home.",
      width: 1536,
      height: 2048,
    },
    {
      base: "upward-dog-class",
      alt: "Swaran lifts into upward-facing dog with her eyes closed during a group class.",
      width: 1031,
      height: 1525,
    },
    {
      base: "standing-balance-class",
      alt: "Swaran holds an extended standing leg pose during a group class in a bright studio.",
      width: 134,
      height: 404,
      rowEnd: true,
    },
    {
      base: "seated-pranayama-class",
      alt: "Swaran sits cross-legged on a purple mat, eyes lowered, during a breathing practice in a group class.",
      width: 1018,
      height: 1358,
    },
    {
      base: "standing-twist-home",
      alt: "Swaran in a standing twist with one arm and one leg raised, on a purple mat in her home studio.",
      width: 1456,
      height: 2180,
    },
    {
      base: "arm-balance-class",
      alt: "Swaran balances on her hands with both legs extended, during a class in a sunny studio.",
      width: 568,
      height: 970,
    },
  ],
};
