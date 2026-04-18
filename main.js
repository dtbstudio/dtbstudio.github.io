// ── Loading screen sequence ───────────────────────────────
(function () {
  const loader     = document.getElementById("loader");
  const fillLayer  = document.querySelector(".loader-fill-layer");

  document.body.style.overflow = "hidden";

  const FILL_DURATION = 1600; // ms — how long the fill rises
  const FILL_DELAY    = 350;  // ms — pause before fill starts

  // Animate fill height 0 → 100% using rAF + ease
  let startTime = null;

  function easeCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateFill(ts) {
    if (!startTime) startTime = ts;
    const elapsed  = ts - startTime;
    const progress = Math.min(1, elapsed / FILL_DURATION);
    fillLayer.style.height = (easeCubic(progress) * 100).toFixed(3) + "%";
    if (progress < 1) {
      requestAnimationFrame(animateFill);
    } else {
      onFillComplete();
    }
  }

  function onFillComplete() {
    // Brief hold, then flash white
    setTimeout(() => {
      loader.classList.add("white");

      // Fade loader out, reveal page
      setTimeout(() => {
        loader.classList.add("hidden");
        document.body.classList.remove("loading");
        document.body.classList.add("loaded");
        document.body.style.overflow = "";

        setTimeout(() => { loader.style.display = "none"; }, 800);
      }, 500);
    }, 200);
  }

  setTimeout(() => requestAnimationFrame(animateFill), FILL_DELAY);
})();

const PROJECTS = [
  {
    name: "Absense Model",
    year: "2024",
    category: "Fashion / Editorial",
    desc: "A fashion editorial exploring the tension between presence and disappearance in urban environments. The series moves between anonymity and visibility — bodies caught mid-transit, neither arriving nor departing.",
    details: "Photography: Studio Archive\nStyling: —\nLocation: Brussels\nFormat: Editorial",
    tags: ["Fashion", "Editorial", "Photography"],
    img: "images/Absensemodel1.png",
    imgPortrait:  "images/Absensemodel3.png",
    imgLandscape: "images/Absensemodel2.png.png",
  },
  {
    name: "DTB Studio",
    year: "2024",
    category: "Visual Identity",
    desc: "Brand identity and typographic system for DTB Studio, a multidisciplinary creative practice. The identity is built around a bold typographic mark and a flexible grid system for print and digital applications.",
    details: "Client: DTB Studio\nScope: Visual Identity\nFormat: Print + Digital\nDelivery: 2024",
    tags: ["Branding", "Typography", "Identity"],
    img: "images/dtbstudio.png",
    imgPortrait:  "images/dtbstudio.png",
    imgLandscape: "images/dtbstudio.png",
  },
];

// ── Build DOM ──────────────────────────────────────────────
const projectNav = document.getElementById("projectNav");
const mainEl     = document.getElementById("main");
const scrollDots = document.getElementById("scrollDots");

PROJECTS.forEach((p, i) => {
  // Nav item
  const li = document.createElement("li");
  li.dataset.i = i;
  li.innerHTML = `<a href="#s${i}"><span class="item-dot"></span>${p.name}</a>`;
  li.querySelector("a").addEventListener("click", e => {
    e.preventDefault();
    document.getElementById(`s${i}`).scrollIntoView({ behavior: "smooth" });
  });
  projectNav.appendChild(li);

  // Right scroll dot
  const dot = document.createElement("div");
  dot.className = "sdot";
  dot.dataset.i = i;
  dot.title = p.name;
  dot.addEventListener("click", () =>
    document.getElementById(`s${i}`).scrollIntoView({ behavior: "smooth" })
  );
  scrollDots.appendChild(dot);

  // Section
  const sec = document.createElement("section");
  sec.className = "project-section";
  sec.id = `s${i}`;
  sec.dataset.i = i;
  sec.innerHTML = `
    <div class="bg-title">${p.name}</div>
    <div class="project-meta">
      <div class="meta-num">0${i + 1}</div>
      <div class="meta-name">${p.name}</div>
      <div class="meta-sub">${p.category} · ${p.year}</div>
    </div>
    <div class="img-wrap" data-i="${i}">
      <img src="${p.img}" alt="${p.name}" />
    </div>
  `;
  mainEl.appendChild(sec);
});

// ── Intersection Observer ─────────────────────────────────
const sections = document.querySelectorAll(".project-section");
const navItems = document.querySelectorAll(".project-nav li");
const sDots    = document.querySelectorAll(".sdot");

