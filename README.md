# Navodaya Mock Test

An online mock-test system for JNVST (Navodaya) papers. Live at **https://impalamol.github.io/navoday-practice-exam/**

## Add a new paper
1. Put the PDF in `pdfs/`.
2. Commit and push, or upload the PDF on github.com into the `pdfs/` folder.

A GitHub Action turns every page into an image, adds the paper to the list, and redeploys the site. It's usually live within 2 minutes.

The app guesses each new paper's settings from the file name: a year of 2019 or later means 80 questions with options A–D; otherwise 100 questions with 1–4. If a paper is different (another question count, अ/ब/क/ड options, pages to hide, a nicer title), add an entry for it in `papers.config.json`.

## Answer keys
Put a paper's key in `js/answer-keys.js`: one character per question, `1`–`4` (or `A`–`D` / `अ`–`ड`), with `0` for unknown. A teacher can also enter a key in the app's **Answer key** screen. Keys entered there are saved in that browser only; use **Export keys** to back them up.

## Run locally
```
pip install pymupdf
npm run papers          # build page images + paper list from pdfs/
npm run papers:watch    # …and rebuild automatically when pdfs/ changes
```
Then open `index.html`.

To change styles, edit `scss/` and run `npm install` once, then `npm run build:css`.

## Files
```
index.html
pdfs/                   source papers (the only thing you need to add to)
papers.config.json      optional per-paper overrides
scripts/build_papers.py PDF → assets/pages/ + js/papers.data.js (generated, not committed)
scss/ → css/main.css    styles
js/app.js               exam engine
js/answer-keys.js       built-in answer keys
.github/workflows/      build + deploy
```

## Notes
- The last 4 pages of `Navodaya Test 7.pdf` are an answer key for **Practice Paper 6**, not 7, so they are hidden.
- The site and repository are public, including the PDFs.
