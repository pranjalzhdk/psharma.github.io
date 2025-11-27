const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const dotElement = document.getElementById('cursor-dot');
const statusText = document.getElementById('status');

// --- CONFIGURATION ---
const SIZE = 500;           // Canvas size
const RINGS = 7;            // Number of walls
const WALL_THICKNESS = 14;  // Thicker walls = better collision
const ROTATION_SPEED = 0.005; 
const GAP_SIZE = 0.55;      // Size of the gaps

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
// We track where the mouse IS (target) and where the dot IS (current)
let targetX = SIZE / 2; 
let targetY = SIZE + 50; // Start at bottom
let dotX = SIZE / 2;
let dotY = SIZE + 50;

// --- INITIALIZE MAZE ---
function initMaze() {
    walls = [];
    const step = (SIZE / 2) / (RINGS + 1);
    for (let i = 1; i <= RINGS; i++) {
        walls.push({
            r: i * step,
            angle: Math.random() * Math.PI * 2,
            speed: (i % 2 === 0 ? 1 : -1) * (ROTATION_SPEED + Math.random() * 0.003)
        });
    }
}

// --- PHYSICS ENGINE ---
function updateDotPosition() {
    if (isWon) return;

    // 1. Calculate vector to target (mouse)
    const dx = targetX - dotX;
    const dy = targetY - dotY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 2. If we are already there, stop
    if (distance < 1) return;

    // 3. SUB-STEPPING (The fix for passing through lines)
    // instead of jumping to the mouse, we move 1 pixel at a time
    // and check for collisions at every single step.
    
    // We cap movement speed to prevent lag on huge jumps, 
    // but fast enough to feel instant (e.g., 20px per frame)
    const maxSpeed = 20; 
    const moveDist = Math.min(distance, maxSpeed);
    
    // Normalize vector (direction)
    const stepX = (dx / distance);
    const stepY = (dy / distance);

    // Loop through pixels
    for (let i = 0; i < moveDist; i++) {
        // Look ahead 1 pixel
        const nextX = dotX + stepX;
        const nextY = dotY + stepY;

        // Check Wall Collision
        if (isWall(nextX, nextY)) {
            // Hit a wall! Stop moving.
            // Optional: You could try to "slide" here by zeroing out X or Y 
            // but for a strict maze, stopping is better.
            break; 
        } else {
            // Path is clear, advance dot
            dotX = nextX;
            dotY = nextY;
        }
    }

    // 4. Update Visuals
    dotElement.style.left = `${dotX}px`;
    dotElement.style.top = `${dotY}px`;

    // 5. Check Win
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const distToCenter = Math.sqrt((dotX - cx) ** 2 + (dotY - cy) ** 2);
    if (distToCenter < 15) triggerWin();
}

// --- COLLISION CHECKER ---
function isWall(x, y) {
    // 1. Check if outside canvas (Allow free movement outside)
    // We use a circular boundary for "outside"
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    
    // If we are outside the maze circle, never collide (Free movement)
    if (dist > (SIZE / 2) - 2) return false;

    // 2. Pixel Check (Inside maze)
    // Map logical coordinates to physical device pixels
    const px = Math.floor(x * dpr);
    const py = Math.floor(y * dpr);

    // Get pixel color
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    
    // Logic: Wall is Black (RGB < 100) and Opaque (Alpha > 100)
    // Using Red channel [0] is sufficient for black/white images
    return (pixel[3] > 100 && pixel[0] < 50);
}

// --- DRAW LOOP ---
function draw() {
    // 1. Clear & Draw Background
    ctx.fillStyle = isWon ? "#ccffcc" : "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const cx = SIZE / 2;
    const cy = SIZE / 2;

    // 2. Draw Goal
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fillStyle = isWon ? '#00aa00' : '#ddd';
    ctx.fill();

    // 3. Draw Rotating Walls
    ctx.lineWidth = WALL_THICKNESS;
    ctx.lineCap = "butt"; // Flat edges prevent "hooking" on corners
    ctx.strokeStyle = "#000";

    walls.forEach(w => {
        if (!isWon) w.angle += w.speed;
        ctx.beginPath();
        // Draw the wall arc
        ctx.arc(cx, cy, w.r, w.angle + GAP_SIZE, w.angle + Math.PI * 2);
        ctx.stroke();
    });

    // 4. Run Physics & Animation
    updateDotPosition();
    requestAnimationFrame(draw);
}

function triggerWin() {
    isWon = true;
    statusText.innerText = "UNLOCKED";
    statusText.style.color = "#00ff00";
    dotElement.style.background = "#fff"; // Hide dot
    ctx.globalAlpha = 0.3; // Fade out maze
}

// --- INPUT HANDLER ---
// Listen on WINDOW to track mouse even if outside the div
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Calculate mouse position relative to canvas top-left
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
});

// Start
initMaze();
draw();