const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Update ukuran buaya saat resize (kalau sudah ada)
    if (typeof croc !== 'undefined' && getCrocSize) {
        const size = getCrocSize();
        croc.width = size.width;
        croc.height = size.height;
    }
}
window.addEventListener('resize', resizeCanvas);

// ─── Assets ───────────────────────────────────────────────
const assets = {
    crocs: [], // Array untuk buaya level 0-4
    cloud: new Image(),
    rainbow: new Image(),
    petir: new Image(),
    bgs: [],
    mbgs: []
};

const BG_PREFIX = ['background', 'background2', 'background3', 'background4', 'background5', 'background6'];
const MIRROR_PREFIX = ['mirrorbackground', 'mirrorbackground2', 'mirrorbackground3', 'mirrorbackground4', 'mirrorbackground5', 'mirrorbackground6'];

for(let i=0; i<6; i++) {
    assets.bgs.push(new Image());
    assets.mbgs.push(new Image());
}

for(let i=0; i<5; i++) {
    assets.crocs.push(new Image());
}

let currentBgIdx = 0; // index ke BG array

assets.crocs[0].src = 'img/buaya.png';
for(let i=1; i<=4; i++) {
    assets.crocs[i].src = `img/buaya${i}.png`;
}
assets.cloud.src = 'img/awan.png';
assets.rainbow.src = 'img/pelangi.png';
assets.petir.src = 'img/Petir.png';

let assetsLoaded = 0;
const totalAssets = 5 + 3 + 12; // 5 crocs + cloud, rainbow, petir + 6 bgs + 6 mbgs

const checkLoad = () => {
    assetsLoaded++;
    if (assetsLoaded >= totalAssets && gameState === 'LOADING') {
        gameState = 'START';
    }
};
const handleLoadError = () => { console.error("Asset load failed"); checkLoad(); };

for(let i=0; i<5; i++) {
    assets.crocs[i].onload = checkLoad; 
    assets.crocs[i].onerror = handleLoadError;
}
assets.cloud.onload = checkLoad; assets.cloud.onerror = handleLoadError;
assets.rainbow.onload = checkLoad; assets.rainbow.onerror = handleLoadError;
assets.petir.onload = checkLoad; assets.petir.onerror = handleLoadError;

for(let i=0; i<6; i++) {
    assets.bgs[i].onload = checkLoad; assets.bgs[i].onerror = handleLoadError;
    assets.bgs[i].src = `img/${BG_PREFIX[i]}.png`;
    
    assets.mbgs[i].onload = checkLoad; assets.mbgs[i].onerror = handleLoadError;
    assets.mbgs[i].src = `img/${MIRROR_PREFIX[i]}.png`;
}


// ─── Music & Mute ─────────────────────────────────────────
const bgMusic = new Audio('music/backsound.mp3');
bgMusic.loop   = true;
bgMusic.volume = 0.5;

let isMuted = false;
const muteBtn = document.getElementById('mute-btn');

muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    bgMusic.muted  = isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
});

// ─── Difficulty Settings ───────────────────────────────────
const DIFFICULTIES = {
    easy:   { scrollSpeed: 3,   spawnRate: 110, doubleChance: 0.05, gravity: 0.33, jumpStrength: -6.5 },
    normal: { scrollSpeed: 4,   spawnRate: 80,  doubleChance: 0.15, gravity: 0.40, jumpStrength: -7.0 },
    hard:   { scrollSpeed: 5.5, spawnRate: 55,  doubleChance: 0.30, gravity: 0.48, jumpStrength: -7.5 }
};

let selectedDiff = 'normal';
let SCROLL_SPEED   = DIFFICULTIES.normal.scrollSpeed;
let SPAWN_RATE     = DIFFICULTIES.normal.spawnRate;
let DOUBLE_CHANCE  = DIFFICULTIES.normal.doubleChance;
let GRAVITY_VAL    = DIFFICULTIES.normal.gravity;
let JUMP_STRENGTH  = DIFFICULTIES.normal.jumpStrength;

// Difficulty button listeners
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDiff = btn.dataset.diff;
    });
});

// ─── Game State ────────────────────────────────────────────
let gameState = 'LOADING'; // LOADING | START | PLAYING | GAME_OVER | WIN
let frames    = 0;
let score     = 0;          // score berdasarkan jarak (frame)
let obstacles = [];

