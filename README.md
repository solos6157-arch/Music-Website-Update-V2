# NAKRI x OG — Music Website (GitHub Pages fixed)

The important fix: **GitHub Pages cannot automatically list files inside your `songs` folder**. Adding an MP3 by itself does not add it to the website. This package includes `build_songs.py`, which scans `songs/` and creates `songs.json` for you, including URL-safe paths for filenames containing spaces or special characters.

## Add your songs (Windows)

1. Extract this ZIP.
2. Put your audio files (`.mp3`, `.m4a`, `.ogg`, `.wav`, `.aac`, or `.flac`) in the `songs` folder.
3. Optional: put each cover image in `thumbnails`. For example, `my-song.mp3` can use `my-song.jpg` or `my-song.png`. The generator now matches filenames while ignoring punctuation/spacing differences. If a track still has no cover image, it automatically creates a unique NAKRI × OG branded SVG thumbnail using the song title.
4. Open Command Prompt in the website folder. In File Explorer, open the folder, click the address bar, type `cmd`, and press Enter.
5. Run:

   ```bat
   py build_songs.py
   ```

   If `py` isn't available, try `python build_songs.py`.
6. Check that `songs.json` now lists your tracks.
7. Upload/commit **index.html, style.css, app.js, songs.json, songs/, and thumbnails/** to the same GitHub repository folder. Keep `index.html` and `songs.json` beside each other at the published site root.
8. Wait for GitHub Pages to redeploy, then hard-refresh the site with **Ctrl + F5**.

## Thumbnail fix

Every song listed in `songs.json` now has a thumbnail path. The supplied cover images are matched more flexibly, and `build_songs.py` automatically creates a branded cover for any future song that has no matching image. For a song's own artwork, add an image with the same filename stem in `thumbnails`; then run `py build_songs.py` again.

## Important checks

- The uploaded ZIP originally contained only placeholder text in `songs/` and no actual MP3 file. You must copy your own song files into the extracted `songs/` folder before running the script.
- GitHub filenames are case-sensitive: `MySong.MP3` and `mysong.mp3` are different paths. The generator writes the exact filename automatically.
- If you add, remove, or rename a song, run `py build_songs.py` again and upload the updated `songs.json` plus the changed files.
- If the song appears but will not play, open the browser developer console (F12) and check the Network tab for a failed audio request. Confirm the audio file is present in GitHub at the exact generated path.
- GitHub Pages is static hosting; it cannot scan folders or accept uploads from visitors at runtime.
- Only upload music and artwork you own or have permission to distribute.


## Website logo

Your supplied picture is saved as `assets/logo.png`. The header logo, browser tab favicon, and Apple touch icon use this image. To replace it later, upload a new PNG to `assets/logo.png` using the same filename, then commit the change to GitHub.


## Music-app features (upgraded)

- Search by song title or artist name.
- Browse artist collections and filter the library by artist. Artist names are inferred from the song filenames when possible; rename files with `Artist – Song Title.mp3` for best results.
- Click **VIEW MUSIC** to open the expanded listening screen with large artwork, progress control, previous/next, repeat and download.
- Repeat button cycles through **Repeat off → Repeat one → Repeat all**.
- Download buttons download the currently selected track. Downloads are available for the audio files included with the website and may depend on browser/hosting permissions.

The site remains static and works with GitHub Pages. Visitors can listen to and download only the tracks you publish in the website's `songs/` folder. Upload only music you own or have permission to distribute.
