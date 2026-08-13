/* ===== Truck Wala — 3D Coverflow Music Player ===== */

// ===== Song Data =====
const songs = [
    {
        title: "Saaton Janam Main Tere",
        artist: "Kumar Sanu & Alka Yagnik",
        film: "Dilwale (1994)",
        duration: "6:02",
        durationSec: 362,
        art: "assets/album2.png",
    },
    {
        title: "Horn OK Please",
        artist: "Sukhwinder Singh",
        film: "Horn OK Pleassss (2009)",
        duration: "4:35",
        durationSec: 275,
        art: "assets/album1.png",
    },
    {
        title: "Highway Melodies",
        artist: "Altaf Raja",
        film: "Road Trip Anthems",
        duration: "5:12",
        durationSec: 312,
        art: "assets/album_highway.jpg",
    },
    {
        title: "Neele Neele Ambar Par",
        artist: "Kishore Kumar",
        film: "Kalaakaar (1983)",
        duration: "5:45",
        durationSec: 345,
        art: "assets/album4.png",
    },
    {
        title: "Chalte Chalte Mere Yeh Geet",
        artist: "Kishore Kumar",
        film: "Chalte Chalte (1976)",
        duration: "4:58",
        durationSec: 298,
        art: "assets/album5.png",
    }
];

// ===== State =====
let currentIndex = 2; // center card
let isPlaying = false;
let isMuted = false;
let progress = 0;
let progressInterval = null;

// ===== Web Audio API Sound Generator for Real Audio Feedback =====
let audioCtx = null;
let currentOsc = null;
let currentGain = null;

function playMelodyTone(songIndex) {
    if (isMuted) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        stopMelodyTone();

        const baseFreqs = [261.63, 293.66, 329.63, 392.00, 440.00];
        const freq = baseFreqs[songIndex % baseFreqs.length];

        currentGain = audioCtx.createGain();
        currentGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        currentOsc = audioCtx.createOscillator();
        currentOsc.type = 'triangle';
        currentOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        currentOsc.connect(currentGain);
        currentGain.connect(audioCtx.destination);
        currentOsc.start();
    } catch(e) {
        // Fallback for browsers blocking audio before gesture
    }
}

function stopMelodyTone() {
    if (currentGain && audioCtx) {
        currentGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        setTimeout(() => {
            if (currentOsc) {
                try { currentOsc.stop(); } catch(e) {}
                currentOsc = null;
            }
        }, 120);
    }
}

// ===== DOM Elements =====
const carousel = document.getElementById('carousel');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeBtn = document.getElementById('volumeBtn');
const miniArt = document.getElementById('miniArt');
const miniArtist = document.getElementById('miniArtist');
const miniTitle = document.getElementById('miniTitle');
const miniProgress = document.getElementById('miniProgress');
const miniProgressBar = document.getElementById('miniProgressBar');
const miniTime = document.getElementById('miniTime');

// ===== Spotify Web API Integration =====
const token = 'BQAfTMGFbQgb7Nq03JEUg4NIToiNoNKDvaLhs-JkNd6Y2AIfE2ZrptWQJmSdSdIOKxqhFu4Wtl7aRYBUP_pUxqNHKW9SPsEfMWtZugEVtU1_w_fc80OD2oIiQDqDt92tZjLNYDTgxgN3cZN7Sf19o1RBQft2iC1yMJHZjW2yDYVZ7A2885OYc9-EZ9M_MquJGMRUC8WnSaERUvoCp5srBRYHGY56EixT45KRHK_yvHU1LdMC7okqN1MSH1KyezdiXc067slL5Whx_LK9Ce0KhPLFYmsvHRb4bsO_HOh5I5xvspt0BUpyU1sLimJsZdYiiD1d-sxRQ5U';

