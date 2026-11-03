from pathlib import Path
import json
import re
import html
import unicodedata
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
SONGS_DIR = ROOT / "songs"
COVERS_DIR = ROOT / "thumbnails"
AUDIO_EXTENSIONS = {".mp3", ".m4a", ".ogg", ".wav", ".aac", ".flac"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"}

def web_path(path: Path) -> str:
    return quote(path.relative_to(ROOT).as_posix(), safe="/-_.~")

def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    return re.sub(r"[_-]+", " ", stem).strip() or stem

def normalized(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return "".join(ch for ch in value if ch.isalnum())

def make_fallback_cover(path: Path, title: str):
    # Create a unique branded cover for tracks without a supplied image.
    safe_title = html.escape(title)
    words = title.split()
    lines, line = [], ""
    for word in words:
        if len(line) + len(word) + (1 if line else 0) > 24:
            lines.append(line)
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        lines.append(line)
    lines = lines[:4]
    title_svg = "".join(
        f'<text x="36" y="{250 + i*38}" fill="#ffffff" font-size="25" font-family="Arial, sans-serif" font-weight="700">{html.escape(part)}</text>'
        for i, part in enumerate(lines)
    )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#44205b"/><stop offset=".52" stop-color="#a12b78"/><stop offset="1" stop-color="#11172e"/></linearGradient><radialGradient id="glow"><stop stop-color="#ff9a42" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a42" stop-opacity="0"/></radialGradient></defs>
<rect width="600" height="600" rx="34" fill="url(#bg)"/><circle cx="470" cy="130" r="230" fill="url(#glow)"/>
<circle cx="500" cy="500" r="160" fill="#11172e" opacity=".38"/>
<text x="36" y="90" fill="#f3c8ff" font-size="22" font-family="Arial, sans-serif" letter-spacing="5">NAKRI × OG</text>
<text x="36" y="190" fill="#ffffff" font-size="76" font-family="Arial, sans-serif">♫</text>
{title_svg}
<text x="36" y="548" fill="#e7d8ff" font-size="18" font-family="Arial, sans-serif" letter-spacing="4">OFFICIAL MUSIC LIBRARY</text>
</svg>"""
    path.write_text(svg, encoding="utf-8")

def main():
    SONGS_DIR.mkdir(exist_ok=True)
    COVERS_DIR.mkdir(exist_ok=True)
    cover_files = [p for p in COVERS_DIR.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]
    cover_lookup = {p.stem.casefold(): p for p in cover_files}
    normalized_lookup = {}
    for p in cover_files:
        normalized_lookup.setdefault(normalized(p.stem), p)

    audio_files = sorted(
        (p for p in SONGS_DIR.iterdir() if p.is_file() and p.suffix.lower() in AUDIO_EXTENSIONS),
        key=lambda p: p.name.casefold()
    )
    tracks = []
    for audio in audio_files:
        title = title_from_filename(audio.name)
        cover = cover_lookup.get(audio.stem.casefold()) or normalized_lookup.get(normalized(audio.stem))
        if cover is None:
            cover = COVERS_DIR / f"{audio.stem}.svg"
            make_fallback_cover(cover, title)
            cover_lookup[audio.stem.casefold()] = cover
            normalized_lookup[normalized(audio.stem)] = cover
        tracks.append({
            "title": title,
            "artist": "NAKRI x OG",
            "file": web_path(audio),
            "cover": web_path(cover),
            "duration": audio.suffix[1:].upper()
        })

    (ROOT / "songs.json").write_text(json.dumps(tracks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Found {len(tracks)} audio file(s). Updated songs.json.")
    print(f"Every track now has a thumbnail: {sum(bool(t['cover']) for t in tracks)}/{len(tracks)}.")
    if not tracks:
        print("No audio files found. Put audio files in songs/ and run this script again.")
    else:
        for track in tracks:
            print(f" - {track['title']} -> {track['cover']}")

if __name__ == "__main__":
    main()
