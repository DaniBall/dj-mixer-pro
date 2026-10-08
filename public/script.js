/**
 * Controla los dos platos del mezclador y busca previews de Deezer desde el navegador.
 * El sitio puede alojarse como archivos estáticos: AllOrigins aporta el acceso CORS
 * al catálogo, mientras Web Audio procesa el sonido reproducido por cada plato.
 */
let audioCtx;

// Cada plato conserva su elemento de audio, su cadena de filtros y su estado de mezcla.
const decks = {
    a: { audio: new Audio(), source: null, filterNode: null, gainNode: null, playing: false, muted: false },
    b: { audio: new Audio(), source: null, filterNode: null, gainNode: null, playing: false, muted: false }
};

// Web Audio necesita que el proveedor del preview permita cargar audio entre dominios.
decks.a.audio.crossOrigin = "anonymous";
decks.b.audio.crossOrigin = "anonymous";

/** Crea una única sesión de Web Audio al interactuar con los platos y conecta sus controles. */
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        setupDeckAudio('a');
        setupDeckAudio('b');
        setupCrossfaderAndEQ();
    }
}

/** Conecta el audio del plato a un filtro de paso bajo, una ganancia y la salida de sonido. */
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

/** Vincula volumen, crossfader y filtros con sus nodos; los controles HI/MID/LOW son visuales. */
function setupCrossfaderAndEQ() {
    document.getElementById('vol-a').addEventListener('input', (e) => updateVolumes());
    document.getElementById('vol-b').addEventListener('input', (e) => updateVolumes());
    document.getElementById('crossfader').addEventListener('input', (e) => updateVolumes());

    // La frecuencia se aplica en el instante actual para responder al movimiento del deslizador.
    document.getElementById('filter-a').addEventListener('input', (e) => {
        if (audioCtx) decks.a.filterNode.frequency.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
    document.getElementById('filter-b').addEventListener('input', (e) => {
        if (audioCtx) decks.b.filterNode.frequency.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
}

/** Combina el volumen de cada plato con el crossfader y fuerza ganancia cero si está silenciado. */
function updateVolumes() {
    if (!audioCtx) return;
    const volA = parseFloat(document.getElementById('vol-a').value);
    const volB = parseFloat(document.getElementById('vol-b').value);
    const crossfader = parseFloat(document.getElementById('crossfader').value);

    // En el centro suenan ambos platos; hacia un extremo se atenúa el plato opuesto.
    let gainA = volA * (crossfader < 0 ? 1 : 1 - crossfader);
    let gainB = volB * (crossfader > 0 ? 1 : 1 + crossfader);

    decks.a.gainNode.gain.setValueAtTime(decks.a.muted ? 0 : gainA, audioCtx.currentTime);
    decks.b.gainNode.gain.setValueAtTime(decks.b.muted ? 0 : gainB, audioCtx.currentTime);
}

// Los botones de reproducción comparten la misma lógica para ambos platos.
document.getElementById('play-a').addEventListener('click', () => togglePlay('a'));
document.getElementById('play-b').addEventListener('click', () => togglePlay('b'));

/** Alterna pausa y reproducción del plato y actualiza la animación de su vinilo. */
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

// El mute conserva el volumen seleccionado y recalcula únicamente la ganancia efectiva.
document.getElementById('mute-a').addEventListener('click', () => { decks.a.muted = !decks.a.muted; updateVolumes(); });
document.getElementById('mute-b').addEventListener('click', () => { decks.b.muted = !decks.b.muted; updateVolumes(); });

// Tanto el botón como Enter inician la búsqueda estática a través de AllOrigins.
document.getElementById('search-btn').addEventListener('click', searchMusic);
document.getElementById('search-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchMusic(); });

/** Acepta únicamente URLs HTTPS absolutas para los previews y las carátulas del catálogo. */
function getHttpsUrl(value) {
    if (typeof value !== 'string') return '';
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : '';
    } catch (err) {
        return '';
    }
}

/** Construye una fila con texto y eventos DOM para que los datos remotos no se interpreten como HTML. */
function renderTrackResult(track) {
    const previewUrl = getHttpsUrl(track.preview);
    const coverUrl = getHttpsUrl(track.album?.cover_medium);
    const row = document.createElement('div');
    row.className = 'track-item';

    const description = document.createElement('span');
    const artist = document.createElement('strong');
    artist.textContent = track.artist.name;
    description.appendChild(artist);
    description.appendChild(document.createTextNode(` - ${track.title}`));
    row.appendChild(description);

    // Los listeners capturan las URLs como datos, sin interpolarlas en código onclick.
    const controls = document.createElement('div');
    ['a', 'b'].forEach(deckId => {
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = `Cargar ${deckId.toUpperCase()}`;
        button.addEventListener('click', () => window.loadTrack(deckId, previewUrl, coverUrl));
        controls.appendChild(button);
    });
    row.appendChild(controls);
    return row;
}

/** Busca el catálogo, valida proxy y API, y muestra hasta cinco resultados con preview HTTPS. */
async function searchMusic() {
    const query = document.getElementById('search-input').value.trim();
    const searchButton = document.getElementById('search-btn');
    if (!query || searchButton.disabled) return;

    const resultsDiv = document.getElementById('results');
    resultsDiv.textContent = 'Buscando pistas...';
    searchButton.disabled = true;

    // El límite evita que una caída del proveedor deje el buscador bloqueado indefinidamente.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        // Se codifica primero la consulta de Deezer y después su URL completa para el proxy.
        const targetUrl = new URL('https://api.deezer.com/search');
        targetUrl.searchParams.set('q', query);
        //const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl.href)}`;
        const proxyUrl = `https://herokuapp.com${encodeURIComponent(targetUrl.href)}`;
        const response = await fetch(proxyUrl, { signal: controller.signal });
        if (!response.ok) throw new Error('La petición al proxy ha fallado.');

        const proxyData = await response.json();
        // Un HTTP 200 del proxy puede contener un error HTTP de Deezer en status.http_code.
        if (Number(proxyData?.status?.http_code) !== 200 || typeof proxyData.contents !== 'string') {
            throw new Error('El proxy no ha obtenido una respuesta válida del catálogo.');
        }
        const json = JSON.parse(proxyData.contents);
        if (!json || json.error || !Array.isArray(json.data)) {
            throw new Error('El catálogo ha devuelto un error o una respuesta inesperada.');
        }

        // Algunos resultados carecen de preview; se omiten para no ofrecer botones sin audio.
        const tracks = json.data.filter(track =>
            track && typeof track.title === 'string' &&
            typeof track.artist?.name === 'string' && getHttpsUrl(track.preview)
        ).slice(0, 5);

        resultsDiv.replaceChildren();
        if (tracks.length === 0) {
            resultsDiv.textContent = 'No se encontraron canciones con preview disponible.';
            return;
        }
        tracks.forEach(track => resultsDiv.appendChild(renderTrackResult(track)));
    } catch (err) {
        resultsDiv.textContent = err.name === 'AbortError'
            ? 'La búsqueda ha tardado demasiado. Inténtalo de nuevo.'
            : 'No se pudo consultar la música. Inténtalo de nuevo más tarde.';
    } finally {
        clearTimeout(timeoutId);
        searchButton.disabled = false;
    }
}

/** Carga el preview y su carátula en un plato, reinicia su estado y aplica los volúmenes actuales. */
window.loadTrack = function (deckId, previewUrl, coverUrl) {
    initAudio();
    const deck = decks[deckId];
    deck.audio.src = previewUrl;
    document.getElementById(`cover-${deckId}`).style.backgroundImage = coverUrl ? `url('${coverUrl}')` : 'none';

    // Al sustituir la pista se detiene la animación hasta que el usuario pulse Play/Cue.
    deck.playing = false;
    document.getElementById(`vinyl-${deckId}`).classList.remove('spinning');
    updateVolumes();
};