const tracksUri = [
  'spotify:track:2ydbueJ96gosjR7SZaLTlm',
  'spotify:track:2aGVcyuMXfjKZcSbn1LK2N',
  'spotify:track:0kzxkJMY4v37c1ZeDa6tTK',
  'spotify:track:18dts4OqWOQTGFlMTGodkk',
  'spotify:track:6H7fLdt0AeWpuxUKXuXWrx'
];

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

async function getSpotifyTracksByUri() {
  const trackIds = tracksUri.map(uri => uri.split(':').pop()).join(',');
  const data = await fetchWebApi(`v1/tracks?ids=${trackIds}`, 'GET');
  return data ? data.tracks : null;
}

async function createPlaylist(tracksUri) {
  try {
    const playlist = await fetchWebApi('v1/me/playlists', 'POST', {
      "name": "My top tracks playlist",
      "description": "Playlist created by Highway Music Player",
      "public": false
    });
    if (playlist && playlist.id) {
      await fetchWebApi(`v1/playlists/${playlist.id}/items?uris=${tracksUri.join(',')}`, 'POST');
      console.log('Successfully created Spotify playlist:', playlist.name, playlist.id);
      return playlist;
    }
  } catch(e) {
    console.log('Playlist creation notice:', e.message);
  }
}

async function loadSpotifyData() {
  try {
    // 1. Fetch exact track details for the 5 Spotify URIs
    let fetchedTracks = await getSpotifyTracksByUri();
    
    // Fallback to top tracks if specific tracks endpoint fails
    if (!fetchedTracks || fetchedTracks.length === 0 || !fetchedTracks[0]) {
      const topData = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
      fetchedTracks = topData ? topData.items : null;
    }

    if (fetchedTracks && fetchedTracks.length > 0 && fetchedTracks[0]) {
      songs.length = 0;
      fetchedTracks.forEach((track) => {
        if (!track) return;
        const sec = Math.floor(track.duration_ms / 1000);
        songs.push({
          title: track.name,
          artist: track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist',
          film: track.album ? track.album.name : 'Spotify Single',
          duration: formatTime(sec),
          durationSec: sec,
          art: (track.album && track.album.images && track.album.images[0]) ? track.album.images[0].url : 'assets/album2.png'
        });
      });
      console.log('Successfully loaded Spotify tracks into player:', songs);
      buildCarousel();
      updateMiniPlayer();

      // Create playlist in background
      createPlaylist(tracksUri);
    }
  } catch (err) {
    console.log('Spotify API Notice (using fallback playlist):', err.message);
  }
}

async function fetchServerPlaylist() {
    try {
        const res = await fetch('/api/playlist');
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0 && songs.length === 0) {
                songs.push(...data);
                buildCarousel();
                updateMiniPlayer();
            }
        }
    } catch(e) {}
}

// ===== Init =====
function init() {
    buildCarousel();
    updateMiniPlayer();
    attachEvents();
    fetchServerPlaylist();
    loadSpotifyData();
}

