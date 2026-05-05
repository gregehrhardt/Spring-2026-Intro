var mode = 0;
let array = [];
let reverb;
let fft;
let img;
let splash;

let chordNum = 0;
let chords = ["Fmaj7", "F", "Dm7"];

let lastChordChange = 0;
let chordInterval = 2000;
let bgColor;
let targetColor;

const chordSets = {
  '1': ["C", "C7", "Dm7"],
  '2': ["Gm", "Gm7", "C7"],
  '3': ["Am", "Am7", "Dm"],
  '4': ["Bb", "Bbmaj7", "C7"],
  '5': ["Bbmaj7", "Fmaj7", "Dm"],
  '6': ["Fmaj7", "F", "Bb", "Gm"],
  '7': ["Gm7", "Am7", "Am",],
  '8': ["Fmaj7", "F"],
  '9': ["F", "C7", "Bbmaj7"],
  '0': ["F"]
};

function preload() {
  img = loadImage("idaho.jpg");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  splash = new Splash();

  reverb = new p5.Reverb();
  fft = new p5.FFT(0.8, 128);

  bgColor = color(46, 152, 232);
  targetColor = bgColor;

  img.loadPixels();

  let freqs = chordToFreqs(chords[0]);

  for (let i = 0; i < 4; i++) {
    array[i] = new Drone(freqs[i]);
  }
}

function draw() {
  if (mouseIsPressed && splash.update()) {
    userStartAudio();
    mode = 1;
  }

  if (mode == 1) {
    splash.hide();

    drawVisuals();

    for (let i = 0; i < array.length; i++) {
      array[i].play();
    }

    if (millis() - lastChordChange > chordInterval) {
      lastChordChange = millis();

      chordNum = int(random(chords.length));

      let freqs = chordToFreqs(chords[chordNum]);

      for (let i = 0; i < array.length; i++) {
        array[i].setFreq(freqs[i]);
      }
    }
  }
}

function keyPressed() {
  if (chordSets[key]) {
    chords = chordSets[key];
  }

  lastChordChange = millis();

  chordNum = int(random(chords.length));

  let freqs = chordToFreqs(chords[chordNum]);

  for (let i = 0; i < array.length; i++) {
    array[i].setFreq(freqs[i]);
  }
}

function chordToFreqs(name) {
  const noteMap = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11
  };

  let root = name.match(/^[A-G](#|b)?/)[0];
  let type = name.slice(root.length);

  let rootMidi = noteMap[root] + 48;

  const chordMap = {
    "":     [0, 4, 7, 12],
    "m":    [0, 3, 7, 12],
    "7":    [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "m7":   [0, 3, 7, 10]
  };

  let intervals = chordMap[type] || chordMap[""];

  return intervals.map(i => {
    let octaveShift = int(random(-1, 2)) * 12;
    return midiToFreq(rootMidi + i + octaveShift);
  });
}

function drawVisuals() {
  let loudestVoice = array[0];
  let highestAmp = 0;

  for (let i = 0; i < array.length; i++) {
    let amp = array[i].ampLevel + sin(array[i].phase * 0.7) * 0.01;

    if (amp > highestAmp) {
      highestAmp = amp;
      loudestVoice = array[i];
    }
  }

  let dominantFreq = loudestVoice.baseFreq;

  let pixelSize = floor(map(dominantFreq, 50, 1000, 10, 2));
  pixelSize = constrain(pixelSize, 2, 10);

  for (let i = 0; i < width; i += pixelSize) {
    for (let j = 0; j < height; j += pixelSize) {

      let x = floor(map(i, 0, width, 0, img.width));
      let y = floor(map(j, 0, height, 0, img.height));

      let index = 4 * (x + y * img.width);

      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      noStroke();
      fill(r, g, b);
      rect(i, j, pixelSize, pixelSize);
    }
  }

  colorMode(HSB, 360, 100, 100, 255);

  let hueValue = map(dominantFreq, 50, 1000, 180, 240);
  targetColor = color(hueValue, 80, 90, 100);

  bgColor = lerpColor(bgColor, targetColor, 0.02);

  noStroke();
  fill(bgColor);
  rect(0, 0, width, height);

  colorMode(RGB, 255);
}

class Drone {
  constructor(freq) {
    this.baseFreq = freq;

    this.carrier = new p5.Oscillator("sawtooth");
    this.carrier.amp(0);
    this.carrier.start();

    this.detune = random(-2, 2);
    this.ampLevel = random(0.015, 0.05);
    this.panValue = random(-1, 1);

    this.panDrift = random(0.001, 0.003);
    this.ampDrift = random(0.001, 0.004);
    this.phase = random(1000);

    this.carrier.disconnect();

    if (reverb) {
      reverb.process(this.carrier, 5, 2);
    }

    this.setFreq(freq);
  }

  setFreq(freq) {
    this.baseFreq = freq;
  }

  play() {
    let freq = this.baseFreq + this.detune;

    this.carrier.freq(freq);

    this.phase += this.panDrift;

    let pan = sin(this.phase) * this.panValue;
    this.carrier.pan(pan);

    let amp = this.ampLevel + sin(this.phase * 0.7) * 0.01;

    this.carrier.amp(amp, 0.05);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}