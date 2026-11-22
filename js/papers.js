/*
 * Paper catalogue. Page images were rendered from the PDFs in pdfs/
 * into assets/pages/<id>/<n>.jpg.
 *
 * questions : total questions in the paper (100 for older/practice papers, 80 from 2020 onward)
 * labels    : how the paper prints its options
 * pages     : page numbers to show (Test 7's last 4 pages are an answer key for a
 *             different paper — Practice Paper 6 — so they are left out)
 */
window.PAPERS = [
  { id: "paper-2023", group: "pyq", title: "JNVST Question Paper 2023", source: "नवोदय प्रश्नपत्रिका 2023 PDF.pdf", pageCount: 15, questions: 80, labels: ["A", "B", "C", "D"] },
  { id: "ss-2021", group: "pyq", title: "JNVST Question Paper 2021", source: "2021-नवोदय प्रश्नपत्रिका-SS.pdf", pageCount: 7, questions: 80, labels: ["A", "B", "C", "D"] },
  { id: "ss-2020", group: "pyq", title: "JNVST Question Paper 2020", source: "2020-नवोदय प्रश्नपत्रिका-SS.pdf", pageCount: 14, questions: 80, labels: ["A", "B", "C", "D"] },
  { id: "ss-2018", group: "pyq", title: "JNVST Question Paper 2018", source: "2018-नवोदय प्रश्नपत्रिका-SS.pdf", pageCount: 10, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "ss-2017", group: "pyq", title: "JNVST Question Paper 2017", source: "2017-नवोदय प्रश्नपत्रिका-SS.pdf", pageCount: 10, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "ss-2013", group: "pyq", title: "JNVST Question Paper 2013", source: "2013-नवोदय प्रश्नपत्रिका-SS.pdf", pageCount: 9, questions: 100, labels: ["1", "2", "3", "4"] },

  { id: "navneet-1-2015", group: "practice", title: "Navneet Practice Paper 1 (2015)", source: "नवोदय नवनीत 1-2015.pdf", pageCount: 16, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "navneet-2-2016", group: "practice", title: "Navneet Practice Paper 2 (2016)", source: "नवोदय नवनीत 2-2016.pdf", pageCount: 16, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "navneet-3-2017", group: "practice", title: "Navneet Practice Paper 3 (2017)", source: "नवोदय नवनीत 3-2017.pdf", pageCount: 16, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "navneet-4", group: "practice", title: "Navneet Practice Paper 4", source: "नवोदय नवनीत 4.pdf", pageCount: 16, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "test-7", group: "practice", title: "Practice Paper 7", source: "Navodaya Test 7.pdf", pageCount: 20, pages: range(1, 16), questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "test-12", group: "practice", title: "Practice Paper 12", source: "Navodaya Test 12 (1).pdf", pageCount: 15, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "navneet-test-7", group: "practice", title: "Scholar Practice Paper 7", source: "…. 7 (1).pdf", pageCount: 15, questions: 100, labels: ["1", "2", "3", "4"] },
  { id: "navneet-test-8", group: "practice", title: "Scholar Practice Paper 8", source: "…. 8 (1).pdf", pageCount: 14, questions: 100, labels: ["1", "2", "3", "4"] },
];

window.PAPERS.forEach((p) => {
  p.pages = p.pages || range(1, p.pageCount);
  p.duration = 120; // minutes — JNVST is a 2-hour paper
  p.sections =
    p.questions === 80
      ? [
          { name: "Mental Ability", short: "MAT", from: 1, to: 40 },
          { name: "Arithmetic", short: "Maths", from: 41, to: 60 },
          { name: "Language", short: "Lang", from: 61, to: 80 },
        ]
      : [
          { name: "Mental Ability", short: "MAT", from: 1, to: 50 },
          { name: "Arithmetic", short: "Maths", from: 51, to: 75 },
          { name: "Language", short: "Lang", from: 76, to: 100 },
        ];
});

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