// ===== Build Carousel Cards =====
function buildCarousel() {
    carousel.innerHTML = '';
    songs.forEach((song, i) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = i;
        card.innerHTML = `
            <img class="card__image" src="${song.art}" alt="${song.title}" loading="lazy">
            <div class="card__info">
                <div class="card__artist">${song.artist}</div>
                <div class="card__title">${song.title}</div>
                <div class="card__film">${song.film}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            goToCard(i);
        });
        carousel.appendChild(card);
    });
    positionCards();
}

// ===== Position Cards in Coverflow =====
function positionCards() {
    const cards = carousel.querySelectorAll('.card');
    cards.forEach((card, i) => {
        let pos = i - currentIndex + 2; // center is position 2
        if (pos < -1) pos = -1;
        if (pos > 5) pos = 5;
        card.setAttribute('data-pos', pos);
    });
}

// ===== Navigate to Card =====
function goToCard(index) {
    currentIndex = index;
    positionCards();
    updateMiniPlayer();
    progress = 0;
    updateProgressBar();
    
    // Auto-start playback on card click
    isPlaying = true;
    document.body.classList.add('playing');
    if (playBtn) playBtn.setAttribute('aria-label', 'Pause');
    startProgress();
    playMelodyTone(currentIndex);
}

// ===== Next / Previous =====
function nextCard() {
    const next = (currentIndex + 1) % songs.length;
    goToCard(next);
}

function prevCard() {
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    goToCard(prev);
}

// ===== Play / Pause =====
function togglePlay() {
    isPlaying = !isPlaying;
    document.body.classList.toggle('playing', isPlaying);
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    if (isPlaying) {
        startProgress();
        playMelodyTone(currentIndex);
    } else {
        stopProgress();
        stopMelodyTone();
    }
}

// ===== Mute / Unmute Volume =====
function toggleVolume() {
    isMuted = !isMuted;
    if (volumeBtn) {
        volumeBtn.classList.toggle('is-muted', isMuted);
        volumeBtn.setAttribute('aria-pressed', isMuted);
    }
    if (isMuted) {
        stopMelodyTone();
    } else if (isPlaying) {
        playMelodyTone(currentIndex);
    }
}

// ===== Progress Simulation =====
function startProgress() {
    stopProgress();
    const song = songs[currentIndex];
    const totalSec = song.durationSec;

    progressInterval = setInterval(() => {
        const currentSec = (progress / 100) * totalSec;
        if (currentSec >= totalSec) {
            nextCard();
            return;
        }
        progress += (100 / totalSec) * 0.1;
        progress = Math.min(progress, 100);
        updateProgressBar();
    }, 100);
}

function stopProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateProgressBar() {
    const song = songs[currentIndex];
    const currentSec = (progress / 100) * song.durationSec;
    if (miniProgress) {
        miniProgress.style.width = progress + '%';
    }
    if (miniTime) {
        miniTime.textContent = `${formatTime(currentSec)} / ${song.duration}`;
    }
}

// ===== Seek Bar Click =====
function handleSeekClick(e) {
    if (!miniProgressBar) return;
    const rect = miniProgressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    progress = percentage;
    updateProgressBar();
}

// ===== Update Mini Player =====
function updateMiniPlayer() {
    const song = songs[currentIndex];
    if (miniArt) miniArt.src = song.art;
    if (miniArtist) miniArtist.textContent = song.artist;
    if (miniTitle) miniTitle.textContent = song.title;
    updateProgressBar();
}

// ===== Events =====
function attachEvents() {
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (prevBtn) prevBtn.addEventListener('click', prevCard);
    if (nextBtn) nextBtn.addEventListener('click', nextCard);
    if (volumeBtn) volumeBtn.addEventListener('click', toggleVolume);

    if (miniProgressBar) {
        miniProgressBar.addEventListener('click', handleSeekClick);
    }

    // Keyboard
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextCard();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevCard();
                break;
            case 'KeyM':
                toggleVolume();
                break;
        }
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextCard();
            else prevCard();
        }
    }, { passive: true });
}

// ===== Start =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Global user gesture audio unlock
document.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });

// ===== Fullscreen Handler =====
const fullscreenBtn = document.getElementById('fullscreenBtn');

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Fullscreen error: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function updateFullscreenIcon() {
    if (!fullscreenBtn) return;
    const isFS = !!document.fullscreenElement;
    const iconExpand = fullscreenBtn.querySelector('.icon-expand');
    const iconCompress = fullscreenBtn.querySelector('.icon-compress');
    if (iconExpand) iconExpand.style.display = isFS ? 'none' : 'block';
    if (iconCompress) iconCompress.style.display = isFS ? 'block' : 'none';
    fullscreenBtn.setAttribute('aria-pressed', isFS);
}

if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
}
document.addEventListener('fullscreenchange', updateFullscreenIcon);

// ===== Spotify Embed Modal Handler =====
const spotifyEmbedBtn = document.getElementById('spotifyEmbedBtn');
const spotifyEmbedModal = document.getElementById('spotifyEmbedModal');
const closeSpotifyEmbed = document.getElementById('closeSpotifyEmbed');

function toggleSpotifyEmbed() {
    if (spotifyEmbedModal) {
        spotifyEmbedModal.classList.toggle('is-active');
    }
}

if (spotifyEmbedBtn) {
    spotifyEmbedBtn.addEventListener('click', toggleSpotifyEmbed);
}
if (closeSpotifyEmbed) {
    closeSpotifyEmbed.addEventListener('click', () => {
        if (spotifyEmbedModal) spotifyEmbedModal.classList.remove('is-active');
    });
}

// ===== Clock & Calendar Widget =====
const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthsFull = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    const hoursEl = document.getElementById('clockHours');
    const minutesEl = document.getElementById('clockMinutes');
    const ampmEl = document.getElementById('clockAmPm');
    const dayEl = document.getElementById('clockDay');
    const dateNumEl = document.getElementById('clockDateNum');
    const monthEl = document.getElementById('clockMonth');
    const yearEl = document.getElementById('clockYear');

    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (ampmEl) ampmEl.textContent = ampm;

    if (dayEl) dayEl.textContent = englishDays[now.getDay()].toUpperCase();
    if (dateNumEl) dateNumEl.textContent = now.getDate().toString().padStart(2, '0');
    if (monthEl) monthEl.textContent = monthsFull[now.getMonth()];
    if (yearEl) yearEl.textContent = now.getFullYear();
}

updateClock();
setInterval(updateClock, 1000);

// ===== Firebase Initialization & Realtime Presence Tracking =====
const firebaseConfig = {
  apiKey: "AIzaSyD8_sF3bLNGNk-Z0hh_97mdGs-mKa-w98M",
  authDomain: "musicplayer-e4df6.firebaseapp.com",
  databaseURL: "https://musicplayer-e4df6-default-rtdb.firebaseio.com",
  projectId: "musicplayer-e4df6",
  storageBucket: "musicplayer-e4df6.firebasestorage.app",
  messagingSenderId: "915531756075",
  appId: "1:915531756075:web:d35baec2baef4dc515f06e",
  measurementId: "G-RPS6EF5D4W"
};

if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    if (firebase.analytics) firebase.analytics();

    const activeUsersCountEl = document.getElementById('activeUsersCount');

    // 1. Firestore Realtime Snapshot Listener
    if (firebase.firestore) {
      try {
        const firestore = firebase.firestore();
        const sessionRef = firestore.collection("active_sessions").doc();
        
        sessionRef.set({
          online: true,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(()=>{});

        window.addEventListener('beforeunload', () => {
          sessionRef.delete().catch(()=>{});
        });

        firestore.collection("active_sessions").onSnapshot((snapshot) => {
          if (snapshot && activeUsersCountEl) {
            const count = Math.max(1, snapshot.size);
            activeUsersCountEl.textContent = count.toLocaleString();
          }
        }, (err) => {
          console.log("Firestore snapshot notice:", err.message);
        });
      } catch(e) {}
    }

    // 2. Realtime Database Presence Listener
    if (firebase.database) {
      try {
        const db = firebase.database();
        const connectedRef = db.ref(".info/connected");
        const presenceRef = db.ref("active_listeners");

        connectedRef.on("value", (snap) => {
          if (snap.val() === true) {
            const myRef = presenceRef.push();
            myRef.onDisconnect().remove();
            myRef.set(true);
          }
        });

        presenceRef.on("value", (snap) => {
          const liveCount = snap.numChildren();
          if (activeUsersCountEl && liveCount > 0) {
            activeUsersCountEl.textContent = liveCount.toLocaleString();
          }
        });
      } catch (dbErr) {}
    }
  } catch(err) {
    console.log("Firebase setup notice:", err.message);
  }
}
