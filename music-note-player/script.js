// Audio context and note map
let audioContext;
const noteMap = {
  C4: 0,
  D4: 1,
  E4: 2,
  F4: 3,
  G4: 4,
  A4: 5,
  B4: 6,
  C5: 7,
  D5: 8,
  E5: 9,
  F5: 10,
  G5: 11,
  A5: 12,
  B5: 13,
  C6: 14,
};

// Initialize audio context
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Play note function
function playNote(note) {
  if (!audioContext) initAudio();

  const noteIndex = noteMap[note];
  if (noteIndex === undefined) return;

  // Create oscillator
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Calculate frequency (A4 = 440Hz)
  const frequencies = [
    261.63,
    293.66,
    329.63,
    349.23,
    392.0, // C4 to G4
    440.0,
    493.88,
    523.25,
    587.33,
    659.25, // A4 to E5
    698.46,
    783.99,
    880.0,
    987.77,
    1046.5, // F5 to C6
  ];

  const frequency = frequencies[noteIndex];

  // Configure oscillator
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Configure gain for smooth envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.03);

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start and stop oscillator
  oscillator.start();

  // Return stop function
  return () => {
    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

    oscillator.stop(audioContext.currentTime + 0.1);
  };
}

// Track active notes
const activeNotes = new Map();

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize audio on first interaction
  const initOnInteraction = () => {
    initAudio();
    document.removeEventListener("click", initOnInteraction);
    document.removeEventListener("keydown", initOnInteraction);
  };

  document.addEventListener("click", initOnInteraction, { once: true });
  document.addEventListener("keydown", initOnInteraction, { once: true });
  // Set up event listeners for all keys
  const keys = document.querySelectorAll(".key");
  keys.forEach((key) => {
    // Mouse events
    key.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const note = key.getAttribute("data-note");
      if (note) {
        key.classList.add("active");
        const stopNote = playNote(note);
        if (stopNote) {
          activeNotes.set(key, stopNote);
        }
      }
    });

    key.addEventListener("mouseup", () => {
      key.classList.remove("active");
      const stopNote = activeNotes.get(key);
      if (stopNote) {
        stopNote();
        activeNotes.delete(key);
      }
    });

    key.addEventListener("mouseleave", () => {
      key.classList.remove("active");
    });

    // Touch events for mobile
    key.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const note = key.getAttribute("data-note");
        if (note) {
          key.classList.add("active");
          const stopNote = playNote(note);
          if (stopNote) {
            activeNotes.set(key, stopNote);
          }
        }
      },
      { passive: false }
    );

    key.addEventListener("touchend", () => {
      key.classList.remove("active");
      const stopNote = activeNotes.get(key);
      if (stopNote) {
        stopNote();
        activeNotes.delete(key);
      }
    });

    key.addEventListener("touchcancel", () => {
      key.classList.remove("active");
      const stopNote = activeNotes.get(key);
      if (stopNote) {
        stopNote();
        activeNotes.delete(key);
      }
    });
  });

  // Add keyboard event listeners
  setupKeyboardControls();

  // Visual feedback for active keys
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Initialize settings
  initSettings();

  // Add note labels and keyboard shortcuts
  addNoteLabels();

  // Set up settings panel toggle
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  const closeSettings = document.getElementById("closeSettings");

  function toggleSettings() {
    settingsPanel.classList.toggle("active");
    // Force reflow to ensure the transition works
    void settingsPanel.offsetWidth;
  }

  function closeSettingsPanel() {
    settingsPanel.classList.remove("active");
  }

  if (settingsBtn && settingsPanel) {
    // Toggle settings panel when clicking the settings button
    settingsBtn.addEventListener("click", (e) => {
      toggleSettings();
      e.stopPropagation();
    });

    // Close settings when clicking the close button
    if (closeSettings) {
      closeSettings.addEventListener("click", (e) => {
        closeSettingsPanel();
        e.stopPropagation();
      });
    }

    // Close settings when clicking outside
    document.addEventListener("click", (e) => {
      if (
        settingsPanel.classList.contains("active") &&
        !settingsPanel.contains(e.target) &&
        !settingsBtn.contains(e.target)
      ) {
        closeSettingsPanel();
      }
    });

    // Close settings when pressing Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && settingsPanel.classList.contains("active")) {
        closeSettingsPanel();
      }
    });
  }
});

