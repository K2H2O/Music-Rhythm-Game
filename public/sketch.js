let song;
let notes = [];
let score = 0;
let gameStarted = false;
let lastNoteTime = 0;
const noteInterval = 1000; // New note every 1 second
let noteSpeed = 5;

// Firebase config (replace with your Firebase project config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

function preload() {
  song = loadSound('https://cdn.pixabay.com/audio/2023/08/07/audio_4a4d769c5b.mp3'); // Free 30s audio clip
}

function setup() {
  createCanvas(800, 600).parent('game-container');
  textAlign(CENTER);
  textSize(20);
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('restart-button').addEventListener('click', restartGame);
}

function draw() {
  background(0);
  if (gameStarted) {
    
    // Spawn notes periodically
    if (millis() - lastNoteTime > noteInterval) {
      notes.push({ x: random([100, 300, 500, 700]), y: 0, hit: false });
      lastNoteTime = millis();
      analytics.logEvent('note_spawned', { timestamp: millis() });
    }

    // Update and draw notes
    for (let i = notes.length - 1; i >= 0; i--) {
      notes[i].y += noteSpeed;
      fill(0, 255, 255); // Cyan for notes
      rect(notes[i].x, notes[i].y, 50, 20);

      // Check if note is missed
      if (notes[i].y > height && !notes[i].hit) {
        gameOver();
      }
    }

    // Draw hit zones
    fill(255, 255, 255, 100);
    rect(100, height - 50, 50, 50); // Left arrow
    rect(300, height - 50, 50, 50); // Up arrow
    rect(500, height - 50, 50, 50); // Down arrow
    rect(700, height - 50, 50, 50); // Right arrow

    // Display score
    document.getElementById('score').innerText = score;
  }
}

function keyPressed() {
  if (gameStarted) {
    let hitZone;
    if (keyCode === LEFT_ARROW) hitZone = 100;
    if (keyCode === UP_ARROW) hitZone = 300;
    if (keyCode === DOWN_ARROW) hitZone = 500;
    if (keyCode === RIGHT_ARROW) hitZone = 700;

    for (let i = 0; i < notes.length; i++) {
      if (!notes[i].hit && abs(notes[i].x - hitZone) < 10 && abs(notes[i].y - (height - 50)) < 50) {
        notes[i].hit = true;
        score += 10;
        analytics.logEvent('note_hit', { score: score });
        notes.splice(i, 1);
        break;
      }
    }
  }
}

function startGame() {
  gameStarted = true;
  score = 0;
  notes = [];
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('score-display').classList.remove('hidden');
  song.play();
  analytics.logEvent('game_started', { timestamp: millis() });
}

function gameOver() {
  gameStarted = false;
  song.stop();
  document.getElementById('score-display').classList.add('hidden');
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('final-score').innerText = score;
  saveScore(score);
  analytics.logEvent('game_ended', { final_score: score });
}

function restartGame() {
  document.getElementById('game-over').classList.add('hidden');
  startGame();
}

function saveScore(score) {
  db.collection('scores').add({
    score: score,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log('Score saved!');
  }).catch((error) => {
    console.error('Error saving score:', error);
  });
}