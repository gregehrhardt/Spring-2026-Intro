var mode = 0;
let array = [];
let reverb;
let chordNum = 0;
let chords = ["Fmaj7", "F"];
let chordTimer = 0;
let chordInterval = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  splash = new Splash();
  
  reverb = new p5.Reverb();

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
    background(255);

    for (let i = 0; i < array.length; i++) {
      array[i].play();
    }
  }
  
  chordTimer++;

if (chordTimer > chordInterval) {
  chordTimer = 0;

  chordNum = int(random(chords.length));

  let freqs = chordToFreqs(chords[chordNum]);

  for (let i = 0; i < array.length; i++) {
    array[i].setFreq(freqs[i]);
    }
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

    if (reverb){
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