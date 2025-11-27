// --- CONFIGURATION ---
const SIZE = 500;
const RINGS = 6;
const WALL_THICKNESS = 15;
const ROTATION_SPEED = 0.004;
const GAP_SIZE = 0.65;     
const MAZE_RADIUS = 230;   

let walls = [];
let isWon = false;
let dotX, dotY;

function setup() {
    // Create Canvas and attach to the HTML div
    let cnv = createCanvas(SIZE, SIZE);
    cnv.parent('canvas-container');
    
    // Smooth edges
    smooth();
    
    // Start dot at bottom center
    dotX = width / 2;
    dotY = height + 100;

    initMaze();
}

function initMaze() {
    walls = [];
    let step = MAZE_RADIUS / (RINGS + 1);
    
    for (let i = 1; i <= RINGS; i++) {
        walls.push({
            r: i * step + 25, 
            angle: random(TWO_PI), 
            speed: (i % 2 === 0 ? 1 : -1) * (ROTATION_SPEED + random(0.003))
        });
    }
}

function draw() {
    // 1. Background
    if (isWon) {
        background(255); // White
    } else {
        background(20);  // Dark Grey
    }

    let cx = width / 2;
    let cy = height / 2;

    // 2. Draw Center Bulb
    noStroke();
    if (isWon) {
        fill(255, 165, 0); // Orange Center
    } else {
        fill(40); // Dark Center
    }
    ellipse(cx, cy, 40);

    // "ON" Text
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    if (isWon) fill(255);
    else fill(80);
    if (!isWon) text("ON", cx, cy);

    // 3. Draw Maze Walls
    noFill();
    strokeWeight(WALL_THICKNESS);
    strokeCap(SQUARE);

    if (isWon) stroke(0, 0, 0, 10); // Faint shadow if won
    else stroke(0, 210, 255);       // Neon Blue if playing

    for (let w of walls) {
        // Rotate logic
        if (!isWon) w.angle += w.speed;

        // Use Push/Pop to rotate the grid for this specific ring
        push();
        translate(cx, cy);
        rotate(w.angle); 
        // Draw the ring from the end of the gap to the start of the gap (almost full circle)
        // We draw from GAP_SIZE to TWO_PI. 
        // Because we rotated the grid, the gap is always visually at angle 0 relative to rotation.
        arc(0, 0, w.r * 2, w.r * 2, GAP_SIZE, TWO_PI);
        pop();
    }

    // 4. Physics & Dot
    updateDotPhysics();

    noStroke();
    if (isWon) fill(255);
    else fill(255, 0, 0);
    ellipse(dotX, dotY, 12);
}

function updateDotPhysics() {
    let dx = mouseX - dotX;
    let dy = mouseY - dotY;
    let distToMouse = sqrt(dx*dx + dy*dy);

    // Stop jitter
    if (distToMouse < 1) return;

    let maxSpeed = 25;
    let moveDist = min(distToMouse, maxSpeed);
    let stepX = dx / distToMouse;
    let stepY = dy / distToMouse;

    // Check collision pixel-by-pixel
    for (let i = 0; i < moveDist; i++) {
        let nextX = dotX + stepX;
        let nextY = dotY + stepY;

        if (checkCollisionMath(nextX, nextY)) {
            break; 
        } else {
            dotX = nextX;
            dotY = nextY;
        }
    }

    // State Logic
    let distToCenter = dist(dotX, dotY, width/2, height/2);
    
    if (!isWon && distToCenter < 20) {
        setTorch(true);
    } else if (isWon && distToCenter > MAZE_RADIUS + 20) {
        setTorch(false);
    }
}

// Optimized Math Collision
function checkCollisionMath(x, y) {
    if (isWon) return false;

    let cx = width / 2;
    let cy = height / 2;
    let d = dist(x, y, cx, cy);

    // Safe Zone (Outside)
    if (d > MAZE_RADIUS + 10) return false;

    // Check each ring
    for (let w of walls) {
        // 1. Is dot radius matching this ring radius?
        if (abs(d - w.r) < WALL_THICKNESS / 2) {
            
            // 2. It's in the ring, check angle for the gap
            let a = atan2(y - cy, x - cx);
            
            // Normalize angle to be positive (0 to TWO_PI)
            if (a < 0) a += TWO_PI;

            // Normalize wall angle to 0 to TWO_PI
            let wallA = w.angle % TWO_PI;
            if (wallA < 0) wallA += TWO_PI;

            // Calculate the dot's angle relative to the wall's rotation
            let relAngle = a - wallA;
            if (relAngle < 0) relAngle += TWO_PI;
            relAngle = relAngle % TWO_PI;

            // The Gap is at the "beginning" of the rotation (0 to GAP_SIZE)
            // If our relative angle is NOT inside that small gap zone, we hit a wall
            if (relAngle > GAP_SIZE) {
                return true; // HIT WALL
            }
        }
    }
    return false;
}

function setTorch(state) {
    isWon = state;
    
    // Update HTML classes
    let body = document.body;
    let status = document.getElementById('status');
    
    if (state) {
        body.classList.add('lights-on');
        status.innerText = "TORCH ENABLED";
    } else {
        body.classList.remove('lights-on');
        status.innerText = "TORCH DISABLED";
    }
}