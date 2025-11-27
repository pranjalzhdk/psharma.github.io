const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const dotElement = document.getElementById('cursor-dot');
const statusText = document.getElementById('status');
const body = document.body;

// --- CONFIGURATION ---
const SIZE = 500;           
const RINGS = 6;            
const WALL_THICKNESS = 15;  
const ROTATION_SPEED = 0.004; 
const GAP_SIZE = 0.65;      
const MAZE_RADIUS = 230;    

// High DPI Scaling
const dpr = window.devicePixelRatio || 1;
canvas.width = SIZE * dpr;
canvas.height = SIZE * dpr;
canvas.style.width = `${SIZE}px`;
canvas.style.height = `${SIZE}px`;
ctx.scale(dpr, dpr);

// Game State
let walls = [];
let isWon = false;

// Physics State
let targetX = SIZE / 2; 
let targetY = SIZE + 100; 
let dotX = SIZE / 2;
let dotY = SIZE + 100;

// --- INITIALIZE MAZE ---
function initMaze() {
    walls = [];
    const step = MAZE_RADIUS / (RINGS + 1);
    
    for (let i = 1; i <= RINGS; i++) {
        walls.push({
            r: i * step + 25, 
            angle: Math.random() * Math.PI * 2,
            speed: (i % 2 === 0 ? 1 : -1) * (ROTATION_SPEED + Math.random() * 0.003)
        });
    }
}

// --- PHYSICS ENGINE ---
function updateDotPosition() {
    // CHANGE 1: We removed "if (isWon) return;" 
    // This allows the dot to keep moving even after the light is on.

    const dx = targetX - dotX;
    const dy = targetY - dotY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) return;

    // Movement Physics
    const maxSpeed = 25; 
    const moveDist = Math.min(distance, maxSpeed);
    const stepX = (dx / distance);
    const stepY = (dy / distance);

    // Raycast / Sub-stepping
    for (let i = 0; i < moveDist; i++) {
        const nextX = dotX + stepX;
        const nextY = dotY + stepY;

        if (isWall(nextX, nextY)) {
            break; 
        } else {
            dotX = nextX;
            dotY = nextY;
        }
    }

    dotElement.style.left = `${dotX}px`;
    dotElement.style.top = `${dotY}px`;

    // --- STATE CHECKING ---
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const distToCenter = Math.sqrt((dotX - cx) ** 2 + (dotY - cy) ** 2);
    
    // Logic: Turn ON if in center, Turn OFF if outside maze
    if (!isWon && distToCenter < 20) {
        turnOn();
    } else if (isWon && distToCenter > MAZE_RADIUS + 20) {
        // CHANGE 2: If we are WON and we leave the maze area -> Turn OFF
        turnOff();
    }
}

// --- COLLISION CHECKER ---
function isWall(x, y) {
    // CHANGE 3: If the light is ON (isWon), disable collision 
    // This lets the user walk out easily without hitting invisible walls
    if (isWon) return false;

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    
    // 1. SAFE ZONE
    if (dist > MAZE_RADIUS + 10) return false;

    // 2. Pixel Check
    const px = Math.floor(x * dpr);
    const py = Math.floor(y * dpr);

    if(px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return false;

    const pixel = ctx.getImageData(px, py, 1, 1).data;

    // Check for Neon Blue pixels
    return (pixel[2] > 100); 
}

// --- DRAW LOOP ---
function draw() {
    // Background color based on state
    ctx.fillStyle = isWon ? "#ffffff" : "#1a1a1a"; 
    ctx.fillRect(0, 0, SIZE, SIZE);

    const cx = SIZE / 2;
    const cy = SIZE / 2;

    // Center "Torch Bulb"
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    
    if (isWon) {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 60;
        ctx.shadowColor = "orange";
    } else {
        ctx.fillStyle = '#333';
        ctx.shadowBlur = 0;
    }
    
    ctx.fill();
    ctx.shadowBlur = 0; 

    // Draw Text "ON"
    ctx.fillStyle = isWon ? '#orange' : '#555';
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; 
    ctx.fillText(isWon ? "" : "ON", cx, cy + 1); 

    // Draw Walls
    ctx.lineWidth = WALL_THICKNESS;
    ctx.lineCap = "butt"; 
    
    // Walls fade out when won
    ctx.strokeStyle = isWon ? "rgba(0,0,0,0.05)" : "#00d2ff"; 

    walls.forEach(w => {
        if (!isWon) w.angle += w.speed;
        ctx.beginPath();
        ctx.arc(cx, cy, w.r, w.angle + GAP_SIZE, w.angle + Math.PI * 2);
        ctx.stroke();
    });

    updateDotPosition();
    requestAnimationFrame(draw);
}

// --- STATE FUNCTIONS ---

function turnOn() {
    if(isWon) return;
    isWon = true;
    body.classList.add('lights-on');
    statusText.innerText = "TORCH ENABLED";
}

function turnOff() {
    if(!isWon) return;
    isWon = false;
    body.classList.remove('lights-on');
    statusText.innerText = "TORCH DISABLED";
    
    // Optional: Reset maze rotation or randomize it again?
    // initMaze(); 
}

// --- INPUT HANDLER ---
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
});

// Start
initMaze();
draw();