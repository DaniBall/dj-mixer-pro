let audioCtx;
const decks = {
    a: { audio: new Audio(), source: null, filterNode: null, gainNode: null, playing: false, muted: false },
    b: { audio: new Audio(), source: null, filterNode: null, gainNode: null, playing: false, muted: false }
};

// Permitir la carga cruzada de los archivos de audio de Deezer
decks.a.audio.crossOrigin = "anonymous";
decks.b.audio.crossOrigin = "anonymous";

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        setupDeckAudio('a');
        setupDeckAudio('b');
        setupCrossfaderAndEQ();
    }
}

function setupDeckAudio(deckId) {
    const deck = decks[deckId];
    deck.source = audioCtx.createMediaElementSource(deck.audio);
    deck.filterNode = audioCtx.createBiquadFilter();
    deck.filterNode.type = 'lowpass';
    deck.filterNode.frequency.value = 20000;

    deck.gainNode = audioCtx.createGain();
    deck.gainNode.gain.value = 0.8;

    deck.source.connect(deck.filterNode);
    deck.filterNode.connect(deck.gainNode);
    deck.gainNode.connect(audioCtx.destination);
}

function setupCrossfaderAndEQ() {
    // Escucha de controles en tiempo real
    document.getElementById('vol-a').addEventListener('input', (e) => updateVolumes());
    document.getElementById('vol-b').addEventListener('input', (e) => updateVolumes());
    document.getElementById('crossfader').addEventListener('input', (e) => updateVolumes());

    document.getElementById('filter-a').addEventListener('input', (e) => {
        if (audioCtx) decks.a.filterNode.frequency.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
    document.getElementById('filter-b').addEventListener('input', (e) => {
        if (audioCtx) decks.b.filterNode.frequency.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
}

function updateVolumes() {
    if (!audioCtx) return;
    const volA = parseFloat(document.getElementById('vol-a').value);
    const volB = parseFloat(document.getElementById('vol-b').value);
    const crossfader = parseFloat(document.getElementById('crossfader').value);

    // Lógica de cálculo del Crossfader
    let gainA = volA * (crossfader < 0 ? 1 : 1 - crossfader);
    let gainB = volB * (crossfader > 0 ? 1 : 1 + crossfader);

    decks.a.gainNode.gain.setValueAtTime(decks.a.muted ? 0 : gainA, audioCtx.currentTime);
    decks.b.gainNode.gain.setValueAtTime(decks.b.muted ? 0 : gainB, audioCtx.currentTime);
}

// Botones Play/Cue
document.getElementById('play-a').addEventListener('click', () => togglePlay('a'));
document.getElementById('play-b').addEventListener('click', () => togglePlay('b'));

function togglePlay(deckId) {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const deck = decks[deckId];
    const vinyl = document.getElementById(`vinyl-${deckId}`);

    if (deck.playing) {
        deck.audio.pause();
        vinyl.classList.remove('spinning');
    } else {
        if (deck.audio.src) {
            deck.audio.play();
            vinyl.classList.add('spinning');
        }
    }
    deck.playing = !deck.playing;
}

// Botones Mute
document.getElementById('mute-a').addEventListener('click', () => { decks.a.muted = !decks.a.muted; updateVolumes(); });
document.getElementById('mute-b').addEventListener('click', () => { decks.b.muted = !decks.b.muted; updateVolumes(); });

// Buscador integrado con Proxy CORS AllOrigins
document.getElementById('search-btn').addEventListener('click', searchMusic);
document.getElementById('search-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchMusic(); });

async function searchMusic() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "Buscando pistas...";

    try {
        const proxyUrl = 'https://allorigins.win';
        const targetUrl = encodeURIComponent(`https://deezer.com{query}`);

        const response = await fetch(`${proxyUrl}${targetUrl}`);
        const data = await response.json();
        const json = JSON.parse(data.contents);

        resultsDiv.innerHTML = "";
        if (!json.data || json.data.length === 0) {
            resultsDiv.innerHTML = "No se encontraron canciones.";
            return;
        }

        json.data.slice(0, 5).forEach(track => {
            const row = document.createElement('div');
            row.className = 'track-item';
            row.innerHTML = `
                <span><strong>${track.artist.name}</strong> - ${track.title}</span>
                <div>
                    <button class="btn" onclick="loadTrack('a', '${track.preview}', '${track.album.cover_medium}')">Cargar A</button>
                    <button class="btn" onclick="loadTrack('b', '${track.preview}', '${track.album.cover_medium}')">Cargar B</button>
                </div>
            `;
            resultsDiv.appendChild(row);
        });
    } catch (err) {
        resultsDiv.innerHTML = "Error al conectar con la API de música.";
    }
}

window.loadTrack = function (deckId, previewUrl, coverUrl) {
    initAudio();
    const deck = decks[deckId];
    deck.audio.src = previewUrl;
    document.getElementById(`cover-${deckId}`).style.backgroundImage = `url('${coverUrl}')`;

    // Reset de estado al cargar nueva canción
    deck.playing = false;
    document.getElementById(`vinyl-${deckId}`).classList.remove('spinning');
    updateVolumes();
};
