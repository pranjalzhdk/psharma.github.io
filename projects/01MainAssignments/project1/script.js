// --- GLOBAL ASSETS ---
let gunImg;
let gameFont;
let bgFont;

// --- GLOBAL VARIABLES ---
let gun;
let target = { x: 0, y: 0 };
let letters = [];
let explosionParticles = [];

// --- CONFIGURATION ---
let FONT_SIZE = 200; 
let REPULSION_RADIUS = 350; 
let REPULSION_FORCE = 10.0; 
let FRICTION = 0.92;        
let HITBOX_SIZE = 150;      

// --- PRELOAD ---
function preload() {
  gunImg = loadImage('assets/gun.png');
  gameFont = loadFont('assets/Spicy Sale.otf');
  bgFont = loadFont('assets/barlow_condensed.otf');
}

// --- CLASS: The Floating Bubble Letter ---
class Letter {
  constructor(char, x, y) {
    this.char = char;
    this.initialPos = createVector(x, y);
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    
    this.isBlasted = false;
    this.rotation = 0;
    this.idleOffset = random(1000); 
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    if (this.isBlasted) return;

    // 1. REPULSION
    let mousePos = createVector(target.x, target.y);
    let dir = p5.Vector.sub(this.pos, mousePos);
    let distToMouse = dir.mag();
    let isBeingPushed = false;

    if (distToMouse < REPULSION_RADIUS) {
      isBeingPushed = true;
      dir.normalize();
      let strength = map(distToMouse, 0, REPULSION_RADIUS, REPULSION_FORCE, 0);
      dir.mult(strength);
      this.applyForce(dir);
    }

    // 2. ANCHOR (Home Position)
    if (!isBeingPushed) {
        let homeDir = p5.Vector.sub(this.initialPos, this.pos);
        let distToHome = homeDir.mag();
        if (distToHome > 1) {
            homeDir.normalize();
            homeDir.mult(0.08); 
            this.applyForce(homeDir);
        }
    }

    // 3. PHYSICS
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.mult(FRICTION); 
    this.acc.mult(0); 

    // 4. BOUNDARIES (All 4 Walls)
    // We calculate a margin based on font size so the letter stays visually inside
    let margin = FONT_SIZE * 0.3; // Approx 120px padding

    // Left Wall
    if (this.pos.x < margin) { 
        this.pos.x = margin; 
        this.vel.x *= -1; 
    }
    // Right Wall
    if (this.pos.x > width - margin) { 
        this.pos.x = width - margin; 
        this.vel.x *= -1; 
    }
    // Top Wall
    if (this.pos.y < margin) { 
        this.pos.y = margin; 
        this.vel.y *= -1; 
    }
    // Bottom Wall (Now bouncing instead of falling through)
    if (this.pos.y > height - margin) { 
        this.pos.y = height - margin; 
        this.vel.y *= -1; 
    }
    
    // 5. ROTATION
    this.rotation = lerp(this.rotation, this.vel.x * 0.05, 0.1);
  }

  display() {
    if (this.isBlasted) return;

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    // Breathing Animation
    let breathe = map(sin(frameCount * 0.05 + this.idleOffset), -1, 1, -15, 15);
    
    fill(255);
    stroke(0, 150, 255, 150); 
    strokeWeight(8); 
    textSize(FONT_SIZE); 
    textAlign(CENTER, CENTER);
    text(this.char, 0, 50 + breathe); 
    pop();
  }

  checkHit(tx, ty) {
    let d = dist(tx, ty, this.pos.x, this.pos.y);
    return d < HITBOX_SIZE;
  }

  blast() {
    this.isBlasted = true;
    for (let i = 0; i < 100; i++) {
      explosionParticles.push(new Particle(this.pos.x, this.pos.y));
    }
  }
}

// --- CLASS: The Gun ---
class Gun {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  update() {
    this.x = mouseX;
    this.y = mouseY;
    target.x = this.x;
    target.y = this.y - 120; 
  }

