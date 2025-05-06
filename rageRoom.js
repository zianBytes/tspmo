let isSmashed = false;
let smashSound;
let shakeAmount = 0;

function preload() {
  smashSound = loadSound('assets/sounds/smash1.mp3');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-wrapper'); // attach canvas to div
//   noCursor();
}

function draw() {
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount -= 0.5;
  }

  background(20);

  if (!isSmashed) {
    fill(100);
    rect(width/2 - 100, height/2 - 50, 200, 100); // screen
    fill(80);
    rect(width/2 - 100, height/2 + 50, 200, 30);  // keyboard
  } else {
    fill(60);
    rect(width/2 - 100, height/2 - 50, 200, 100);
    fill(50);
    rect(width/2 - 100, height/2 + 50, 200, 30);

    stroke(255, 0, 0);
    strokeWeight(2);
    line(width/2 - 80, height/2 - 40, width/2 + 80, height/2 + 30);
    line(width/2, height/2 - 40, width/2, height/2 + 30);
    line(width/2 + 50, height/2 - 40, width/2 - 20, height/2 + 30);

    noStroke();
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(24);
    text("💥 YOU SNAPPED 💥", width / 2, 80);
  }
}

function mousePressed() {
  const xStart = width / 2 - 100;
  const xEnd = width / 2 + 100;
  const yStart = height / 2 - 50;
  const yEnd = height / 2 + 80;

  if (!isSmashed && mouseX > xStart && mouseX < xEnd && mouseY > yStart && mouseY < yEnd) {
    isSmashed = true;
    if (smashSound) smashSound.play();
    shakeAmount = 10;
  }
}

document.getElementById('exitBtn')?.addEventListener('click', () => {
  window.location.href = "index.html";
});