// Initialize settings and event listeners
function initSettings() {
  // Get DOM elements
  const showNoteNames = document.getElementById("showNoteNames");
  const showKeyboardShortcuts = document.getElementById(
    "showKeyboardShortcuts"
  );
  const enableMetronome = document.getElementById("enableMetronome");
  const metronomeControls = document.getElementById("metronomeControls");
  const bpmSlider = document.getElementById("bpm");
  const bpmValue = document.getElementById("bpmValue");

  // Load saved settings or use defaults (all off by default)
  const settings = JSON.parse(localStorage.getItem("pianoSettings")) || {
    showNoteNames: false,
    showKeyboardShortcuts: false,
    enableMetronome: false,
    bpm: 120,
    timeSignature: "4",
  };

  // Apply saved settings
  showNoteNames.checked = settings.showNoteNames;
  showKeyboardShortcuts.checked = settings.showKeyboardShortcuts;
  enableMetronome.checked = settings.enableMetronome;
  bpmSlider.value = settings.bpm;
  bpmValue.textContent = settings.bpm;
  document.getElementById("timeSignature").value = settings.timeSignature;

  // Toggle metronome controls
  metronomeControls.style.display = settings.enableMetronome ? "block" : "none";

  // Update UI based on settings
  updateNoteLabels(settings.showNoteNames);
  updateKeyboardShortcuts(settings.showKeyboardShortcuts);

  // Add event listeners
  showNoteNames.addEventListener("change", (e) => {
    updateNoteLabels(e.target.checked);
    saveSettings();
  });

  showKeyboardShortcuts.addEventListener("change", (e) => {
    updateKeyboardShortcuts(e.target.checked);
    saveSettings();
  });

  enableMetronome.addEventListener("change", (e) => {
    metronomeControls.style.display = e.target.checked ? "block" : "none";
    if (e.target.checked) {
      startMetronome();
    } else {
      stopMetronome();
    }
    saveSettings();
  });

  bpmSlider.addEventListener("input", (e) => {
    bpmValue.textContent = e.target.value;
    updateMetronomeBPM(parseInt(e.target.value));
    saveSettings();
  });

  document.getElementById("timeSignature").addEventListener("change", (e) => {
    updateMetronomeTimeSignature(e.target.value);
    saveSettings();
  });

  // Save settings to localStorage
  function saveSettings() {
    const settings = {
      showNoteNames: showNoteNames.checked,
      showKeyboardShortcuts: showKeyboardShortcuts.checked,
      enableMetronome: enableMetronome.checked,
      bpm: parseInt(bpmSlider.value),
      timeSignature: document.getElementById("timeSignature").value,
    };
    localStorage.setItem("pianoSettings", JSON.stringify(settings));
  }
}

// Add note labels to keys
function addNoteLabels() {
  const keys = document.querySelectorAll(".key");
  const keyMap = {
    q: "C4",
    w: "D4",
    e: "E4",
    r: "F4",
    t: "G4",
    a: "A4",
    s: "B4",
    d: "C5",
    f: "D5",
    g: "E5",
    z: "F5",
    x: "G5",
    c: "A5",
    v: "B5",
    b: "C6",
  };

  // Find keyboard key for each note
  const noteToKey = {};
  Object.entries(keyMap).forEach(([key, note]) => {
    noteToKey[note] = key.toUpperCase();
  });

  keys.forEach((key) => {
    const note = key.getAttribute("data-note");

    // Add note label
    const noteLabel = document.createElement("span");
    noteLabel.className = "note-label";
    noteLabel.textContent = note.replace(/\d+$/, ""); // Remove octave number
    key.appendChild(noteLabel);

    // Add keyboard shortcut
    const keyLabel = document.createElement("span");
    keyLabel.className = "keyboard-shortcut";
    keyLabel.textContent = noteToKey[note] || "";
    key.appendChild(keyLabel);
  });
}