  display() {
    push();
    translate(this.x, this.y);
    imageMode(CENTER);
    image(gunImg, 0, 60, 250, 250); 
    pop();

    let isAimingAtSomething = false;
    for(let l of letters) {
        if(!l.isBlasted && l.checkHit(target.x, target.y)) {
            isAimingAtSomething = true;
        }
    }

    push();
    translate(target.x, target.y);
    drawingContext.shadowBlur = 30;
    
    if(isAimingAtSomething) {
        stroke(255, 0, 0, 255); 
        drawingContext.shadowColor = color(255, 0, 0);
    } else {
        stroke(0, 255, 255, 200); 
        drawingContext.shadowColor = color(0, 255, 255);
    }

    noFill();
    strokeWeight(4);
    arc(0, 0, 80, 80, PI/6, 5*PI/6);
    arc(0, 0, 80, 80, 7*PI/6, 11*PI/6);
    strokeWeight(2);
    ellipse(0,0, 40, 40);
    line(-50, 0, -25, 0);
    line(25, 0, 50, 0);
    line(0, -50, 0, -25);
    line(0, 25, 0, 50);
    
    noStroke();
    if(isAimingAtSomething) fill(255, 0, 0); else fill(0, 255, 255);
    ellipse(0,0, 10, 10);
    drawingContext.shadowBlur = 0; 
    pop();
  }
}

// --- CLASS: Particles ---
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(5, 30));
    this.life = 255;
    let colors = [color(0, 255, 255), color(50, 100, 255), color(200, 50, 255)];
    this.color = random(colors);
  }
  update() {
    this.pos.add(this.vel);
    this.life -= 6;
    this.vel.mult(0.92);
  }
  display() {
    push();
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = this.color;
    noStroke();
    this.color.setAlpha(this.life);
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, random(8, 20));
    pop();
    drawingContext.shadowBlur = 0;
  }
}

// --- HELPER: Spawn Words ---
function spawnWord(word, startX, startY) {
    let xOffset = 0;
    let spacing = FONT_SIZE * 0.65; 

    for (let i = 0; i < word.length; i++) {
        let char = word.charAt(i);
        letters.push(new Letter(char, startX + xOffset, startY));
        xOffset += spacing;
    }
}

// --- MAIN SETUP ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  gun = new Gun();
  textFont(gameFont);

  // Layout Words
  spawnWord("zhdk", width * 0.05, height * 0.2);
  spawnWord("IAD", width/2 - (FONT_SIZE * 0.8), height/2 - 100);
  
  // Positioned so they sit at the bottom but inside the boundary
  let bottomY = height - 160; 
  spawnWord("interaction", width * 0.02, bottomY-50);
  spawnWord("design", width * 0.55+60, bottomY-800);

  noCursor();
}

// --- DRAW LOOP ---
function draw() {
  background(10, 10, 20); 
  drawBackgroundGrid(); 

  gun.update();
  textFont(gameFont); 
  
  let allBlasted = true;

  for (let letter of letters) {
    if(!letter.isBlasted) allBlasted = false;
    letter.update();
    letter.display();
  }

  gun.display();

  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    let p = explosionParticles[i];
    p.update();
    p.display();
    if (p.life <= 0) explosionParticles.splice(i, 1);
  }
  
  if (allBlasted) {
      drawWinScreen();
  }
}

// --- HELPER: Background ---
function drawBackgroundGrid() {
  push();
  textFont(bgFont);
  textSize(24);
  noStroke();
  textAlign(LEFT, TOP);

  let bgText = "interaction design zhdk   "; 
  let txtWidth = textWidth(bgText);
  let txtHeight = 35; 

  let scrollX = (frameCount * 0.6) % txtWidth;
  let scrollY = (frameCount * 0.3) % txtHeight;

  let colorTop = color(255, 255, 255, 10);   
  let colorBot = color(0, 255, 255, 60);     

  for (let y = -txtHeight; y < height + txtHeight; y += txtHeight) {
    
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(colorTop, colorBot, inter);
    fill(c);

    let wave = sin(frameCount * 0.02 + y * 0.01) * 20;

    for (let x = -txtWidth; x < width + txtWidth; x += txtWidth) {
      text(bgText, x - scrollX + wave, y - scrollY);
    }
  }
  pop();
}

// --- HELPER: Win Screen ---
function drawWinScreen() {
    push();
    textAlign(CENTER, CENTER);
    textSize(200); 
    
    drawingContext.shadowBlur = 50;
    drawingContext.shadowColor = color(0, 255, 0); 
    
    fill(255);
    text("STAGE CLEAR", width/2, height/2);
    
    drawingContext.shadowBlur = 0;
    pop();
}

function mousePressed() {
  for (let letter of letters) {
    if (letter.checkHit(target.x, target.y)) {
        letter.blast();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}