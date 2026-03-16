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
resizeCanvas();

// ─── Assets ───────────────────────────────────────────────
const assets = {
    croc: new Image(),
    cloud: new Image(),
    bg:  new Image(),
    bg2: new Image(),
    bg3: new Image(),
    bg4: new Image(),
    bg5: new Image(),
    bg6: new Image()
};

const BG_LIST = ['bg','bg2','bg3','bg4','bg5','bg6'];
let currentBgIdx = 0; // index ke BG_LIST

assets.croc.src  = 'img/buaya.png';
assets.cloud.src = 'img/awan.png';
assets.bg.src    = 'img/background.png';
assets.bg2.src   = 'img/background2.png';
assets.bg3.src   = 'img/background3.png';
assets.bg4.src   = 'img/background4.png';
assets.bg5.src   = 'img/background5.png';
assets.bg6.src   = 'img/background6.png';

let assetsLoaded = 0;
const totalAssets = 8;

const checkLoad = () => {
    assetsLoaded++;
    if (assetsLoaded === totalAssets && gameState === 'LOADING') {
        gameState = 'START';
    }
};
const handleLoadError = () => { console.error("Asset load failed"); checkLoad(); };

assets.croc.onload  = checkLoad; assets.croc.onerror  = handleLoadError;
assets.cloud.onload = checkLoad; assets.cloud.onerror = handleLoadError;
assets.bg.onload    = checkLoad; assets.bg.onerror    = handleLoadError;
assets.bg2.onload   = checkLoad; assets.bg2.onerror   = handleLoadError;
assets.bg3.onload   = checkLoad; assets.bg3.onerror   = handleLoadError;
assets.bg4.onload   = checkLoad; assets.bg4.onerror   = handleLoadError;
assets.bg5.onload   = checkLoad; assets.bg5.onerror   = handleLoadError;
assets.bg6.onload   = checkLoad; assets.bg6.onerror   = handleLoadError;

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
let gameState = 'LOADING'; // LOADING | START | PLAYING | GAME_OVER
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
        if (assets.croc.complete && assets.croc.naturalWidth !== 0) {
            ctx.drawImage(assets.croc, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },

    update() {
        this.velocity += GRAVITY_VAL;
        this.y        += this.velocity;

        if (this.y + this.height >= canvas.height || this.y <= 0) {
            triggerGameOver();
        }
    },

    jump() { this.velocity = JUMP_STRENGTH; }
};

// ─── Obstacles ─────────────────────────────────────────────
function spawnObstacle() {
    // Ukuran awan responsive
    const scale = Math.min(canvas.width / 800, 1);
    let cloudWidth  = (120 + Math.random() * 60) * Math.max(scale, 0.6);
    let cloudHeight = cloudWidth * 0.6;
    let yPos        = Math.random() * (canvas.height - cloudHeight);
    obstacles.push({ x: canvas.width, y: yPos, width: cloudWidth, height: cloudHeight });
}

function drawObstacles() {
    for (let obs of obstacles) {
        if (assets.cloud.complete && assets.cloud.naturalWidth !== 0) {
            ctx.drawImage(assets.cloud, obs.x, obs.y, obs.width, obs.height);
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.height / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function updateObstacles() {
    // Spawn
    if (frames > 0 && frames % Math.floor(SPAWN_RATE + (Math.random() * 20 - 10)) === 0) {
        spawnObstacle();
        if (Math.random() < DOUBLE_CHANCE) spawnObstacle();
    }

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x  -= SCROLL_SPEED;

        // Hitbox padding (lebih longgar)
        const px = 38, py = 38;
        if (
            croc.x + px         < obs.x + obs.width  - px &&
            croc.x + croc.width - px > obs.x + px          &&
            croc.y + py         < obs.y + obs.height - py  &&
            croc.y + croc.height - py > obs.y + py
        ) {
            triggerGameOver();
        }

        if (obs.x + obs.width < 0) { obstacles.splice(i, 1); i--; }
    }
}

// ─── Score berbasis jarak ──────────────────────────────────
function updateScore() {
    if (frames % 6 === 0) {
        score++;
        document.getElementById('score-val').innerText = score;

        // Ganti background setiap 1000 poin, looping
        let newIdx = Math.floor(score / 1000) % BG_LIST.length;
        if (newIdx !== currentBgIdx) {
            currentBgIdx = newIdx;
            bgOffset = 0; // reset scroll saat ganti bg
        }
    }
}

// ─── Background ────────────────────────────────────────────
let bgOffset = 0;
function drawBackground() {
    let activeBg = assets[BG_LIST[currentBgIdx]];
    if (activeBg && activeBg.complete && activeBg.naturalWidth !== 0) {
        if (gameState === 'PLAYING') {
            bgOffset -= SCROLL_SPEED * 0.5;
            if (bgOffset <= -canvas.width) bgOffset = 0;
        }
        ctx.drawImage(activeBg, bgOffset, 0, canvas.width, canvas.height);
        ctx.drawImage(activeBg, bgOffset + canvas.width, 0, canvas.width, canvas.height);
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
    if (gameState === 'GAME_OVER') return;
    gameState = 'GAME_OVER';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
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

croc.reset();
gameLoop();