// Update note labels visibility
function updateNoteLabels(show) {
  document.querySelectorAll(".note-label").forEach((label) => {
    label.style.display = show ? "block" : "none";
  });
}

// Update keyboard shortcuts visibility
function updateKeyboardShortcuts(show) {
  document.querySelectorAll(".keyboard-shortcut").forEach((shortcut) => {
    shortcut.style.display = show ? "block" : "none";
  });
}

// Metronome functions
let metronomeInterval;
let metronomeBeat = 0;
let metronomeAudioContext = null;
let lowOsc = null;
let highOsc = null;
let gainNode = null;

// Initialize metronome audio
function initMetronomeAudio() {
  if (!metronomeAudioContext) {
    metronomeAudioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
  }

  // Create oscillators for high and low ticks
  lowOsc = metronomeAudioContext.createOscillator();
  highOsc = metronomeAudioContext.createOscillator();

  // Set oscillator types and frequencies
  lowOsc.type = "sine";
  highOsc.type = "sine";
  lowOsc.frequency.value = 440; // A4 (lower pitch for first beat)
  highOsc.frequency.value = 880; // A5 (higher pitch for other beats)

  // Create gain node for volume control
  gainNode = metronomeAudioContext.createGain();
  gainNode.gain.value = 0;

  // Connect oscillators to gain node
  lowOsc.connect(gainNode);
  highOsc.connect(gainNode);

  // Connect to output
  gainNode.connect(metronomeAudioContext.destination);

  // Start oscillators (they'll be silent until gain is increased)
  lowOsc.start();
  highOsc.start();
}

// Play a metronome tick
function playMetronomeTick(isFirstBeat) {
  if (!metronomeAudioContext) {
    initMetronomeAudio();
  }

  const now = metronomeAudioContext.currentTime;
  const duration = 0.05; // Very short beep (50ms)

  // Stop any currently playing sound
  gainNode.gain.cancelScheduledValues(now);

  // Mute the oscillator that's not being used
  if (isFirstBeat) {
    lowOsc.frequency.setValueAtTime(440, now);
    highOsc.frequency.setValueAtTime(0, now);
  } else {
    lowOsc.frequency.setValueAtTime(0, now);
    highOsc.frequency.setValueAtTime(880, now);
  }

  // Create a short beep
  gainNode.gain.setValueAtTime(0.5, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
}

async function startMetronome() {
  if (!metronomeAudioContext) {
    initMetronomeAudio();
  }

  const bpm = parseInt(document.getElementById("bpm").value);
  const timeSignature = parseInt(
    document.getElementById("timeSignature").value
  );
  const interval = 60000 / bpm; // Convert BPM to milliseconds

  // Clear any existing interval
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
  }

  metronomeBeat = 0;

  // Play first beat immediately
  playMetronomeBeat(0);

  // Set up interval for subsequent beats
  metronomeInterval = setInterval(() => {
    metronomeBeat = (metronomeBeat + 1) % timeSignature;
    playMetronomeBeat(metronomeBeat);
  }, interval);
}

function playMetronomeBeat(beat) {
  if (!metronomeAudioContext) return;

  const timeSignature = parseInt(
    document.getElementById("timeSignature").value
  );

  // For 4/4 time: low on 1, high on others (2, 3, 4)
  if (timeSignature === 4) {
    if (beat === 0) {
      playMetronomeTick(true); // Low tick on first beat
    } else {
      playMetronomeTick(false); // High tick on other beats
    }
  }
  // For 3/4 time: low on 1, high on 2 and 3
  else if (timeSignature === 3) {
    if (beat === 0) {
      playMetronomeTick(true); // Low tick on first beat
    } else {
      playMetronomeTick(false); // High tick on other beats
    }
  }
  // For 6/8 time: low on 1, high on 4, medium on others
  else if (timeSignature === 6) {
    if (beat === 0) {
      playMetronomeTick(true); // Low tick on first beat
    } else if (beat === 3) {
      // Slightly lower pitch for the middle of 6/8
      highOsc.frequency.setValueAtTime(660, metronomeAudioContext.currentTime);
      playMetronomeTick(false);
    } else {
      highOsc.frequency.setValueAtTime(880, metronomeAudioContext.currentTime);
      playMetronomeTick(false); // High tick on other beats
    }
  }
}

