const audio = document.getElementById("audio");
const grid = document.getElementById("songGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const emptyState = document.getElementById("emptyState");
const trackCount = document.getElementById("trackCount");
const playBtn = document.getElementById("playBtn");
const seekBar = document.getElementById("seekBar");
let songs = [];
let visibleSongs = [];
let currentIndex = -1;
let repeatMode = 0; // 0 = off, 1 = repeat current track, 2 = repeat all
let activeArtist = "";

document.getElementById("year").textContent = new Date().getFullYear();
audio.volume = 0.8;

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
function coverMarkup(song, extraClass = "") {
  if (song.cover) {
    return `<img class="${extraClass}" src="${song.cover}" alt="${escapeHTML(song.title)} cover" loading="lazy" onerror="this.remove();this.parentElement.classList.add('cover-failed')">`;
  }
  return `<div class="cover-placeholder ${extraClass}" aria-label="No cover image">♫</div>`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function inferArtist(item) {
  const raw = decodeURIComponent((item.file || "").split("/").pop() || "").replace(/\\.[^.]+$/, "");
  const match = raw.match(/^(.+?)\\s+[–—-]\\s+/);
  if (match) return match[1].trim();
  const fallback = raw.match(/^(.+?)(?=\\s*24-7$)/i);
  return fallback ? fallback[1].trim() : safeText(item.artist, "NAKRI x OG");
}
function cleanTitle(title, artist) {
  if (!title.toLowerCase().startsWith(artist.toLowerCase())) return title;
  return title.slice(artist.length).replace(/^\\s*[–—-]\\s*/, "").trim() || title;
}
function renderArtists() {
  const artists = [...new Set(songs.map(song => song.artist))].sort((a,b) => a.localeCompare(b));
  const select = document.getElementById("artistSelect");
  const current = activeArtist;
  select.innerHTML = '<option value="">All artists</option>' + artists.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join("");
  select.value = current;
  document.getElementById("artistGrid").innerHTML = artists.map((artist, i) => {
    const first = songs.find(song => song.artist === artist);
    return `<button class="artist-tile ${activeArtist === artist ? "active" : ""}" type="button" data-artist="${escapeHTML(artist)}">
      <span class="artist-avatar">${first && first.cover ? `<img src="${first.cover}" alt="">` : "♫"}</span><span><b>${escapeHTML(artist)}</b><small>${songs.filter(song => song.artist === artist).length} TRACKS</small></span></button>`;
  }).join("");
  const trending = document.getElementById("trendingArtists");
  if (trending) trending.innerHTML = artists.slice(0,5).map((artist, i) => {
    const first = songs.find(song => song.artist === artist);
    return `<div class="trending-item"><div class="trend-avatar">${first && first.cover ? `<img src="${first.cover}" alt="">` : "♫"}</div><div class="trend-copy"><b>${escapeHTML(artist)}</b><small>${songs.filter(song => song.artist === artist).length} tracks</small></div><span class="trend-rank">0${i+1}</span></div>`;
  }).join("");
  document.querySelectorAll(".song-card").forEach(card => card.classList.toggle("is-playing", card.dataset.track === String(currentIndex)));
  document.querySelectorAll(".artist-tile").forEach(button => button.addEventListener("click", () => {
    activeArtist = activeArtist === button.dataset.artist ? "" : button.dataset.artist;
    select.value = activeArtist; renderArtists(); renderSongs();
  }));
}
function setRepeatButtons() {
  const labels = ["Repeat off", "Repeat one", "Repeat all"];
  ["repeatBtn","viewRepeatBtn"].forEach(id => {
    const button = document.getElementById(id);
    button.textContent = repeatMode === 1 ? "↻¹" : "↻";
    button.classList.toggle("active", repeatMode !== 0);
    button.title = labels[repeatMode]; button.setAttribute("aria-label", labels[repeatMode]);
  });
}
function updateListenView(song) {
  document.getElementById("listenTitle").textContent = song.title;
  document.getElementById("listenArtist").textContent = song.artist;
  const art = document.getElementById("listenArt");
  art.innerHTML = song.cover ? `<img src="${song.cover}" alt="">` : "<span>♫</span>";
  document.getElementById("downloadBtn").href = song.file;
  document.getElementById("viewDownloadBtn").href = song.file;
  document.getElementById("downloadBtn").setAttribute("download", song.title);
  document.getElementById("viewDownloadBtn").setAttribute("download", song.title);
  const sideDownload = document.getElementById("sideDownload"); if (sideDownload) { sideDownload.href = song.file; sideDownload.setAttribute("download", song.title); }
  const sideArt = document.getElementById("nowArt"); if (sideArt) sideArt.innerHTML = song.cover ? `<img src="${song.cover}" alt="">` : "♫";
}
function openListenView() {
  if (currentIndex >= 0) updateListenView(songs[currentIndex]);
  document.getElementById("listenView").classList.add("open");
  document.getElementById("listenView").setAttribute("aria-hidden", "false");
}
function renderSongs() {
  const query = searchInput.value.trim().toLowerCase();
  visibleSongs = songs.map((song, index) => ({...song, originalIndex:index}))
    .filter(song => (!activeArtist || song.artist === activeArtist) && `${song.title} ${song.artist}`.toLowerCase().includes(query));
  if (sortSelect.value === "name") visibleSongs.sort((a,b) => a.title.localeCompare(b.title));
  grid.innerHTML = "";
  trackCount.textContent = `${visibleSongs.length} TRACK${visibleSongs.length === 1 ? "" : "S"}`;
  emptyState.hidden = visibleSongs.length !== 0;
  visibleSongs.forEach(song => {
    const card = document.createElement("article");
    card.className = "song-card" + (song.originalIndex === currentIndex ? " is-playing" : ""); card.dataset.track = String(song.originalIndex);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Play ${song.title} by ${song.artist}`);
    const cover = document.createElement("div");
    cover.className = "cover-wrap";
    if (song.cover) {
      const img = document.createElement("img");
      img.src = song.cover; img.alt = `${song.title} cover`; img.loading = "lazy";
      img.onerror = () => { cover.innerHTML = '<div class="cover-placeholder">♫</div>'; };
      cover.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "cover-placeholder"; placeholder.textContent = "♫";
      cover.appendChild(placeholder);
    }
    const button = document.createElement("button");
    button.className = "card-play"; button.type = "button";
    button.setAttribute("aria-label", `Play ${song.title}`);
    button.textContent = song.originalIndex === currentIndex && !audio.paused ? "Ⅱ" : "▶";
    button.addEventListener("click", event => { event.stopPropagation(); playSong(song.originalIndex); });
    cover.appendChild(button);
    const title = document.createElement("h3"); title.className = "song-title"; title.textContent = song.title;
    const artist = document.createElement("div"); artist.className = "song-artist"; artist.textContent = song.artist;
    const meta = document.createElement("div"); meta.className = "song-meta";
    const label = document.createElement("span"); label.textContent = "NAKRI × OG";
    const duration = document.createElement("span"); duration.textContent = song.duration || "MP3";
    meta.append(label, duration);
    card.append(cover, title, artist, meta);
    card.addEventListener("click", () => playSong(song.originalIndex));
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); playSong(song.originalIndex); } });
    grid.appendChild(card);
  });
}
function updateNowPlaying(song) {
  document.getElementById("nowTitle").textContent = song.title;
  document.getElementById("nowArtist").textContent = song.artist;
  document.getElementById("barTitle").textContent = song.title;
  document.getElementById("barArtist").textContent = song.artist;
  updateListenView(song);
  const mini = document.getElementById("miniCover");
  mini.innerHTML = "";
  if (song.cover) {
    const img = document.createElement("img"); img.src = song.cover; img.alt = "";
    img.onerror = () => { mini.textContent = "♫"; }; mini.appendChild(img);
  } else mini.textContent = "♫";
}
async function playSong(index) {
  if (!songs[index]) return;
  if (currentIndex === index) {
    if (audio.paused) { try { await audio.play(); } catch (error) { showAudioError(); } }
    else audio.pause();
    return;
  }
  currentIndex = index;
  const song = songs[index];
  audio.src = song.file;
  updateNowPlaying(song);
  renderSongs();
  try { await audio.play(); } catch (error) { showAudioError(); }
}
function showAudioError() {
  document.getElementById("nowArtist").textContent = "Could not play file — check the song path";
}
function playNext(direction = 1) {
  if (!songs.length) return;
  const next = currentIndex < 0 ? 0 : (currentIndex + direction + songs.length) % songs.length;
  playSong(next);
}
searchInput.addEventListener("input", renderSongs);
sortSelect.addEventListener("change", renderSongs);
document.getElementById("artistSelect").addEventListener("change", event => { activeArtist = event.target.value; renderArtists(); renderSongs(); });
playBtn.addEventListener("click", async () => {
  if (currentIndex < 0) { if (songs.length) await playSong(0); return; }
  if (audio.paused) { try { await audio.play(); } catch (error) { showAudioError(); } }
  else audio.pause();
});
document.getElementById("prevBtn").addEventListener("click", () => {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else playNext(-1);
});
document.getElementById("nextBtn").addEventListener("click", () => playNext(1));
document.getElementById("volumeBar").addEventListener("input", event => { audio.volume = Number(event.target.value); });
audio.addEventListener("play", () => { playBtn.textContent = "Ⅱ"; playBtn.setAttribute("aria-label","Pause"); document.getElementById("viewPlayBtn").textContent = "Ⅱ"; renderSongs(); });
audio.addEventListener("pause", () => { playBtn.textContent = "▶"; playBtn.setAttribute("aria-label","Play"); document.getElementById("viewPlayBtn").textContent = "▶"; renderSongs(); });
audio.addEventListener("loadedmetadata", () => { document.getElementById("duration").textContent = formatTime(audio.duration); document.getElementById("viewDuration").textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => {
  document.getElementById("currentTime").textContent = formatTime(audio.currentTime);
  document.getElementById("viewCurrentTime").textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    const progress = String(Math.round(audio.currentTime / audio.duration * 1000));
    seekBar.value = progress; document.getElementById("viewSeekBar").value = progress;
  }
});
seekBar.addEventListener("input", () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seekBar.value) / 1000 * audio.duration; });
audio.addEventListener("ended", () => { if (repeatMode === 1) { audio.currentTime = 0; audio.play(); } else if (repeatMode === 2) playNext(1); else { playBtn.textContent = "▶"; renderSongs(); } });
document.getElementById("repeatBtn").addEventListener("click", () => { repeatMode = (repeatMode + 1) % 3; setRepeatButtons(); });
document.getElementById("viewRepeatBtn").addEventListener("click", () => { repeatMode = (repeatMode + 1) % 3; setRepeatButtons(); });
document.getElementById("viewBtn").addEventListener("click", openListenView);
document.getElementById("closeViewBtn").addEventListener("click", () => { document.getElementById("listenView").classList.remove("open"); document.getElementById("listenView").setAttribute("aria-hidden","true"); });
document.getElementById("viewPlayBtn").addEventListener("click", () => playBtn.click());
document.getElementById("viewPrevBtn").addEventListener("click", () => document.getElementById("prevBtn").click());
document.getElementById("viewNextBtn").addEventListener("click", () => document.getElementById("nextBtn").click());
document.getElementById("viewSeekBar").addEventListener("input", event => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value) / 1000 * audio.duration; });

document.getElementById("sidePlay").addEventListener("click", () => playBtn.click());
document.getElementById("sidePrev").addEventListener("click", () => document.getElementById("prevBtn").click());
document.getElementById("sideNext").addEventListener("click", () => document.getElementById("nextBtn").click());
document.getElementById("sideRepeat").addEventListener("click", () => document.getElementById("repeatBtn").click());
document.getElementById("sideView").addEventListener("click", openListenView);
document.querySelectorAll(".genre-pills button").forEach(button => button.addEventListener("click", () => {
  searchInput.value = button.dataset.query; activeArtist = ""; document.getElementById("artistSelect").value = ""; renderSongs();
  document.querySelectorAll(".genre-pills button").forEach(b => b.classList.toggle("active", b === button));
}));
audio.addEventListener("play", () => { document.getElementById("sidePlay").textContent = "Ⅱ"; });
audio.addEventListener("pause", () => { document.getElementById("sidePlay").textContent = "▶"; });
audio.addEventListener("timeupdate", () => {
  document.getElementById("sideCurrent").textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) document.getElementById("sideSeek").value = String(Math.round(audio.currentTime/audio.duration*1000));
});
audio.addEventListener("loadedmetadata", () => { document.getElementById("sideDuration").textContent = formatTime(audio.duration); });
document.getElementById("sideSeek").addEventListener("input", () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(document.getElementById("sideSeek").value)/1000*audio.duration; });

async function loadLibrary() {
  try {
    const libraryUrl = new URL("songs.json", document.baseURI);
    const response = await fetch(libraryUrl, {cache:"no-store"});
    if (!response.ok) throw new Error("songs.json not found");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("songs.json must contain a list");
    songs = data.filter(item => item && item.file).map(item => ({
      title: safeText(item.title, "Untitled track"),
      artist: inferArtist(item),
      // Resolve paths relative to the site, which also works for GitHub project pages.
      file: new URL(item.file, document.baseURI).href,
      cover: item.cover ? new URL(item.cover, document.baseURI).href : "",
      duration: safeText(item.duration, "MP3")
    })).map(song => ({...song, title: cleanTitle(song.title, song.artist)}));
    renderArtists(); setRepeatButtons(); renderSongs();
    if (songs.length === 0) {
      emptyState.hidden = false;
      emptyState.querySelector("h3").textContent = "No songs added yet";
      emptyState.querySelector("p").textContent = "Add audio files to the songs folder, run build_songs.py, then upload songs.json and the songs folder to GitHub.";
    }
  } catch (error) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h3").textContent = "Your music library could not load";
    emptyState.querySelector("p").textContent = "Make sure songs.json is uploaded beside index.html and contains valid JSON. Run build_songs.py after adding songs.";
    trackCount.textContent = "0 TRACKS";
    console.error("Could not load music library:", error);
  }
}
loadLibrary();