// Fires when section crosses the CENTER band of the viewport (-40% top/bottom = 20% center strip)
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const i = parseInt(entry.target.dataset.i);
    entry.target.classList.add("in-view");
    navItems.forEach((n, j) => n.classList.toggle("active", j === i));
    sDots.forEach((d, j) => d.classList.toggle("active", j === i));
  });
}, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });

sections.forEach(s => io.observe(s));

// bg-title observed separately — wider band so it never gets cut off on mobile
const bgTitleObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const title = entry.target.querySelector(".bg-title");
    if (title) title.dataset.visible = entry.isIntersecting ? "1" : "0";
  });
}, { rootMargin: "0px", threshold: 0 });

sections.forEach(s => bgTitleObserver.observe(s));

navItems[0]?.classList.add("active");
sDots[0]?.classList.add("active");
sections[0]?.classList.add("in-view");

// ── Floating scroll reveal (translateY + opacity, lerp-driven) ───
const revealStates = Array.from(sections).map(() => ({ cur: 0, target: 0 }));

function getTarget(sec) {
  const wh = window.innerHeight;
  const top = sec.getBoundingClientRect().top;
  // start when bottom 20% of viewport, complete by 45% into view
  return Math.max(0, Math.min(1, (wh * 0.85 - top) / (wh * 0.55)));
}

function revealLoop() {
  const wh = window.innerHeight;

  sections.forEach((sec, i) => {
    const rect  = sec.getBoundingClientRect();
    const state = revealStates[i];

    // ── img-wrap: float up from below ──
    state.target = getTarget(sec);
    state.cur += (state.target - state.cur) * 0.045;
    const wrap = sec.querySelector(".img-wrap");
    if (wrap) {
      wrap.style.opacity   = state.cur.toFixed(4);
      wrap.style.transform = `translateY(${((1 - state.cur) * 60).toFixed(2)}px)`;
    }

    // ── bg-title: bell-curve opacity, only when section is in DOM view ──
    const title = sec.querySelector(".bg-title");
    if (title) {
      const isVisible = title.dataset.visible !== "0";
      const secCenter = rect.top + rect.height / 2;
      const dist      = Math.abs(secCenter - wh / 2);
      // wider detection range (0.75) so mobile never clips it to 0 prematurely
      const titleTarget = isVisible
        ? Math.max(0, 1 - dist / (wh * 0.75))
        : 0;

      if (!state.titleCur) state.titleCur = 0;
      state.titleCur += (titleTarget - state.titleCur) * 0.055;

      title.style.opacity = state.titleCur.toFixed(4);
      const alpha = (0.07 + state.titleCur * 0.83).toFixed(4);
      title.style.color = `rgba(0,0,0,${alpha})`;
    }
  });

  requestAnimationFrame(revealLoop);
}

window.addEventListener("scroll", () => {}, { passive: true });
revealLoop();

// ── Custom cursor ────────────────────────────────────────
const cursor = document.getElementById("custom-cursor");
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let curX = mouseX;
let curY = mouseY;

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function cursorLoop() {
  curX += (mouseX - curX) * 0.12;
  curY += (mouseY - curY) * 0.12;
  cursor.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px) translate(-50%, -50%)`;
  requestAnimationFrame(cursorLoop);
}

cursorLoop();

// ── Panel ────────────────────────────────────────────────
const panel      = document.getElementById("panel");
const overlay    = document.getElementById("overlay");
const panelClose = document.getElementById("panelClose");

function openPanel(i) {
  const p = PROJECTS[i];

  document.getElementById("panelIndex").textContent = `0${i + 1}`;
  document.getElementById("panelTitle").textContent = p.name;
  document.getElementById("panelDesc").textContent  = p.desc;
  document.getElementById("panelImgName").textContent = p.name;
  document.getElementById("panelImgNum").textContent  = `0${i + 1}`;

  document.getElementById("panelImgPortrait").src  = p.imgPortrait;
  document.getElementById("panelImgLandscape").src = p.imgLandscape;

  const tagsEl = document.getElementById("panelTags");
  tagsEl.innerHTML = "";
  p.tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  panel.classList.add("open");
  overlay.classList.add("on");
  document.body.style.overflow = "hidden";
}

function closePanel() {
  panel.classList.remove("open");
  overlay.classList.remove("on");
  document.body.style.overflow = "";
}

document.addEventListener("click", e => {
  const wrap = e.target.closest(".img-wrap");
  if (wrap) openPanel(parseInt(wrap.dataset.i));
});

panelClose.addEventListener("click", closePanel);
document.getElementById("panelCloseText").addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);
document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });
