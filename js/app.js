/* Navodaya Mock Test — exam engine (vanilla JS, no build step needed) */
(() => {
  "use strict";

  // ---------------------------------------------------------------- storage
  const LS = {
    keys: "nmt.keys.v1",
    attempts: "nmt.attempts.v1",
    active: "nmt.active.v1",
    zoom: "nmt.zoom.v1",
  };

  const store = {
    get(k, fallback) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        toast("Could not save — browser storage is unavailable or full");
      }
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch {}
    },
  };

  // ---------------------------------------------------------------- helpers
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const paperById = (id) => window.PAPERS.find((p) => p.id === id);
  const pageSrc = (p, n) => `assets/pages/${p.id}/${n}.jpg`;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (k === "style") node.style.cssText = v;
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return node;
  }

  function fmtTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 2600);
  }

  function confirmDialog(title, body, okText = "OK", cancelText = "Cancel") {
    const d = $("#dialog");
    $("#dialog-title").textContent = title;
    $("#dialog-body").textContent = body;
    $("#dialog-ok").textContent = okText;
    $("#dialog-cancel").textContent = cancelText;
    $("#dialog-cancel").hidden = !cancelText;
    return new Promise((resolve) => {
      d.addEventListener("close", () => resolve(d.returnValue === "ok"), { once: true });
      d.showModal();
    });
  }

  // ---------------------------------------------------------------- answer keys
  // A key is a string of length = questions; '1'-'4' = correct option, '0' = unknown.
  function normaliseKey(raw, n) {
    const map = { A: "1", B: "2", C: "3", D: "4", a: "1", b: "2", c: "3", d: "4" };
    const chars = String(raw || "")
      .replace(/[\s,;|]/g, "")
      .split("")
      .map((c) => (map[c] || (/[1-4]/.test(c) ? c : "0")));
    return chars.slice(0, n).join("").padEnd(n, "0");
  }

  function getLocalKeys() {
    return store.get(LS.keys, {});
  }

  function getKey(paper) {
    const local = getLocalKeys()[paper.id];
    const raw = local != null ? local : (window.BUILTIN_KEYS || {})[paper.id];
    if (!raw) return null;
    const key = normaliseKey(raw, paper.questions);
    return /[1-4]/.test(key) ? key : null; // an all-unknown key counts as no key
  }

  function keyCount(key) {
    return key ? key.replace(/0/g, "").length : 0;
  }

  // ---------------------------------------------------------------- grading
  function grade(paper, answers) {
    const key = getKey(paper);
    const res = { keyed: 0, correct: 0, wrong: 0, skipped: 0, attempted: 0, sections: [] };
    answers.forEach((a) => a && res.attempted++);
    if (!key) return { ...res, hasKey: false };

    res.sections = paper.sections.map((s) => ({ ...s, keyed: 0, correct: 0 }));
    for (let i = 0; i < paper.questions; i++) {
      const k = +key[i];
      if (!k) continue;
      res.keyed++;
      const sec = res.sections.find((s) => i + 1 >= s.from && i + 1 <= s.to);
      sec.keyed++;
      const a = answers[i];
      if (!a) res.skipped++;
      else if (a === k) {
        res.correct++;
        sec.correct++;
      } else res.wrong++;
    }
    res.hasKey = res.keyed > 0;
    res.pct = res.keyed ? Math.round((res.correct / res.keyed) * 100) : 0;
    return res;
  }

  // ---------------------------------------------------------------- routing
  function show(view) {
    $$(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go && go.dataset.go === "home") renderHome();
  });

  // ================================================================ HOME
  let filter = "all";

  function renderHome() {
    stopTimer();
    show("home");
    const grid = $("#paper-grid");
    grid.innerHTML = "";
    const attempts = store.get(LS.attempts, []);

    window.PAPERS.filter((p) => filter === "all" || p.group === filter).forEach((p) => {
      const key = getKey(p);
      const kc = keyCount(key);
      const mine = attempts.filter((a) => a.paperId === p.id);
      let best = null;
      if (kc) {
        mine.forEach((a) => {
          const g = grade(p, a.answers);
          if (best == null || g.correct > best.correct) best = g;
        });
      }

      grid.append(
        el("article", { class: "paper-card" },
          el("div", { class: "paper-card__thumb", style: `background-image:url('${pageSrc(p, p.pages[0])}')` },
            el("span", { class: "badge badge--brand" }, p.group === "pyq" ? "Previous year" : "Practice")),
          el("div", { class: "paper-card__body" },
            el("h3", { class: "paper-card__title" }, p.title),
            el("div", { class: "paper-card__meta" },
              el("span", { class: "badge badge--none" }, `${p.questions} Qs`),
              el("span", { class: "badge badge--none" }, `${p.duration} min`),
              kc === p.questions
                ? el("span", { class: "badge badge--ok" }, "✓ Answer key")
                : kc
                ? el("span", { class: "badge badge--ok" }, `Key ${kc}/${p.questions}`)
                : el("span", { class: "badge badge--none" }, "No key yet")),
            el("p", { class: "paper-card__best" },
              mine.length
                ? best
                  ? `Best: ${best.correct}/${best.keyed} · ${mine.length} attempt${mine.length > 1 ? "s" : ""}`
                  : `${mine.length} attempt${mine.length > 1 ? "s" : ""} · add a key to see scores`
                : "Not attempted yet"),
            el("div", { class: "paper-card__actions" },
              el("button", { class: "btn btn--primary", onclick: () => startExam(p.id) }, "Start test"),
              el("button", { class: "btn btn--ghost", onclick: () => renderKeyEditor(p.id) }, "Answer key")))));
    });

    // Resume banner
    const active = store.get(LS.active, null);
    const banner = $("#resume-banner");
    const ap = active && paperById(active.paperId);
    if (ap) {
      const done = active.answers.filter(Boolean).length;
      banner.hidden = false;
      banner.innerHTML = "";
      banner.append(
        el("div", {},
          el("strong", {}, `Unfinished test: ${ap.title}`),
          el("div", { class: "muted" }, `${done}/${ap.questions} answered · ${fmtTime(active.remaining)} left`)),
        el("div", { class: "toolbar__actions" },
          el("button", { class: "btn btn--ghost", onclick: discardActive }, "Discard"),
          el("button", { class: "btn btn--primary", onclick: () => openExam(active) }, "Resume")));
    } else banner.hidden = true;
  }

  async function discardActive() {
    if (await confirmDialog("Discard unfinished test?", "All answers filled so far will be lost.", "Discard")) {
      store.del(LS.active);
      renderHome();
    }
  }

  $("#paper-filter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    filter = b.dataset.filter;
    $$("#paper-filter .seg__btn").forEach((x) => x.classList.toggle("is-active", x === b));
    renderHome();
  });

  $("#btn-history").addEventListener("click", renderHistory);

  $("#btn-export").addEventListener("click", () => {
    const keys = { ...(window.BUILTIN_KEYS || {}), ...getLocalKeys() };
    if (!Object.keys(keys).length) return toast("No answer keys entered yet");
    const blob = new Blob([JSON.stringify(keys, null, 2)], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "navodaya-answer-keys.json" });
    document.body.append(a);
    a.click();
    a.remove();
  });

  $("#input-import").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const keys = getLocalKeys();
      let n = 0;
      for (const [id, raw] of Object.entries(data)) {
        const p = paperById(id);
        if (p && typeof raw === "string") {
          keys[id] = normaliseKey(raw, p.questions);
          n++;
        }
      }
      store.set(LS.keys, keys);
      toast(`Imported ${n} answer key${n === 1 ? "" : "s"}`);
      renderHome();
    } catch {
      toast("That file is not a valid answer-key export");
    }
  });

  // ================================================================ EXAM
  let exam = null; // { paperId, answers[], marked[], remaining, startedAt }
  let timerId = null;
  let lastTick = 0;
  let zoom = store.get(LS.zoom, 100);
  const ZOOMS = [50, 67, 80, 100, 125, 150, 200];

  async function startExam(paperId) {
    const active = store.get(LS.active, null);
    if (active && active.paperId !== paperId) {
      const other = paperById(active.paperId);
      const ok = await confirmDialog(
        "Start a new test?",
        `You have an unfinished test (${other ? other.title : "unknown"}). Starting this one will discard it.`,
        "Start new");
      if (!ok) return;
    }
    if (active && active.paperId === paperId) return openExam(active);

    const p = paperById(paperId);
    const ok = await confirmDialog(
      p.title,
      `${p.questions} questions · ${p.duration} minutes. Read questions on the left and fill the answer sheet on the right. The timer starts now and the test submits automatically when time runs out.`,
      "Begin");
    if (!ok) return;

    openExam({
      paperId,
      answers: Array(p.questions).fill(0),
      marked: Array(p.questions).fill(false),
      remaining: p.duration * 60 * 1000,
      startedAt: Date.now(),
    });
  }

  function openExam(state) {
    exam = state;
    const p = paperById(exam.paperId);
    saveExam();
    show("exam");

    $("#exam-title").textContent = p.title;
    $("#exam-meta").textContent = `${p.questions} questions · options ${p.labels.join(" / ")}`;

    // pages
    const pages = $("#pages");
    pages.innerHTML = "";
    p.pages.forEach((n, i) => {
      pages.append(
        el("figure", { class: "page", "data-index": i + 1 },
          el("img", { src: pageSrc(p, n), alt: `${p.title}, page ${i + 1}`, loading: i < 2 ? "eager" : "lazy" }),
          el("span", { class: "page__no" }, `${i + 1} / ${p.pages.length}`)));
    });
    pages.scrollTop = 0;
    applyZoom();
    observePages();

    // section tabs
    const tabs = $("#section-tabs");
    tabs.innerHTML = "";
    p.sections.forEach((s, i) => {
      tabs.append(el("button", {
        class: "seg__btn" + (i === 0 ? " is-active" : ""),
        onclick: (e) => {
          $$(".seg__btn", tabs).forEach((b) => b.classList.toggle("is-active", b === e.currentTarget));
          const row = $(`#omr-list [data-q="${s.from}"]`);
          const list = $("#omr-list");
          list.scrollTo({ top: row.offsetTop - list.offsetTop - 30, behavior: "smooth" });
        },
      }, `${s.short} ${s.from}–${s.to}`));
    });

    // OMR rows
    const list = $("#omr-list");
    list.innerHTML = "";
    for (let q = 1; q <= p.questions; q++) {
      const sec = p.sections.find((s) => s.from === q);
      if (sec) list.append(el("li", { class: "section-label" }, `${sec.name} (${sec.from}–${sec.to})`));
      list.append(
        el("li", { class: "q-row", "data-q": q },
          el("span", { class: "q-row__no" }, `${q}.`),
          el("span", { class: "q-row__opts", role: "radiogroup", "aria-label": `Question ${q}` },
            p.labels.map((lab, i) =>
              el("button", { class: "bubble", "data-opt": i + 1, role: "radio", "aria-label": `Question ${q} option ${lab}` }, lab))),
          el("button", { class: "q-row__flag", title: "Mark for review", "aria-label": `Mark question ${q} for review` }, "⚑")));
    }
    list.scrollTop = 0;
    paintOmr();

    $("#omr").classList.remove("is-open");
    startTimer();
  }

  function paintOmr() {
    const p = paperById(exam.paperId);
    $$("#omr-list .q-row").forEach((row) => {
      const q = +row.dataset.q;
      const a = exam.answers[q - 1];
      row.classList.toggle("is-marked", exam.marked[q - 1]);
      $$(".bubble", row).forEach((b) => {
        const on = +b.dataset.opt === a;
        b.classList.toggle("is-filled", on);
        b.setAttribute("aria-checked", on);
      });
    });
    const answered = exam.answers.filter(Boolean).length;
    const marked = exam.marked.filter(Boolean).length;
    $("#stat-answered").textContent = answered;
    $("#stat-marked").textContent = marked;
    $("#stat-left").textContent = p.questions - answered;
    $("#omr-count-mini").textContent = `${answered}/${p.questions} ▲`;
  }

  $("#omr-list").addEventListener("click", (e) => {
    if (!exam) return;
    const row = e.target.closest(".q-row");
    if (!row) return;
    const i = +row.dataset.q - 1;
    const bubble = e.target.closest(".bubble");
    if (bubble) {
      const opt = +bubble.dataset.opt;
      exam.answers[i] = exam.answers[i] === opt ? 0 : opt;
    } else if (e.target.closest(".q-row__flag")) {
      exam.marked[i] = !exam.marked[i];
    } else return;
    saveExam();
    paintOmr();
  });

  $("#omr-toggle").addEventListener("click", () => $("#omr").classList.toggle("is-open"));

  function saveExam() {
    if (exam) store.set(LS.active, exam);
  }

  // ----- timer (pauses while the page is closed; keeps running while open)
  function startTimer() {
    stopTimer();
    lastTick = Date.now();
    tick();
    timerId = setInterval(tick, 500);
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  function tick() {
    if (!exam) return;
    const now = Date.now();
    exam.remaining -= now - lastTick;
    lastTick = now;
    const t = $("#timer");
    $("#timer-text").textContent = fmtTime(exam.remaining);
    t.classList.toggle("is-low", exam.remaining < 10 * 60e3);
    t.classList.toggle("is-critical", exam.remaining < 60e3);
    if (Math.floor(now / 5000) !== Math.floor((now - 500) / 5000)) saveExam();
    if (exam.remaining <= 0) {
      exam.remaining = 0;
      finishExam(true);
    }
  }

  window.addEventListener("beforeunload", saveExam);
  document.addEventListener("visibilitychange", () => document.hidden && saveExam());

  $("#btn-submit").addEventListener("click", async () => {
    const p = paperById(exam.paperId);
    const left = exam.answers.filter((a) => !a).length;
    const marked = exam.marked.filter(Boolean).length;
    const parts = [];
    if (left) parts.push(`${left} question${left > 1 ? "s are" : " is"} not answered`);
    if (marked) parts.push(`${marked} marked for review`);
    const body = parts.length
      ? `${parts.join(" and ")}. You still have ${fmtTime(exam.remaining)}. Submit anyway?`
      : `All ${p.questions} questions answered. Submit now?`;
    if (await confirmDialog("Submit test?", body, "Submit", "Keep working")) finishExam(false);
  });

  $("#btn-exit").addEventListener("click", async () => {
    saveExam();
    if (await confirmDialog("Leave the test?", "Your answers are saved and the timer pauses. You can resume from the home screen.", "Leave", "Stay")) {
      exam = null;
      renderHome();
    }
  });

  function finishExam(timeUp) {
    stopTimer();
    const p = paperById(exam.paperId);
    const attempt = {
      id: uid(),
      paperId: exam.paperId,
      answers: exam.answers,
      startedAt: exam.startedAt,
      submittedAt: Date.now(),
      timeUsed: p.duration * 60e3 - Math.max(0, exam.remaining),
      timeUp,
    };
    const attempts = store.get(LS.attempts, []);
    attempts.unshift(attempt);
    store.set(LS.attempts, attempts);
    store.del(LS.active);
    exam = null;
    if (timeUp) toast("Time is up — your test was submitted");
    renderResult(attempt.id);
  }

  // ----- zoom & page indicator
  function applyZoom() {
    const pages = $("#pages");
    const avail = pages.clientWidth - 32;
    const base = Math.min(avail, 900);
    pages.style.setProperty("--page-w", `${Math.round((base * zoom) / 100)}px`);
    $("#zoom-label").textContent = `${zoom}%`;
  }

  $$("[data-zoom]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = ZOOMS.indexOf(zoom);
      const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? 3 : i) + +b.dataset.zoom))];
      const pages = $("#pages");
      const ratio = pages.scrollTop / (pages.scrollHeight || 1);
      zoom = next;
      store.set(LS.zoom, zoom);
      applyZoom();
      pages.scrollTop = ratio * pages.scrollHeight;
    }));

  window.addEventListener("resize", () => exam && applyZoom());

  let pageObserver;
  function observePages() {
    pageObserver && pageObserver.disconnect();
    const total = $$("#pages .page").length;
    pageObserver = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) $("#page-indicator").textContent = `Page ${vis.target.dataset.index} of ${total}`;
      },
      { root: $("#pages"), threshold: [0.25, 0.5, 0.75] });
    $$("#pages .page").forEach((pg) => pageObserver.observe(pg));
  }

  // ================================================================ RESULT
  function renderResult(attemptId) {
    const attempt = store.get(LS.attempts, []).find((a) => a.id === attemptId);
    if (!attempt) return renderHome();
    const p = paperById(attempt.paperId);
    const g = grade(p, attempt.answers);
    const key = getKey(p);
    show("result");

    const root = $("#result-content");
    root.innerHTML = "";
    const wrap = el("div", { class: "stack" });
    root.append(wrap);

    const meta = `${fmtDate(attempt.submittedAt)} · time used ${fmtTime(attempt.timeUsed)}${attempt.timeUp ? " (time ran out)" : ""}`;

    if (g.hasKey) {
      wrap.append(
        el("div", { class: "card" },
          el("div", { class: "score" },
            el("div", { class: "score__ring", style: `--pct:${g.pct}` },
              el("div", {}, el("b", {}, `${g.correct}`), el("small", {}, `out of ${g.keyed}`))),
            el("div", { class: "score__text" },
              el("h2", {}, `${g.pct}% · ${verdict(g.pct)}`),
              el("p", {}, p.title),
              el("p", { class: "muted" }, meta),
              g.keyed < p.questions
                ? el("p", { class: "muted" }, `Graded on ${g.keyed} of ${p.questions} questions (the answer key is incomplete).`)
                : null)),
          el("div", { class: "stat-row" },
            el("div", { class: "is-ok" }, el("b", {}, g.correct), el("small", {}, "Correct")),
            el("div", { class: "is-bad" }, el("b", {}, g.wrong), el("small", {}, "Wrong")),
            el("div", {}, el("b", {}, g.skipped), el("small", {}, "Not answered")),
            el("div", {}, el("b", {}, g.attempted), el("small", {}, "Attempted"))),
          el("div", { class: "sections" },
            g.sections.map((s) =>
              el("div", { class: "sec-bar" },
                el("div", { class: "sec-bar__head" },
                  el("strong", {}, `${s.name}`),
                  el("span", {}, s.keyed ? `${s.correct} / ${s.keyed}` : "no key")),
                el("div", { class: "sec-bar__track" },
                  el("div", { class: "sec-bar__fill", style: `width:${s.keyed ? (s.correct / s.keyed) * 100 : 0}%` })))))));
    } else {
      wrap.append(
        el("div", { class: "card" },
          el("h2", {}, "Test submitted"),
          el("p", {}, `${p.title} — ${g.attempted} of ${p.questions} questions answered.`),
          el("p", { class: "muted" }, meta),
          el("p", {}, "This paper has no answer key yet, so it can't be scored. Enter the key once (from the book's answer page or a teacher) and this attempt will be graded straight away."),
          el("div", { class: "cta" },
            el("button", { class: "btn btn--primary", onclick: () => renderKeyEditor(p.id, attempt.id) }, "Enter answer key"))));
    }

    // review sheet
    const grid = el("div", { class: "review__grid" });
    for (let i = 0; i < p.questions; i++) {
      const a = attempt.answers[i];
      const k = key ? +key[i] : 0;
      grid.append(
        el("div", { class: "q-row" },
          el("span", { class: "q-row__no" }, `${i + 1}.`),
          el("span", { class: "q-row__opts" },
            p.labels.map((lab, j) => {
              const o = j + 1;
              let cls = "bubble";
              if (k) {
                if (a === o) cls += o === k ? " is-correct" : " is-wrong";
                else if (o === k) cls += " is-key";
              } else if (a === o) cls += " is-filled";
              return el("span", { class: cls }, lab);
            }))));
    }
    wrap.append(
      el("div", { class: "card review" },
        el("h3", {}, "Your answer sheet"),
        key
          ? el("div", { class: "review__legend" },
              el("span", {}, el("i", { style: "background:#15803d" }), "Your correct answer"),
              el("span", {}, el("i", { style: "background:#c2410c" }), "Your wrong answer"),
              el("span", {}, el("i", { style: "border:2.5px solid #15803d" }), "Correct option"))
          : null,
        grid),
      el("div", { class: "cta" },
        el("button", { class: "btn btn--primary", onclick: () => startExam(p.id) }, "Retake this paper"),
        el("button", { class: "btn btn--ghost", onclick: () => renderKeyEditor(p.id, attempt.id) }, key ? "Edit answer key" : "Enter answer key"),
        el("button", { class: "btn btn--ghost", onclick: renderHome }, "All papers")));
  }

  function verdict(pct) {
    if (pct >= 85) return "Excellent!";
    if (pct >= 70) return "Very good";
    if (pct >= 50) return "Good effort";
    return "Keep practising";
  }

  // ================================================================ KEY EDITOR
  let keyDraft = [];
  let keyPaper = null;
  let keyReturnAttempt = null;

  function renderKeyEditor(paperId, returnAttemptId) {
    keyPaper = paperById(paperId);
    keyReturnAttempt = returnAttemptId || null;
    const existing = getKey(keyPaper);
    keyDraft = Array.from({ length: keyPaper.questions }, (_, i) => (existing ? +existing[i] : 0));
    show("key");
    $("#key-title").textContent = `Answer key — ${keyPaper.title}`;
    syncQuickText();

    const grid = $("#key-grid");
    grid.innerHTML = "";
    for (let q = 1; q <= keyPaper.questions; q++) {
      grid.append(
        el("div", { class: "q-row", "data-q": q },
          el("span", { class: "q-row__no" }, `${q}.`),
          el("span", { class: "q-row__opts" },
            keyPaper.labels.map((lab, i) => el("button", { class: "bubble", "data-opt": i + 1, type: "button" }, lab)))));
    }
    paintKey();
  }

  function paintKey() {
    $$("#key-grid .q-row").forEach((row) => {
      const v = keyDraft[+row.dataset.q - 1];
      $$(".bubble", row).forEach((b) => b.classList.toggle("is-filled", +b.dataset.opt === v));
    });
    const n = keyDraft.filter(Boolean).length;
    $("#key-progress").textContent = `${n} of ${keyPaper.questions} filled`;
  }

  $("#key-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".bubble");
    if (!b) return;
    const i = +b.closest(".q-row").dataset.q - 1;
    const o = +b.dataset.opt;
    keyDraft[i] = keyDraft[i] === o ? 0 : o;
    paintKey();
    syncQuickText();
  });

  // Mirror the bubbles into the text box (empty when nothing is filled; trailing unknowns trimmed)
  function syncQuickText() {
    $("#key-quick").value = keyDraft
      .map((v) => (v ? keyPaper.labels[v - 1] : "-"))
      .join("")
      .replace(/-+$/, "");
  }

  $("#key-apply-quick").addEventListener("click", () => {
    const k = normaliseKey($("#key-quick").value, keyPaper.questions);
    keyDraft = k.split("").map(Number);
    paintKey();
    toast(`${keyDraft.filter(Boolean).length} answers filled from text`);
  });

  $("#key-save").addEventListener("click", () => {
    const keys = getLocalKeys();
    keys[keyPaper.id] = keyDraft.join("");
    store.set(LS.keys, keys);
    toast("Answer key saved");
    keyReturnAttempt ? renderResult(keyReturnAttempt) : renderHome();
  });

  $("#key-clear").addEventListener("click", async () => {
    if (!(await confirmDialog("Clear this answer key?", "Scores for this paper will be hidden until a key is entered again.", "Clear"))) return;
    const keys = getLocalKeys();
    keys[keyPaper.id] = "0".repeat(keyPaper.questions);
    store.set(LS.keys, keys);
    keyDraft.fill(0);
    paintKey();
    $("#key-quick").value = "";
    toast("Answer key cleared");
  });

  // ================================================================ HISTORY
  function renderHistory() {
    show("history");
    const list = $("#history-list");
    list.innerHTML = "";
    const attempts = store.get(LS.attempts, []);
    if (!attempts.length) {
      list.append(el("p", { class: "muted" }, "No tests submitted yet."));
      return;
    }
    attempts.forEach((a) => {
      const p = paperById(a.paperId);
      if (!p) return;
      const g = grade(p, a.answers);
      list.append(
        el("div", { class: "history-item" },
          el("div", { class: "history-item__main" },
            el("strong", {}, p.title),
            el("small", {}, `${fmtDate(a.submittedAt)} · ${g.attempted}/${p.questions} answered · ${fmtTime(a.timeUsed)}`)),
          el("div", { class: "history-item__score" }, g.hasKey ? `${g.correct}/${g.keyed}` : "—"),
          el("button", { class: "btn btn--ghost", onclick: () => renderResult(a.id) }, "View"),
          el("button", {
            class: "btn btn--danger-ghost",
            onclick: async () => {
              if (!(await confirmDialog("Delete this result?", "This cannot be undone.", "Delete"))) return;
              store.set(LS.attempts, store.get(LS.attempts, []).filter((x) => x.id !== a.id));
              renderHistory();
            },
          }, "Delete")));
    });
  }

  // ================================================================ boot
  renderHome();
})();
