/*
 * Paper catalogue. The list itself is generated automatically from the PDFs in
 * pdfs/ by scripts/build_papers.py into js/papers.data.js (window.PAPER_DATA).
 * This file only adds the exam sections.
 */
window.PAPERS = (window.PAPER_DATA || []).map((p) => ({
  ...p,
  duration: p.duration || 120, // minutes — JNVST is a 2-hour paper
  sections:
    p.questions === 80
      ? [
          { name: "Mental Ability", short: "MAT", from: 1, to: 40 },
          { name: "Arithmetic", short: "Maths", from: 41, to: 60 },
          { name: "Language", short: "Lang", from: 61, to: 80 },
        ]
      : p.questions === 100
      ? [
          { name: "Mental Ability", short: "MAT", from: 1, to: 50 },
          { name: "Arithmetic", short: "Maths", from: 51, to: 75 },
          { name: "Language", short: "Lang", from: 76, to: 100 },
        ]
      : [{ name: "All questions", short: "All", from: 1, to: p.questions }],
}));
