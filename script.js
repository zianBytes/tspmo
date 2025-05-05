let isSmashed = false;

function setup() {
  createCanvas(600, 400);
  background(20);
}

function draw() {
  background(20);

  // Laptop Body
  if (!isSmashed) {
    fill(100);
    rect(200, 150, 200, 100); // screen
    fill(80);
    rect(200, 250, 200, 30);  // keyboard
  } else {
    fill(255, 0, 0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("💥 SMASHED 💥", width / 2, height / 2);
  }
}

function mousePressed() {
  // If mouse is within laptop bounds, smash it
  if (mouseX > 200 && mouseX < 400 && mouseY > 150 && mouseY < 280) {
    isSmashed = true;
  }
}