// ─── Crocodile ─────────────────────────────────────────────
// Ukuran buaya responsive terhadap lebar layar
function getCrocSize() {
    const w = canvas.width;
    if (w < 480) return { width: 90, height: 65 };
    if (w < 768) return { width: 130, height: 94 };
    return { width: 180, height: 130 };
}

const croc = {
    x: 0,
    y: 0,
    width:  180,
    height: 130,
    velocity: 0,

    reset() {
        const size    = getCrocSize();
        this.width    = size.width;
        this.height   = size.height;
        this.x        = canvas.width * 0.2;
        this.y        = canvas.height / 2;
        this.velocity = 0;
    },

    draw() {
        // Upgrade croc setiap pergantian background (max index 4)
        let crocLevel = Math.min(currentBgIdx, 4);
        let activeCroc = assets.crocs[crocLevel];

        if (activeCroc && activeCroc.complete && activeCroc.naturalWidth !== 0) {
            ctx.drawImage(activeCroc, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },

    update() {
        this.velocity += GRAVITY_VAL;
        this.y        += this.velocity;

        // Batas lantai (bawah)
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
        }
        
        // Batas langit (atas)
        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },

    jump() { this.velocity = JUMP_STRENGTH; }
};

// ─── Obstacles ─────────────────────────────────────────────
function spawnObstacle(offsetX = 0) {
    // Ukuran awan konstan / standar sebagai basis
    const scale = Math.min(canvas.width / 800, 1);
    let baseWidth  = (120 + Math.random() * 60) * Math.max(scale, 0.6);
    let baseHeight = baseWidth * 0.6;
    let yPos       = Math.random() * (canvas.height - baseHeight);
    
    // Tentukan tipe obstacle
    let type = 'cloud';
    if (Math.random() < 0.25) {
        // 25% chance of special obstacle
        if (currentBgIdx === 1 || currentBgIdx === 3) {
            type = 'lightning'; // bg2 dan bg4
        } else {
            type = 'rainbow';
        }
    }

    let spawnX = canvas.width + offsetX;

    if (type === 'lightning') {
        // Petir menggunakan ukuran natural (proporsi awan, disamakan dulu kotaknya)
        obstacles.push({ type: 'lightning', x: spawnX, y: yPos, width: baseWidth, height: baseHeight });
    } else if (type === 'rainbow') {
        // Rainbow ukurannya kurang lebih mirip awan base tapi di-render beda
        obstacles.push({ type: 'rainbow', x: spawnX, y: yPos, width: baseWidth, height: baseHeight });
    } else {
        obstacles.push({ type: 'cloud', x: spawnX, y: yPos, width: baseWidth, height: baseHeight });
    }
}

function drawObstacles() {
    for (let obs of obstacles) {
        if (obs.type === 'rainbow' && assets.rainbow.complete && assets.rainbow.naturalWidth !== 0 && assets.cloud.complete) {
            // Gambar Pelangi Mandiri
            let rWidth = obs.width * 1.5; 
            let rHeight = obs.height * 1.5;
            let rX = obs.x;
            let rY = obs.y; 
            ctx.drawImage(assets.rainbow, rX, rY, rWidth, rHeight);

            // Awan kecil di ujung kaki kiri pelangi
            ctx.drawImage(assets.cloud, rX - obs.width*0.2, rY + rHeight*0.6, obs.width*0.8, obs.height*0.8);
            // Awan kecil di ujung kaki kanan pelangi
            ctx.drawImage(assets.cloud, rX + rWidth - rWidth*0.35, rY + rHeight*0.6, obs.width*0.8, obs.height*0.8);
        } else if (obs.type === 'lightning' && assets.petir.complete && assets.petir.naturalWidth !== 0) {
            // Gambar Petir
            ctx.drawImage(assets.petir, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'cloud' && assets.cloud.complete && assets.cloud.naturalWidth !== 0) {
            // Gambar Awan
            ctx.drawImage(assets.cloud, obs.x, obs.y, obs.width, obs.height);
        } else {
            // Fallback
            ctx.fillStyle = obs.type === 'lightning' ? 'yellow' : (obs.type === 'rainbow' ? 'magenta' : 'white');
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
    }
}

function updateObstacles() {
    // Spawn
    if (frames > 0 && frames % Math.floor(SPAWN_RATE + (Math.random() * 20 - 10)) === 0) {
        spawnObstacle();
        if (Math.random() < DOUBLE_CHANCE) {
            spawnObstacle(400 + Math.random() * 200); // Beri jarak horizontal agar tidak numpuk
        }
    }

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x  -= SCROLL_SPEED;

        const px = croc.width * 0.22;
        const py = croc.height * 0.28;
        
        let collided = false;

        if (obs.type === 'cloud') {
            collided = (
                croc.x + px         < obs.x + obs.width  - px &&
                croc.x + croc.width - px > obs.x + px          &&
                croc.y + py         < obs.y + obs.height - py  &&
                croc.y + croc.height - py > obs.y + py
            );
        } else if (obs.type === 'lightning') {
            // Hitbox petir kotak natural
            const petirPx = obs.width * 0.22;
            const petirPy = obs.height * 0.28;
            collided = (
                croc.x + px         < obs.x + obs.width  - petirPx &&
                croc.x + croc.width - px > obs.x + petirPx          &&
                croc.y + py         < obs.y + obs.height - petirPy  &&
                croc.y + croc.height - py > obs.y + petirPy
            );
        } else if (obs.type === 'rainbow') {
            let rWidth = obs.width * 1.5; 
            let rHeight = obs.height * 1.5;
            let rX = obs.x;
            let rY = obs.y;

            // Hitbox pelangi
            let hitRainbow = (
                croc.x + px         < rX + rWidth  - px &&
                croc.x + croc.width - px > rX + px          &&
                croc.y + py         < rY + rHeight - py  &&
                croc.y + croc.height - py > rY + py
            );

            // Hitbox 2 awan kecil di ujung
            let lhX = rX - obs.width*0.2; let lhY = rY + rHeight*0.6; let lhW = obs.width*0.8; let lhH = obs.height*0.8;
            let rhX = rX + rWidth - rWidth*0.35; let rhY = rY + rHeight*0.6; let rhW = obs.width*0.8; let rhH = obs.height*0.8;

            let hitLeftCloud = (
                croc.x + px         < lhX + lhW  - px &&
                croc.x + croc.width - px > lhX + px          &&
                croc.y + py         < lhY + lhH - py  &&
                croc.y + croc.height - py > lhY + py
            );

            let hitRightCloud = (
                croc.x + px         < rhX + rhW  - px &&
                croc.x + croc.width - px > rhX + px          &&
                croc.y + py         < rhY + rhH - py  &&
                croc.y + croc.height - py > rhY + py
            );

            collided = hitRainbow || hitLeftCloud || hitRightCloud;
        }

        if (collided) {
            triggerGameOver();
        }

        if (obs.x + (obs.type === 'rainbow' ? obs.width*1.5 : obs.width) < 0) { obstacles.splice(i, 1); i--; }
    }
}

// ─── Score berbasis jarak ──────────────────────────────────
function updateScore() {
    if (frames % 6 === 0) {
        score++;
        document.getElementById('score-val').innerText = score;

        // Ganti background setiap 200 poin, looping
        let newIdx = Math.floor(score / 200) % 6;
        if (newIdx !== currentBgIdx) {
            currentBgIdx = newIdx;
            bgOffset = 0; // reset scroll saat ganti bg
        }

        if (score >= 1000 && gameState !== 'WIN') {
            triggerWin();
        }
    }
}

// ─── Background ────────────────────────────────────────────
let bgOffset = 0;
let bgDrawWidth = 0;

function drawBackground() {
    let activeBg = assets.bgs[currentBgIdx];
    let activeMirrorBg = assets.mbgs[currentBgIdx];

    if (activeBg && activeBg.complete && activeBg.naturalWidth !== 0 && activeMirrorBg && activeMirrorBg.complete) {
        // Hitung skala agar background tidak gepeng (cover mirip css object-fit)
        const scale = Math.max(canvas.width / activeBg.naturalWidth, canvas.height / activeBg.naturalHeight);
        bgDrawWidth = activeBg.naturalWidth * scale;
        const bgDrawHeight = activeBg.naturalHeight * scale;

        if (gameState === 'PLAYING') {
            bgOffset -= SCROLL_SPEED * 0.5;
            if (bgOffset <= -bgDrawWidth * 2) {
                bgOffset += bgDrawWidth * 2;
            }
        }
        
        // Gambar 4 tile agar menutupi seluruh layar secara bergantian (bg -> mirror -> bg -> mirror)
        ctx.drawImage(activeBg, bgOffset, 0, bgDrawWidth, bgDrawHeight);
        ctx.drawImage(activeMirrorBg, bgOffset + bgDrawWidth, 0, bgDrawWidth, bgDrawHeight);
        ctx.drawImage(activeBg, bgOffset + bgDrawWidth * 2, 0, bgDrawWidth, bgDrawHeight);
        ctx.drawImage(activeMirrorBg, bgOffset + bgDrawWidth * 3, 0, bgDrawWidth, bgDrawHeight);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ─── Input Handling ────────────────────────────────────────
function handleInput() {
    if (gameState === 'START') {
        // Terapkan difficulty yang dipilih
        const d     = DIFFICULTIES[selectedDiff];
        SCROLL_SPEED  = d.scrollSpeed;
        SPAWN_RATE    = d.spawnRate;
        DOUBLE_CHANCE = d.doubleChance;
        GRAVITY_VAL   = d.gravity;
        JUMP_STRENGTH = d.jumpStrength;

        gameState = 'PLAYING';
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('score-display').classList.remove('hidden');
        croc.jump();
        bgMusic.play().catch(() => {});

    } else if (gameState === 'PLAYING') {
        croc.jump();
    } else if (gameState === 'GAME_OVER') {
        resetGame();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { handleInput(); e.preventDefault(); }
});

window.addEventListener('mousedown', (e) => {
    if (e.target.id === 'mute-btn') return;
    if (e.target.closest('#title-screen') || e.target.closest('#game-over-screen')) return;
    handleInput();
});

// Touch support untuk HP
window.addEventListener('touchstart', (e) => {
    if (e.target.id === 'mute-btn') return;
    if (e.target.closest('#difficulty-buttons')) return;
    handleInput();
}, { passive: true });

document.getElementById('title-screen').addEventListener('mousedown', (e) => {
    // Klik di tombol difficulty jangan trigger start
    if (e.target.classList.contains('diff-btn')) return;
    e.stopPropagation();
    handleInput();
});

document.getElementById('game-over-screen').addEventListener('mousedown', (e) => {
    e.stopPropagation();
    handleInput();
});

// ─── Game Over / Reset ─────────────────────────────────────
function triggerGameOver() {
    if (gameState === 'GAME_OVER' || gameState === 'WIN') return;
    gameState = 'GAME_OVER';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    document.getElementById('score-display').classList.add('hidden');
}

function triggerWin() {
    if (gameState === 'GAME_OVER' || gameState === 'WIN') return;
    gameState = 'WIN';
    document.getElementById('win-screen').classList.remove('hidden');
    document.getElementById('score-display').classList.add('hidden');
}

function resetGame() {
    croc.reset();
    obstacles    = [];
    score        = 0;
    frames       = 0;
    currentBgIdx = 0;
    bgOffset     = 0;
    document.getElementById('score-val').innerText = 0;
    gameState = 'START';
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
}

// ─── Game Loop ─────────────────────────────────────────────
function draw() {
    drawBackground();

    if (gameState === 'LOADING') {
        ctx.fillStyle = 'white';
        ctx.font      = '20px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
        return;
    }

    if (gameState === 'PLAYING' || gameState === 'GAME_OVER') {
        drawObstacles();
    }
    croc.draw();
}

function update() {
    if (gameState === 'PLAYING') {
        croc.update();
        updateObstacles();
        updateScore();
        frames++;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ─── Initialization ──────────────────────────────────────────
// Setup awal saat game baru di-load
function initGame() {
    resizeCanvas();
    croc.reset();
    gameLoop();
}

window.onload = initGame;

// ─── Visibility API (Pause music saat web di background) ────
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        bgMusic.pause();
    } else {
        if (gameState === 'PLAYING' && !isMuted) {
            bgMusic.play().catch(() => {});
        }
    }
});
