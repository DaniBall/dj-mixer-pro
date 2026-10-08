// Web Audio Context setup
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Decks Configuration
const decks = {
    a: { audio: new Audio(), source: null, gainNode: null, filterNode: null, playing: false, muted: false, url: '' },
    b: { audio: new Audio(), source: null, gainNode: null, filterNode: null, playing: false, muted: false, url: '' }
};

// Crossfader and master EQ variables
let crossfaderVal = 0;
let eqNodeHi, eqNodeMid, eqNodeLow;

function setupDeckAudioNode(deckKey) {
    initAudio();
    const deck = decks[deckKey];
    if (!deck.source) {
        deck.audio.crossOrigin = "anonymous";
        deck.source = audioCtx.createMediaElementSource(deck.audio);
        
        // Channel EQ / Filters
        deck.filterNode = audioCtx.createBiquadFilter();
        deck.filterNode.type = 'lowpass';
        deck.filterNode.frequency.setValueAtTime(20000, audioCtx.currentTime);
        
        deck.gainNode = audioCtx.createGain();
        deck.gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        
        // Global Three-Band EQ emulation setup on master if not done
        if (!eqNodeHi) {
            eqNodeHi = audioCtx.createBiquadFilter(); eqNodeHi.type = 'highshelf'; eqNodeHi.frequency.setValueAtTime(3000, audioCtx.currentTime);
            eqNodeMid = audioCtx.createBiquadFilter(); eqNodeMid.type = 'peaking'; eqNodeMid.frequency.setValueAtTime(1000, audioCtx.currentTime); eqNodeMid.Q.setValueAtTime(1, audioCtx.currentTime);
            eqNodeLow = audioCtx.createBiquadFilter(); eqNodeLow.type = 'lowshelf'; eqNodeLow.frequency.setValueAtTime(250, audioCtx.currentTime);
            
            eqNodeHi.connect(eqNodeMid);
            eqNodeMid.connect(eqNodeLow);
            eqNodeLow.connect(audioCtx.destination);
        }
        
        // Connect Node chain
        deck.source.connect(deck.filterNode);
        deck.filterNode.connect(deck.gainNode);
        deck.gainNode.connect(eqNodeHi);
    }
}

function updateVolumes() {
    // Crossfader logic (Constant power curve approximation or simple linear)
    let gainA = parseFloat(document.getElementById('vol-a').value);
    let gainB = parseFloat(document.getElementById('vol-b').value);
    
    if (crossfaderVal < 0) {
        gainB *= (1 + crossfaderVal);
    } else if (crossfaderVal > 0) {
        gainA *= (1 - crossfaderVal);
    }
    
    if (decks.a.gainNode && !decks.a.muted) decks.a.gainNode.gain.setValueAtTime(gainA, audioCtx.currentTime);
    if (decks.b.gainNode && !decks.b.muted) decks.b.gainNode.gain.setValueAtTime(gainB, audioCtx.currentTime);
}

