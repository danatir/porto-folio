// ============================================================
//  CONTENT — pulled from Dan Atir's Portfolio 2025
// ============================================================

export const ABOUT = [
  {
    title: "INTRO",
    tag: "WHO",
    body: "Visual Communication Major with extensive knowledge in Adobe programs, as well as 3D design, 3D printing and professional illustration. Skilled in branding, marketing and print, with a strong focus on crafting distinctive visual identities and meaningful design experiences.",
    scope: ["BRANDING", "3D DESIGN", "ILLUSTRATION", "PRINT", "UX / UI"]
  },
  {
    title: "SKILLS",
    tag: "TOOLBOX",
    body: "A fast learner and autodidact with excellent interpersonal and collaborative skills. Fluent across the Adobe suite — Photoshop, Illustrator, InDesign, After Effects — plus 3D modelling, 3D printing and motion.",
    scope: ["PHOTOSHOP", "ILLUSTRATOR", "INDESIGN", "AFTER EFFECTS", "BLENDER", "3D PRINT"]
  },
  {
    title: "EDUCATION",
    tag: "TIMELINE",
    body: "2016–19 — Major in film & cinematography, Ankori. 2021–22 — Fundamentals of Sketching & Illustration. 2022–23 — Diploma in Graphic Design, SHENKAR. 2023–25 — Degree in Visual Communication, SHENKAR College.",
    scope: ["ANKORI", "SHENKAR", "FILM", "GRAPHIC DESIGN", "VIS-COMM"]
  },
  {
    title: "CONTACT",
    tag: "REACH OUT",
    body: "DanAtir64@gmail.com · +972-52-3295986 · Based in Israel (GMT+3). Open to branding, identity, 3D and editorial collaborations.",
    scope: ["EMAIL", "PHONE", "ISRAEL · GMT+3"]
  }
];

export const PROJECTS = [
  {
    id: "viaro", title: "VIARO", tag: "DIVING TECHNOLOGY & CONNECTIVITY",
    body: "A modern diving-technology brand built to make every dive smarter, safer and more personal. The identity pairs fluid, tool-inspired logo motion with a clean visual language and deep-ocean blues lit by vibrant accents.",
    scope: ["LOGO", "BRANDING KIT", "GRAPHIC DESIGN", "3D DESIGN", "PHOTOGRAPHY", "UX / UI"],
    accent: "#1f7fd0",
    images: ["assets/img/viaro_1.jpg", "assets/img/viaro_2.jpg", "assets/img/viaro_3.jpg"],
    demo: true
  },
  {
    id: "oto", title: "OTO SOUND MOUSEUM", tag: "MUSEUM FOR MUSIC & SOUND ART",
    body: "A contemporary space for music and sound art. “Oto” (ear) fuses with “Mouseum” from the Greek Mouseion. A logo shaped from cassette tape and sound waves, neon tones balanced by deep blues — energetic yet calming.",
    scope: ["LOGO", "BRANDING KIT", "GRAPHIC DESIGN"],
    accent: "#3a6bff",
    images: ["assets/img/oto_1.jpg", "assets/img/oto_2.jpg", "assets/img/oto_3.jpg"]
  },
  {
    id: "edenic", title: "EDENIC", tag: "HOUSE-PLANT SHOP · GRAFTING",
    body: "An online shop for house plants and grafting. Drawn from the Garden of Eden, the logo unites yin-yang balance with a leaf and sprout — harmony and growth. A Peace-Lily palette of soft greens and off-whites.",
    scope: ["LOGO", "BRANDING KIT", "GRAPHIC DESIGN", "PHOTOGRAPHY"],
    accent: "#6f9d5e",
    images: ["assets/img/edenic_1.jpg", "assets/img/edenic_2.jpg", "assets/img/edenic_3.jpg"]
  },
  {
    id: "levenshtein", title: "LEVENSHTEIN", tag: "MEMORIAL PROJECT · “DRINK LIKE A VIKING”",
    body: "A memorial beer for Yonadav Levenshtein, who fell on October 7th, 2023. Viking spirit, strength and camaraderie through bold type, Norse pattern and a warrior emblem. Purple and black honour his Givati beret.",
    scope: ["LOGO", "GRAPHIC DESIGN"],
    accent: "#7a4bb0",
    images: ["assets/img/levenshtein_1.jpg"]
  },
  {
    id: "lute", title: "LUTÉ", tag: "COLLECTIBLES & STREET CAMPAIGN",
    body: "LUTÉ Mystery Bunny fuses pop culture, streetwear and kawaii into one bold universe. The mascot towers over surreal cityscapes amid loud doodles and comic chaos — Harajuku meets graffiti meets hype culture.",
    scope: ["LOGO", "3D DESIGN", "GRAPHIC DESIGN"],
    accent: "#ff3da6",
    images: ["assets/img/lute_1.jpg"]
  },
  {
    id: "infected", title: "INFECTED MUSHROOM", tag: "REBORN · VINYL & ARTBOOK",
    body: "A vinyl and artbook project for the Israeli psytrance duo. Their sound becomes a visual language of bold forms and playful distortion — experimental type and layered texture between chaos and control, raw and immersive.",
    scope: ["GRAPHIC DESIGN", "EDITORIAL", "TYPOGRAPHY"],
    accent: "#9b5cff",
    images: ["assets/img/infected_1.jpg", "assets/img/infected_2.jpg", "assets/img/infected_3.jpg", "assets/img/infected_4.jpg", "assets/img/infected_5.jpg"]
  },
  {
    id: "vader", title: "THE VADER PROJECT", tag: "COLLECTIBLE ART VOLUME · BOOK COVER",
    body: "A cover for a collectible volume of custom Darth Vader helmets reinterpreted by artists worldwide. Swirling marbled textures stand for creative freedom; clean white framing presents each mask as a work of art.",
    scope: ["GRAPHIC DESIGN", "EDITORIAL"],
    accent: "#aab0c4",
    images: ["assets/img/vader_1.jpg", "assets/img/vader_2.jpg"]
  }
];

export const POSTERS = Array.from({length: 11}, (_, i) =>
  `assets/img/poster_${String(i + 1).padStart(2, "0")}.jpg`
);
