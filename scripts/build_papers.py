"""
Build the exam paper list from every PDF in pdfs/.

For each PDF it renders the pages to assets/pages/<id>/<n>.jpg (skipped when the
PDF hasn't changed) and writes js/papers.data.js, which the app loads.
Any PDF added to pdfs/ shows up as a new paper automatically; papers.config.json
can optionally override the guessed title / question count / labels / hidden pages.

Usage:
    python scripts/build_papers.py            # build once
    python scripts/build_papers.py --watch    # rebuild whenever pdfs/ changes
Requires: pip install pymupdf
"""
import hashlib
import json
import re
import shutil
import sys
import time
import unicodedata
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "pdfs"
PAGES_DIR = ROOT / "assets" / "pages"
CONFIG = ROOT / "papers.config.json"
OUT = ROOT / "js" / "papers.data.js"

PAGE_WIDTH = 1100  # px
JPEG_QUALITY = 72


def sha1(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_year(name: str):
    m = re.search(r"(?<!\d)(20[0-4]\d)(?!\d)", name)
    return int(m.group(1)) if m else None


def guess_title(stem: str, year, group: str) -> str:
    if group == "pyq" and year:
        return f"JNVST Question Paper {year}"
    clean = re.sub(r"\(\d+\)", "", stem)          # "(1)" download suffixes
    clean = re.sub(r"[_\-.]+", " ", clean)
    clean = re.sub(r"\bPDF\b", "", clean, flags=re.I)
    clean = re.sub(r"\s+", " ", clean).strip()
    if not re.search(r"\w", clean.replace("_", "")) or not re.search(r"[A-Za-zऀ-ॿ]", clean):
        clean = f"Practice Paper {clean}".strip()
    return clean


def guess_group(name: str) -> str:
    n = name.lower()
    practice_words = ["test", "सराव", "नवनीत", "practice", "mock", "sample"]
    pyq_words = ["प्रश्नपत्रिका", "question paper", "pyq", "jnvst"]
    if any(w in n for w in practice_words):
        return "practice"
    if any(w in n for w in pyq_words) and find_year(name):
        return "pyq"
    return "practice"


def make_id(stem: str) -> str:
    ascii_ = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_.lower()).strip("-")
    digest = hashlib.sha1(stem.encode("utf-8")).hexdigest()[:6]
    return f"{slug}-{digest}" if len(slug) >= 3 else f"paper-{digest}"


def render(pdf: Path, pid: str) -> int:
    """Render pages if the PDF changed since last time. Returns page count."""
    out = PAGES_DIR / pid
    stamp = out / ".source"
    digest = sha1(pdf)
    with pymupdf.open(pdf) as doc:
        count = doc.page_count
        have = len(list(out.glob("*.jpg"))) if out.exists() else 0
        if stamp.exists() and stamp.read_text().strip() == digest and have == count:
            return count
        print(f"  rendering {count} pages -> assets/pages/{pid}/")
        if out.exists():
            shutil.rmtree(out)
        out.mkdir(parents=True)
        for i, page in enumerate(doc, start=1):
            zoom = PAGE_WIDTH / page.rect.width
            pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
            pix.save(out / f"{i}.jpg", jpg_quality=JPEG_QUALITY)
    stamp.write_text(digest)
    return count


def build() -> None:
    cfg = json.loads(CONFIG.read_text(encoding="utf-8")).get("papers", {}) if CONFIG.exists() else {}
    cfg_order = list(cfg.keys())
    pdfs = sorted(p for p in PDF_DIR.glob("*") if p.suffix.lower() == ".pdf")
    papers, used_ids = [], set()

    for pdf in pdfs:
        name = pdf.name
        c = cfg.get(name, {})
        year = find_year(name)
        group = c.get("group") or guess_group(name)
        pid = c.get("id") or make_id(pdf.stem)
        if pid in used_ids:
            pid = f"{pid}-{hashlib.sha1(name.encode()).hexdigest()[:4]}"
        used_ids.add(pid)

        try:
            count = render(pdf, pid)
        except Exception as e:  # unreadable / corrupt PDF: skip it, keep the rest
            print(f"  ! skipped {name}: {e}")
            continue

        exclude = set(c.get("excludePages", []))
        questions = c.get("questions") or (80 if year and year >= 2019 else 100)
        labels = c.get("labels") or (["A", "B", "C", "D"] if questions == 80 else ["1", "2", "3", "4"])
        papers.append({
            "id": pid,
            "group": group,
            "title": c.get("title") or guess_title(pdf.stem, year, group),
            "source": name,
            "year": year,
            "pageCount": count,
            "pages": [n for n in range(1, count + 1) if n not in exclude],
            "questions": questions,
            "labels": labels,
            "duration": c.get("duration") or (120 if questions >= 80 else max(10, round(questions * 1.5))),
            "_order": c.get("order", cfg_order.index(name) if name in cfg_order else 10_000),
        })

    # previous-year papers first (newest first), then practice papers
    papers.sort(key=lambda p: (p["group"] != "pyq", -(p["year"] or 0) if p["group"] == "pyq" else 0, p["_order"], p["title"]))
    for p in papers:
        del p["_order"]

    # remove images of PDFs that no longer exist
    if PAGES_DIR.exists():
        keep = {p["id"] for p in papers}
        for d in PAGES_DIR.iterdir():
            if d.is_dir() and d.name not in keep:
                print(f"  removing stale assets/pages/{d.name}/")
                shutil.rmtree(d)

    OUT.write_text(
        "// AUTO-GENERATED by scripts/build_papers.py from the PDFs in pdfs/ — do not edit.\n"
        "// To change a paper's title, question count, etc. edit papers.config.json.\n"
        f"window.PAPER_DATA = {json.dumps(papers, ensure_ascii=False, indent=1)};\n",
        encoding="utf-8",
    )
    print(f"{len(papers)} papers -> {OUT.relative_to(ROOT)}")


def snapshot():
    files = [p for p in PDF_DIR.glob("*") if p.suffix.lower() == ".pdf"]
    state = {p.name: (p.stat().st_size, p.stat().st_mtime) for p in files}
    if CONFIG.exists():
        state["__config__"] = CONFIG.stat().st_mtime
    return state


if __name__ == "__main__":
    PDF_DIR.mkdir(exist_ok=True)
    build()
    if "--watch" in sys.argv:
        print("Watching pdfs/ for changes (Ctrl+C to stop)…")
        last = snapshot()
        while True:
            time.sleep(3)
            now = snapshot()
            if now != last:
                time.sleep(2)  # let a copy finish
                last = snapshot()
                try:
                    build()
                except Exception as e:
                    print(f"  ! build failed: {e}")