function stopMetronome() {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }

  // Fade out any playing sound
  if (metronomeAudioContext && gainNode) {
    const now = metronomeAudioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  }
}

function updateMetronomeBPM(bpm) {
  if (document.getElementById("enableMetronome").checked) {
    stopMetronome();
    startMetronome();
  }
}

function updateMetronomeTimeSignature(signature) {
  if (document.getElementById("enableMetronome").checked) {
    stopMetronome();
    startMetronome();
  }
}

// Play note function with improved audio handling
// Handle touch events for mobile
function handleTouchStart(e) {
  e.preventDefault();
  this.classList.add("active");
}

function handleTouchEnd(e) {
  e.preventDefault();
  this.classList.remove("active");
  stopNote(this.dataset.note);
}

// Handle tab visibility changes
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    // Clear active states and stop all notes
    document.querySelectorAll(".key.active").forEach((key) => {
      key.classList.remove("active");
      const stopNote = activeNotes.get(key);
      if (stopNote) {
        stopNote();
        activeNotes.delete(key);
      }
    });
    activeKeys.clear();
  }
}

// Setup keyboard controls with qwertasdfgzxcvb mapping
function setupKeyboardControls() {
  // Map keyboard keys to musical notes
  const keyMap = {
    // First row (C4-G4)
    q: "C4",
    w: "D4",
    e: "E4",
    r: "F4",
    t: "G4",
    // Second row (A4-E5)
    a: "A4",
    s: "B4",
    d: "C5",
    f: "D5",
    g: "E5",
    // Third row (F5-C6)
    z: "F5",
    x: "G5",
    c: "A5",
    v: "B5",
    b: "C6",
  };

  // Track currently pressed keys to prevent repeats
  const activeKeys = new Set();

  // Handle keydown events
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    // Handle Shift+S for settings
    if (key === "s" && e.shiftKey) {
      e.preventDefault();
      const settingsPanel = document.getElementById("settingsPanel");
      if (settingsPanel) {
        settingsPanel.classList.toggle("active");
      }
      return;
    }

    // Handle note keys
    const note = keyMap[key];
    if (note && !activeKeys.has(key)) {
      e.preventDefault();
      activeKeys.add(key);
      const keyElement = document.querySelector(`.key[data-note="${note}"]`);
      if (keyElement) {
        keyElement.classList.add("active");
        const stopNote = playNote(note);
        if (stopNote) {
          activeNotes.set(key, stopNote);
        }
      }
    }
  });

  // Handle keyup events
  document.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    const note = keyMap[key];

    if (note && activeKeys.has(key)) {
      e.preventDefault();
      activeKeys.delete(key);

      const keyElement = document.querySelector(`.key[data-note="${note}"]`);
      if (keyElement) {
        keyElement.classList.remove("active");
        const stopNote = activeNotes.get(key);
        if (stopNote) {
          stopNote();
          activeNotes.delete(key);
        }
      }
    }
  });

  // Handle window blur to clean up stuck keys
  window.addEventListener("blur", () => {
    activeKeys.forEach((key) => {
      const note = keyMap[key];
      if (note) {
        const keyElement = document.querySelector(`.key[data-note="${note}"]`);
        if (keyElement) {
          keyElement.classList.remove("active");
        }
      }
    });
    activeKeys.clear();
  });

  // Close settings with Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const settingsPanel = document.getElementById("settingsPanel");
      if (settingsPanel?.classList.contains("active")) {
        settingsPanel.classList.remove("active");
      }
    }
  });
}
