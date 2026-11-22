# Navodaya Mock Test

An offline mock-test system built from the scanned JNVST papers in `pdfs/`.

## Use it
Open `index.html` in Chrome or Edge (double-click). It needs no server and no internet; only the web font is loaded online, with a fallback if you're offline.

- **Start test**: the question pages are on the left (zoom with − / +) and the OMR answer sheet is on the right (on a phone it's the bottom drawer). You get a 2-hour timer, and the test submits automatically when time runs out.
- Answers save as you go. If you close the tab, the timer pauses, and you can **Resume** from the home screen.
- **⚑** marks a question for review.
- **Answer key**: none of the PDFs has a matching answer key, so enter it once per paper (tap bubbles or paste `3142…` / `CABD…`). Every attempt of that paper, including past ones, is then scored by section (Mental Ability, Arithmetic, Language).
- **Export / Import keys** backs up keys or shares them between devices. To build a key into the app permanently, paste it into `js/answer-keys.js`.

## Files
```
index.html
scss/            source styles (_variables, _components, _home, _exam, _result …)
css/main.css     compiled from scss/
js/papers.js     paper list (question count, option labels, pages)
js/answer-keys.js  optional built-in keys
js/app.js        exam engine
assets/pages/    page images rendered from the PDFs
```

## Edit styles
```
npm install
npm run build:css     # or: npm run watch:css
```

## Notes
- The last 4 pages of `Navodaya Test 7.pdf` are an answer key for **Practice Paper 6**, not 7, so they are hidden.
- 2020, 2021 and 2023 papers have 80 questions (A–D). All the others have 100 (1–4).
