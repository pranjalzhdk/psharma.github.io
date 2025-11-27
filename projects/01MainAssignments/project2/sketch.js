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
    let cnv = createCanvas(SIZE, SIZE);
    cnv.parent('canvas-container');
    smooth();
    
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
        // MATCH BODY COLOR (5 is approx #050505)
        background(5);  
    }

    let cx = width / 2;
    let cy = height / 2;

    // 2. Draw Center Bulb
    noStroke();
    if (isWon) {
        fill(255, 165, 0); 
    } else {
        fill(40); 
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

    if (isWon) stroke(0, 0, 0, 10); 
    else stroke(0, 210, 255);       

    for (let w of walls) {
        if (!isWon) w.angle += w.speed;

        push();
        translate(cx, cy);
        rotate(w.angle); 
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

    if (distToMouse < 1) return;

    let maxSpeed = 25;
    let moveDist = min(distToMouse, maxSpeed);
    let stepX = dx / distToMouse;
    let stepY = dy / distToMouse;

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

function checkCollisionMath(x, y) {
    if (isWon) return false;

    let cx = width / 2;
    let cy = height / 2;
    let d = dist(x, y, cx, cy);

    if (d > MAZE_RADIUS + 10) return false;

    for (let w of walls) {
        if (abs(d - w.r) < WALL_THICKNESS / 2) {
            let a = atan2(y - cy, x - cx);
            if (a < 0) a += TWO_PI;

            let wallA = w.angle % TWO_PI;
            if (wallA < 0) wallA += TWO_PI;

            let relAngle = a - wallA;
            if (relAngle < 0) relAngle += TWO_PI;
            relAngle = relAngle % TWO_PI;

            if (relAngle > GAP_SIZE) {
                return true; 
            }
        }
    }
    return false;
}

function setTorch(state) {
    isWon = state;
    
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