// UI Elements Event Listeners
document.getElementById('btn-search').addEventListener('click', performSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

function performSearch() {
    const q = document.getElementById('search-input').value;
    if(!q) return;
    
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(res => {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '';
            if(!res.data || res.data.length === 0) {
                resultsDiv.innerHTML = '<div style="padding:10px;color:#aaa;">No se encontraron canciones.</div>';
                return;
            }
            res.data.forEach(track => {
                if(!track.preview) return; // Skip if no preview sound available
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `
                    <img src="${track.album.cover_medium}" alt="cover">
                    <div class="result-details">
                        <div class="result-title">${track.title}</div>
                        <div class="result-artist">${track.artist.name} - ${track.album.title}</div>
                    </div>
                    <div class="load-buttons">
                        <button class="btn-load-a" data-url="${track.preview}" data-title="${track.title}" data-artist="${track.artist.name}" data-img="${track.album.cover_medium}">Cargar A</button>
                        <button class="btn-load-b" data-url="${track.preview}" data-title="${track.title}" data-artist="${track.artist.name}" data-img="${track.album.cover_medium}">Cargar B</button>
                    </div>
                `;
                resultsDiv.appendChild(item);
            });
            
            // Add click events to newly created load buttons
            document.querySelectorAll('.btn-load-a').forEach(b => b.addEventListener('click', (e) => loadTrack('a', e.target.dataset)));
            document.querySelectorAll('.btn-load-b').forEach(b => b.addEventListener('click', (e) => loadTrack('b', e.target.dataset)));
        });
}

function loadTrack(deckKey, data) {
    setupDeckAudioNode(deckKey);
    const deck = decks[deckKey];
    
    deck.audio.src = data.url;
    deck.url = data.url;
    deck.audio.load();
    
    document.getElementById(`info-${deckKey}`).innerHTML = `${data.title}<br><span style="font-size:11px;color:#888;">${data.artist}</span>`;
    document.getElementById(`art-${deckKey}`).style.backgroundImage = `url('${data.img}')`;
    
    // Reset state
    deck.playing = false;
    document.getElementById(`btn-play-${deckKey}`).classList.remove('active-play');
    document.getElementById(`btn-play-${deckKey}`).innerText = 'PLAY';
    document.getElementById(`vinyl-${deckKey}`).classList.remove('spinning');
    updateVolumes();
}

// Play / Pause handling
function togglePlay(deckKey) {
    setupDeckAudioNode(deckKey);
    const deck = decks[deckKey];
    if(!deck.url) return;
    
    if(deck.playing) {
        deck.audio.pause();
        deck.playing = false;
        document.getElementById(`btn-play-${deckKey}`).classList.remove('active-play');
        document.getElementById(`btn-play-${deckKey}`).innerText = 'PLAY';
        document.getElementById(`vinyl-${deckKey}`).classList.remove('spinning');
    } else {
        deck.audio.play().then(() => {
            deck.playing = true;
            document.getElementById(`btn-play-${deckKey}`).classList.add('active-play');
            document.getElementById(`btn-play-${deckKey}`).innerText = 'PAUSE';
            document.getElementById(`vinyl-${deckKey}`).classList.add('spinning');
        }).catch(err => console.log("Audio play error:", err));
    }
}

document.getElementById('btn-play-a').addEventListener('click', () => togglePlay('a'));
document.getElementById('btn-play-b').addEventListener('click', () => togglePlay('b'));

// Mute handling
function toggleMute(deckKey) {
    const deck = decks[deckKey];
    deck.muted = !deck.muted;
    const btn = document.getElementById(`btn-mute-${deckKey}`);
    if(deck.muted) {
        btn.classList.add('active-mute');
        if(deck.gainNode) deck.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
        btn.classList.remove('active-mute');
        updateVolumes();
    }
}
document.getElementById('btn-mute-a').addEventListener('click', () => toggleMute('a'));
document.getElementById('btn-mute-b').addEventListener('click', () => toggleMute('b'));

// Volume controls
document.getElementById('vol-a').addEventListener('input', (e) => {
    document.getElementById('val-vol-a').innerText = Math.round(e.target.value * 100) + '%';
    updateVolumes();
});
document.getElementById('vol-b').addEventListener('input', (e) => {
    document.getElementById('val-vol-b').innerText = Math.round(e.target.value * 100) + '%';
    updateVolumes();
});

// FX Filter controls
document.getElementById('lpf-a').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-lpf-a').innerText = val >= 19000 ? 'OFF' : val + ' Hz';
    if(decks.a.filterNode) decks.a.filterNode.frequency.setValueAtTime(val, audioCtx.currentTime);
});
document.getElementById('lpf-b').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-lpf-b').innerText = val >= 19000 ? 'OFF' : val + ' Hz';
    if(decks.b.filterNode) decks.b.filterNode.frequency.setValueAtTime(val, audioCtx.currentTime);
});

// Mixer Controls (Crossfader)
document.getElementById('crossfader').addEventListener('input', (e) => {
    crossfaderVal = parseFloat(e.target.value);
    updateVolumes();
});

// Mixer EQ Controls
document.getElementById('eq-hi').addEventListener('input', (e) => {
    initAudio(); if(eqNodeHi) eqNodeHi.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
});
document.getElementById('eq-mid').addEventListener('input', (e) => {
    initAudio(); if(eqNodeMid) eqNodeMid.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
});
document.getElementById('eq-low').addEventListener('input', (e) => {
    initAudio(); if(eqNodeLow) eqNodeLow.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
});

// Audio loops back when complete
decks.a.audio.addEventListener('ended', () => { decks.a.audio.currentTime = 0; decks.a.audio.play(); });
decks.b.audio.addEventListener('ended', () => { decks.b.audio.currentTime = 0; decks.b.audio.play(); });
