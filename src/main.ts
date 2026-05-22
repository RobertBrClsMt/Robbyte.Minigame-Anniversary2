import "./styles.css";

type FlagMap = Record<string, boolean>;
type UnlockMap = Record<string, boolean>;

type GalleryScreen = "gallery" | "gallery_extra";

type Screen =
  | "menu"
  | "game"
  | "memories"
  | "letters"
  | GalleryScreen
  | "options"
  | "credits"
  | "minigame"
  | "exit";

type ReturnScreen = Exclude<Screen, "minigame">;

type UnlockSet = {
  memories?: string[];
  letters?: string[];
  gallery?: string[];
  words?: string[];
};

type Action =
  | { type: "setFlag"; flag: string; value?: boolean }
  | { type: "goToScene"; scene: string; dialogueIndex?: number }
  | { type: "goToNextChapter" }
  | { type: "playSfx"; sfx: string }
  | ({ type: "unlock" } & UnlockSet)
  | { type: "startMinigame"; minigame: string }
  | { type: "showLetter"; letter: string }
  | { type: "showGalleryItem"; item: string }
  | { type: "showScreen"; screen: Exclude<Screen, "game" | "minigame"> }
  | { type: "completeChapter" };

type Choice = {
  label: string;
  goToScene?: string;
  dialogueIndex?: number;
  requiresFlags?: string[];
  requiresMemories?: string[];
  actions?: Action[];
  sfx?: string;
};

type CharacterAnimation = "bounce" | "shake" | "nod" | "wiggle" | "pulse" | "float";
type TextAnimation = "bounce" | "shake" | "pulse" | "wiggle" | "pop" | "glow";

type DialogueLine = {
  character?: string;
  text: string;
  sprite?: string;
  sfx?: string;
  important?: boolean;
  characterAnimation?: CharacterAnimation;
  typingSpeed?: number;
  actions?: Action[];
  choices?: Choice[];
};

type Clickable = {
  id: string;
  label: string;
  image?: string;
  hoverImage?: string;
  hoverImageStyle?: "framed";
  hoverSfx?: string;
  hoverSfxVolume?: number;
  hoverOutSfx?: string;
  hoverOutSfxVolume?: number;
  clickSfx?: string;
  clickSfxVolume?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tooltip?: string;
  sfx?: string;
  requiresFlags?: string[];
  hiddenWhenFlags?: string[];
  requiresMemories?: string[];
  actions?: Action[];
  inspectDialogue?: DialogueLine[];
};

type Character = {
  name: string;
  color: string;
  sprite?: string;
  side?: "left" | "center" | "right";
  spriteOffset?: {
    x?: string;
    y?: string;
  };
  spriteWidth?: string;
  spriteMaxHeight?: string;
  spriteBottom?: string;
  spriteMobileOffset?: {
    x?: string;
    y?: string;
  };
  spriteMobileWidth?: string;
  spriteMobileMaxHeight?: string;
  spriteMobileBottom?: string;
};

type Scene = {
  name: string;
  background: string;
  music?: string;
  hub?: boolean;
  chapter?: number;
  memoryId?: string;
  word?: string;
  minigameId?: string;
  nextScene?: string;
  completionTitle?: string;
  completionText?: string;
  completeLabel?: string;
  unlocks?: UnlockSet;
  dialogues: DialogueLine[];
  clickables?: Clickable[];
};

type Memory = {
  chapter: number;
  title: string;
  date: string;
  category: string;
  object: string;
  word: string;
  scene: string;
  description: string;
  initiallyUnlocked?: boolean;
};

type Letter = {
  title: string;
  date: string;
  description: string;
  paragraphs: string[];
  initiallyUnlocked?: boolean;
};

type GalleryItem = {
  title: string;
  date: string;
  category: string;
  image: string;
  description: string;
  initiallyUnlocked?: boolean;
};

type Minigame = {
  title: string;
  kind: "sequence" | "collect" | "order" | "match" | "constellation";
  prompt: string;
  successText: string;
  items: { id: string; label: string; hint?: string }[];
  unlocks?: UnlockSet;
};

type GameData = {
  title: string;
  subtitle?: string;
  startScene: string;
  audio?: {
    music?: Record<string, string>;
    sfx?: Record<string, string>;
  };
  characters: Record<string, Character>;
  memories: Record<string, Memory>;
  letters: Record<string, Letter>;
  gallery: Record<string, GalleryItem>;
  minigames: Record<string, Minigame>;
  credits: string[];
  scenes: Record<string, Scene>;
  gallery_extra?: Record<string, GalleryItem>;
};

type InspectionState = {
  clickableId: string;
  lines: DialogueLine[];
  index: number;
};

type ActiveMinigame = {
  id: string;
  selected: string[];
  returnSceneId?: string;
  feedback?: string;
};

type AppState = {
  screen: Screen;
  sceneId: string;
  dialogueIndex: number;
  flags: FlagMap;
  unlocked: {
    memories: UnlockMap;
    letters: UnlockMap;
    gallery: UnlockMap;
    words: UnlockMap;
  };
  completedScenes: UnlockMap;
  completedMinigames: UnlockMap;
  musicMuted: boolean;
  sfxMuted: boolean;
  inspection?: InspectionState;
  activeMinigame?: ActiveMinigame;
};

type SaveData = {
  version: 2;
  sceneId: string;
  dialogueIndex: number;
  flags: FlagMap;
  unlocked: AppState["unlocked"];
  completedScenes: UnlockMap;
  completedMinigames: UnlockMap;
};

type IconName =
  | "back"
  | "close"
  | "home"
  | "image"
  | "letter"
  | "music"
  | "next"
  | "play"
  | "reset"
  | "save"
  | "settings"
  | "speaker";

type DialogueTextSegment = {
  text: string;
  animation?: TextAnimation;
};

type ActiveTyping = {
  target: HTMLElement;
  segments: DialogueTextSegment[];
  visibleChars: number;
  totalChars: number;
  timer?: number;
};

const ICONS: Record<IconName, string> = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/></svg>`,
  image: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-5-5L5 19"/></svg>`,
  letter: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 0Z"/><path d="M7 5v14"/><path d="M10 9h5"/><path d="M10 13h4"/></svg>`,
  music: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7Z"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>`,
  save: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5Z"/><path d="M8 4v6h8V4"/><path d="M8 20v-6h8v6"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9.5a4 4 0 0 1 0 5"/><path d="M19 7a8 8 0 0 1 0 10"/></svg>`,
};

const SAVE_KEY = "ven-a-buscarme-save-v2";
const LEGACY_SAVE_KEY = "anniversary-vn-save-v1";
const MUTE_KEY = "anniversary-vn-muted-v1";
const MUSIC_MUTE_KEY = "anniversary-vn-music-muted-v1";
const SFX_MUTE_KEY = "anniversary-vn-sfx-muted-v1";
const DEFAULT_TYPING_SPEED = 22;
const CHARACTER_ANIMATIONS = ["bounce", "shake", "nod", "wiggle", "pulse", "float"] as const;
const TEXT_ANIMATIONS = ["bounce", "shake", "pulse", "wiggle", "pop", "glow"] as const;
const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Missing #app root element.");
}

const app = appElement;

let gameData: GameData | null = null;
let lastLineAudioKey = "";
let activeTyping: ActiveTyping | undefined;
let activeSettingsClose: (() => void) | undefined;
let state: AppState = {
  screen: "menu",
  sceneId: "",
  dialogueIndex: 0,
  flags: {},
  unlocked: emptyUnlocks(),
  completedScenes: {},
  completedMinigames: {},
  musicMuted: loadMusicMuted(),
  sfxMuted: loadSfxMuted(),
};

class AudioManager {
  private context?: AudioContext;
  private resumePromise?: Promise<void>;
  private musicTimer?: number;
  private htmlMusic?: HTMLAudioElement;
  private currentMusic?: string;
  private sfxCache = new Map<string, HTMLAudioElement>();
  private activeObjectSfx?: HTMLAudioElement;
  private activeObjectSfxStop?: () => void;
  private musicMuted = false;
  private sfxMuted = false;

  constructor(private readonly data?: GameData["audio"]) { }

  unlock() {
    this.context ??= new AudioContext();
    return this.resumeContext();
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted) {
      this.stopMusic(false);
      return;
    }

    if (this.currentMusic) {
      const music = this.currentMusic;
      this.currentMusic = undefined;
      this.playMusic(music);
    }
  }

  setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  playMusic(key?: string) {
    this.currentMusic = key;
    this.stopMusic(false);

    if (!key || this.musicMuted) {
      return;
    }

    const source = this.data?.music?.[key] ?? key;
    if (source.startsWith("procedural:")) {
      this.startProceduralLoop(source.replace("procedural:", ""));
      return;
    }

    const audio = new Audio(assetUrl(source));
    audio.loop = true;
    audio.volume = 0.34;
    audio.play().catch(() => undefined);
    this.htmlMusic = audio;
  }

  playSfx(key?: string, volume = 1) {
    this.playSfxAudio(key, volume);
  }

  playObjectSfx(key?: string, volume = 1) {
    this.stopObjectSfx();
    const playback = this.playSfxAudio(key, volume);
    if (!playback) {
      return;
    }

    this.activeObjectSfx = playback.audio;
    this.activeObjectSfxStop = playback.stop;
    if (playback.audio) {
      playback.audio.addEventListener(
        "ended",
        () => {
          if (this.activeObjectSfx === playback.audio) {
            this.activeObjectSfx = undefined;
            this.activeObjectSfxStop = undefined;
          }
        },
        { once: true },
      );
    }
  }

  private playSfxAudio(key?: string, volume = 1) {
    if (!key || this.sfxMuted) {
      return undefined;
    }

    const volumeMultiplier = this.normalizeVolume(volume);
    const source = this.data?.sfx?.[key] ?? key;
    if (source.startsWith("procedural:")) {
      return { stop: this.playProceduralSfx(source.replace("procedural:", ""), volumeMultiplier) };
    }

    const url = assetUrl(source);
    const cached = this.sfxCache.get(url);
    const audio = cached ? cached.cloneNode() as HTMLAudioElement : new Audio(url);
    if (!cached) {
      audio.preload = "auto";
      this.sfxCache.set(url, audio);
    }
    audio.volume = 0.62 * volumeMultiplier;
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
    return {
      audio,
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
      },
    };
  }

  private stopObjectSfx() {
    if (!this.activeObjectSfxStop) {
      return;
    }

    this.activeObjectSfxStop();
    this.activeObjectSfx = undefined;
    this.activeObjectSfxStop = undefined;
  }

  private normalizeVolume(volume: number) {
    if (!Number.isFinite(volume)) {
      return 1;
    }

    return Math.max(0, Math.min(1, volume));
  }

  private ensureContext() {
    this.context ??= new AudioContext();
    this.resumeContext();
    return this.context;
  }

  private resumeContext() {
    if (!this.context || this.context.state !== "suspended") {
      return Promise.resolve();
    }

    this.resumePromise ??= this.context
      .resume()
      .catch(() => undefined)
      .then(() => {
        this.resumePromise = undefined;
      });
    return this.resumePromise;
  }

  private stopMusic(clearCurrent = true) {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }

    if (this.htmlMusic) {
      this.htmlMusic.pause();
      this.htmlMusic.currentTime = 0;
      this.htmlMusic = undefined;
    }

    if (clearCurrent) {
      this.currentMusic = undefined;
    }
  }

  private startProceduralLoop(variant: string) {
    const progressions: Record<string, number[]> = {
      menu: [392, 493.88, 587.33, 659.25],
      hub: [349.23, 440, 523.25, 659.25],
      school: [392, 440, 493.88, 440],
      chat: [523.25, 659.25, 587.33, 493.88],
      fair: [440, 554.37, 659.25, 739.99],
      kiss: [392, 523.25, 587.33, 783.99],
      letters: [329.63, 392, 493.88, 523.25],
      otherlife: [293.66, 440, 587.33, 739.99],
      rock: [196, 246.94, 293.66, 246.94],
      lunar: [392, 466.16, 587.33, 698.46],
      concert: [220, 293.66, 369.99, 440],
      playful: [587.33, 739.99, 880, 739.99],
      kitchen: [440, 523.25, 659.25, 523.25],
      reading: [349.23, 440, 523.25, 440],
      park: [392, 493.88, 587.33, 493.88],
      calm: [261.63, 329.63, 392, 493.88],
      comedy: [523.25, 659.25, 783.99, 1046.5],
      mountain: [293.66, 392, 587.33, 783.99],
      restaurant: [349.23, 415.3, 523.25, 659.25],
      rain: [261.63, 329.63, 392, 329.63],
      morning: [440, 554.37, 659.25, 880],
      final: [329.63, 493.88, 659.25, 987.77],
      stars: [392, 587.33, 739.99, 987.77],
    };
    const notes = progressions[variant] ?? progressions.hub;
    let step = 0;

    this.musicTimer = window.setInterval(() => {
      this.playTone(notes[step % notes.length], 0.22, 0.038, "triangle");
      if (step % 4 === 0) {
        this.playTone(notes[0] / 2, 0.58, 0.026, "sine");
      }
      step += 1;
    }, 500);
  }

  private playProceduralSfx(variant: string, volume = 1) {
    const presets: Record<string, [number, number, OscillatorType]> = {
      blip: [740, 0.055, "square"],
      choice: [620, 0.11, "triangle"],
      paper: [260, 0.11, "sawtooth"],
      sparkle: [1046.5, 0.18, "sine"],
      click: [440, 0.045, "square"],
      message: [880, 0.09, "triangle"],
      camera: [520, 0.05, "square"],
      unlock: [987.77, 0.2, "sine"],
      soft: [392, 0.16, "triangle"],
      water: [180, 0.14, "sawtooth"],
      bell: [1318.51, 0.18, "sine"],
    };
    const [frequency, duration, wave] = presets[variant] ?? presets.click;
    return this.playTone(frequency, duration, 0.085 * volume, wave);
  }

  private playTone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ) {
    const context = this.ensureContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);

    let stopped = false;
    return () => {
      if (stopped) {
        return;
      }

      stopped = true;
      try {
        oscillator.stop();
      } catch {
        // The oscillator may have already ended naturally.
      }
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

let audio = new AudioManager();

function emptyUnlocks(): AppState["unlocked"] {
  return {
    memories: {},
    letters: {},
    gallery: {},
    words: {},
  };
}

function assetUrl(path: string) {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("procedural:")
  ) {
    return path;
  }

  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

function loadMusicMuted() {
  const value = localStorage.getItem(MUSIC_MUTE_KEY);
  return value === null ? localStorage.getItem(MUTE_KEY) === "true" : value === "true";
}

function loadSfxMuted() {
  const value = localStorage.getItem(SFX_MUTE_KEY);
  return value === null ? localStorage.getItem(MUTE_KEY) === "true" : value === "true";
}

function saveAudioSettings() {
  localStorage.setItem(MUSIC_MUTE_KEY, String(state.musicMuted));
  localStorage.setItem(SFX_MUTE_KEY, String(state.sfxMuted));
}

function loadSave(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 2 || !parsed.sceneId || !parsed.unlocked) {
      return null;
    }
    return parsed as SaveData;
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

function saveGame() {
  if (!gameData || state.screen === "menu") {
    return;
  }

  const save: SaveData = {
    version: 2,
    sceneId: state.sceneId,
    dialogueIndex: state.dialogueIndex,
    flags: state.flags,
    unlocked: state.unlocked,
    completedScenes: state.completedScenes,
    completedMinigames: state.completedMinigames,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // localStorage can fail in private browsing or if the browser quota is full.
  }
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(LEGACY_SAVE_KEY);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function makeButton(className: string, text: string, onClick: () => void) {
  const button = el("button", className, text);
  button.type = "button";
  button.title = text;
  button.setAttribute("aria-label", text);
  button.addEventListener("click", onClick);
  return button;
}

function makeIcon(icon: IconName) {
  const wrapper = el("span", "button-icon");
  wrapper.innerHTML = ICONS[icon];
  wrapper.setAttribute("aria-hidden", "true");
  return wrapper;
}

function makeIconButton(
  className: string,
  icon: IconName,
  label: string,
  onClick: () => void,
  pressed?: boolean,
) {
  const button = el("button", `${className} icon-only`);
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  if (pressed !== undefined) {
    button.setAttribute("aria-pressed", String(pressed));
  }
  button.append(makeIcon(icon));
  button.addEventListener("click", onClick);
  return button;
}

function makeIconTextButton(
  className: string,
  icon: IconName,
  text: string,
  onClick: () => void,
  title = text,
) {
  const button = el("button", `${className} button-with-icon`);
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.append(makeIcon(icon), el("span", "button-label", text));
  button.addEventListener("click", onClick);
  return button;
}

function replaceApp(node: HTMLElement) {
  activeSettingsClose?.();
  clearActiveTyping();
  app.replaceChildren(node);
}

function clearActiveTyping() {
  if (activeTyping?.timer !== undefined) {
    window.clearInterval(activeTyping.timer);
  }
  activeTyping = undefined;
}

function completeActiveTyping() {
  if (!activeTyping) {
    return false;
  }

  const { target, segments, totalChars } = activeTyping;
  clearActiveTyping();
  renderDialogueTextSegments(target, segments, totalChars);
  return true;
}

function isPhoneDevice() {
  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };
  const userAgent = navigator.userAgent;
  const tabletUserAgent = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(userAgent);

  if (tabletUserAgent) {
    return false;
  }

  if (nav.userAgentData?.mobile) {
    return true;
  }

  if (/iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini|Mobi/i.test(userAgent)) {
    return true;
  }

  const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const longSide = Math.max(window.screen.width, window.screen.height);

  return hasTouch && shortSide < 600 && longSide < 1000;
}

function renderMobileDeviceNotice() {
  const screen = el("main", "device-warning-screen");
  const panel = el("section", "device-warning-panel");
  panel.append(
    el("p", "eyebrow", "Pantalla grande recomendada"),
    el("h1", "screen-title", "Abre esta web en un PC de escritorio o laptop"),
    el(
      "p",
      "screen-copy",
      "Este minijuego está pensado para una pantalla más amplia. Para una mejor experiencia, vuelve a abrirlo desde un PC de escritorio o laptop.",
    ),
  );
  screen.append(panel);
  replaceApp(screen);
}

function getData() {
  if (!gameData) {
    throw new Error("Game data has not loaded.");
  }
  return gameData;
}

function getScene(sceneId = state.sceneId) {
  const scene = getData().scenes[sceneId];
  if (!scene) {
    throw new Error(`Scene "${sceneId}" does not exist.`);
  }
  return scene;
}

function getCurrentLine() {
  if (state.inspection) {
    return state.inspection.lines[state.inspection.index];
  }

  return getScene().dialogues[state.dialogueIndex];
}

function createInitialUnlocks(data: GameData) {
  const unlocked = emptyUnlocks();

  for (const [id, memory] of Object.entries(data.memories)) {
    if (memory.initiallyUnlocked) {
      unlocked.memories[id] = true;
    }
  }

  for (const [id, letter] of Object.entries(data.letters)) {
    if (letter.initiallyUnlocked) {
      unlocked.letters[id] = true;
    }
  }

  for (const [id, item] of Object.entries(data.gallery)) {
    if (item.initiallyUnlocked) {
      unlocked.gallery[id] = true;
    }
  }

  return unlocked;
}

function mergeInitialUnlocks() {
  const data = getData();
  const initial = createInitialUnlocks(data);
  state.unlocked.memories = { ...initial.memories, ...state.unlocked.memories };
  state.unlocked.letters = { ...initial.letters, ...state.unlocked.letters };
  state.unlocked.gallery = { ...initial.gallery, ...state.unlocked.gallery };
}

function hasRequiredFlags(required?: string[]) {
  return !required?.some((flag) => !state.flags[flag]);
}

function hasRequiredMemories(required?: string[]) {
  return !required?.some((memory) => !state.unlocked.memories[memory]);
}

function hasUnlockedAllMemories() {
  return Object.keys(getData().memories).every((memoryId) => state.unlocked.memories[memoryId]);
}

function getNextChapterMemory() {
  const sortedMemories = getSortedMemories();
  return (
    sortedMemories.find(
      ([memoryId, memory]) => state.unlocked.memories[memoryId] && !state.completedScenes[memory.scene],
    ) ?? sortedMemories.find(([, memory]) => !state.completedScenes[memory.scene])
  );
}

function shouldShowNextMemoryButton() {
  return Boolean(getNextChapterMemory());
}

function isHiddenByFlags(hiddenWhen?: string[]) {
  return Boolean(hiddenWhen?.some((flag) => state.flags[flag]));
}

function applyUnlocks(unlocks?: UnlockSet) {
  const data = getData();
  const gained: string[] = [];

  for (const id of unlocks?.memories ?? []) {
    if (!state.unlocked.memories[id]) {
      state.unlocked.memories[id] = true;
      gained.push(`Recuerdo: ${data.memories[id]?.title ?? id}`);
    }
  }

  for (const id of unlocks?.letters ?? []) {
    if (!state.unlocked.letters[id]) {
      state.unlocked.letters[id] = true;
      gained.push(`Carta: ${data.letters[id]?.title ?? id}`);
    }
  }

  for (const id of unlocks?.gallery ?? []) {
    if (!state.unlocked.gallery[id]) {
      state.unlocked.gallery[id] = true;
      gained.push(`Galería: ${data.gallery[id]?.title ?? id}`);
    }
  }

  for (const word of unlocks?.words ?? []) {
    if (!state.unlocked.words[word]) {
      state.unlocked.words[word] = true;
      gained.push(`Palabra: ${word}`);
    }
  }

  if (gained.length > 0) {
    audio.playSfx("unlock");
  }
  saveGame();
  return gained;
}

function runActions(actions?: Action[]) {
  if (!actions?.length) {
    return false;
  }

  for (const action of actions) {
    if (action.type === "setFlag") {
      state.flags[action.flag] = action.value ?? true;
      continue;
    }

    if (action.type === "playSfx") {
      audio.playSfx(action.sfx);
      continue;
    }

    if (action.type === "unlock") {
      applyUnlocks(action);
      continue;
    }

    if (action.type === "goToScene") {
      enterScene(action.scene, action.dialogueIndex ?? 0);
      return true;
    }

    if (action.type === "goToNextChapter") {
      enterNextChapter();
      return true;
    }

    if (action.type === "startMinigame") {
      beginMinigame(action.minigame);
      return true;
    }

    if (action.type === "showLetter") {
      state.unlocked.letters[action.letter] = true;
      renderLetter(action.letter, "game");
      return true;
    }

    if (action.type === "showGalleryItem") {
      state.unlocked.gallery[action.item] = true;
      renderGalleryItem(action.item, "game");
      return true;
    }

    if (action.type === "showScreen") {
      renderScreen(action.screen);
      return true;
    }

    if (action.type === "completeChapter") {
      completeScene(state.sceneId);
      return true;
    }
  }

  saveGame();
  return false;
}

function renderScreen(screen: Exclude<Screen, "game" | "minigame">) {
  if (screen === "menu") {
    renderMenu();
    return;
  }
  if (screen === "memories") {
    renderMemories();
    return;
  }
  if (screen === "letters") {
    renderLetters();
    return;
  }
  if (screen === "gallery") {
    renderGallery("gallery");
    return;
  }
  if (screen === "gallery_extra") {
    renderGallery("gallery_extra");
    return;
  }
  if (screen === "options") {
    renderOptions();
    return;
  }
  if (screen === "credits") {
    renderCredits();
    return;
  }
  renderExit();
}

function enterScene(sceneId: string, dialogueIndex = 0) {
  const scene = getScene(sceneId);
  state.screen = "game";
  state.sceneId = sceneId;
  state.dialogueIndex = Math.max(0, Math.min(dialogueIndex, scene.dialogues.length - 1));
  state.inspection = undefined;
  state.activeMinigame = undefined;
  lastLineAudioKey = "";
  audio.playMusic(scene.music);
  saveGame();
  renderGame();
}

function enterNextChapter() {
  const nextMemory = getNextChapterMemory();
  if (nextMemory) {
    const [memoryId, memory] = nextMemory;
    state.unlocked.memories[memoryId] = true;
    enterScene(memory.scene);
    return;
  }

  renderCredits();
}

function startNewGame() {
  if (loadSave() && !window.confirm("Esto borrara el progreso guardado. Quieres empezar de nuevo?")) {
    return;
  }

  const data = getData();
  state = {
    screen: "game",
    sceneId: data.startScene,
    dialogueIndex: 0,
    flags: {},
    unlocked: createInitialUnlocks(data),
    completedScenes: {},
    completedMinigames: {},
    musicMuted: state.musicMuted,
    sfxMuted: state.sfxMuted,
  };
  resetSave();
  audio.setMusicMuted(state.musicMuted);
  audio.setSfxMuted(state.sfxMuted);
  enterScene(data.startScene);
}

function continueGame() {
  const save = loadSave();
  if (!save || !restoreSave(save)) {
    return;
  }
}

function enterSavedHub() {
  const save = loadSave();
  if (!save) {
    return;
  }
  restoreSave(save, getData().startScene, 0);
}

function restoreSave(save: SaveData, targetSceneId = save.sceneId, targetDialogueIndex = save.dialogueIndex) {
  if (!getData().scenes[save.sceneId]) {
    localStorage.removeItem(SAVE_KEY);
    return false;
  }

  state = {
    screen: "game",
    sceneId: targetSceneId,
    dialogueIndex: targetDialogueIndex,
    flags: save.flags ?? {},
    unlocked: save.unlocked ?? createInitialUnlocks(getData()),
    completedScenes: save.completedScenes ?? {},
    completedMinigames: save.completedMinigames ?? {},
    musicMuted: state.musicMuted,
    sfxMuted: state.sfxMuted,
  };
  mergeInitialUnlocks();
  audio.setMusicMuted(state.musicMuted);
  audio.setSfxMuted(state.sfxMuted);
  enterScene(targetSceneId, targetDialogueIndex);
  return true;
}

function renderMenu() {
  const data = getData();
  state.screen = "menu";
  audio.playMusic("menu");

  const screen = el("main", "menu-screen");
  screen.style.backgroundImage = `linear-gradient(rgba(8, 14, 28, 0.32), rgba(8, 14, 28, 0.78)), url("${assetUrl("assets/backgrounds/bg_habitacion_recuerdos.png")}")`;

  const panel = el("section", "menu-panel");
  const eyebrow = el("p", "eyebrow", "Segundo aniversario");
  const title = el("h1", "menu-title", data.title);
  const subtitle = el(
    "p",
    "menu-subtitle",
    data.subtitle ?? "Algunos recuerdos no se cuentan. Se recorren.",
  );
  const actions = el("div", "menu-actions");
  const hasSave = Boolean(loadSave());
  const startButton = hasSave
    ? makeButton("secondary-button", "Habitación", enterSavedHub)
    : makeButton("primary-button", "Empezar", startNewGame);
  const continueButton = hasSave
    ? makeButton("primary-button", "Continuar", continueGame)
    : makeButton("secondary-button", "Continuar", continueGame);
  continueButton.disabled = !hasSave;

  actions.append(continueButton, startButton, makeIconButton("ghost-button", "settings", "Opciones", renderOptions));

  panel.append(eyebrow, title, subtitle, actions);
  screen.append(panel);
  replaceApp(screen);
}

function renderGame() {
  const data = getData();
  const scene = getScene();
  const line = getCurrentLine();

  if (!line) {
    renderSceneEnd();
    return;
  }

  const shell = el("main", "game-shell");
  const stage = el("section", "stage");
  stage.style.backgroundImage = `url("${assetUrl(scene.background)}")`;

  const topbar = renderTopbar(scene);

  const objectLayer = el("div", "object-layer");
  for (const clickable of scene.clickables ?? []) {
    if (
      !hasRequiredFlags(clickable.requiresFlags) ||
      !hasRequiredMemories(clickable.requiresMemories) ||
      isHiddenByFlags(clickable.hiddenWhenFlags)
    ) {
      continue;
    }
    objectLayer.append(renderClickable(clickable));
  }

  const characterLayer = el("div", "character-layer");
  const characterId = line.character;
  const character = characterId ? data.characters[characterId] : undefined;
  const sprite = line.sprite ?? character?.sprite;
  if (sprite) {
    const characterSlot = el("div", `character-slot ${character?.side ?? "center"}`);
    const characterImage = el("img", "character-sprite");
    characterImage.src = assetUrl(sprite);
    characterImage.alt = character?.name ?? "";
    if (character?.spriteOffset?.x) {
      characterSlot.style.setProperty("--character-sprite-offset-x", character.spriteOffset.x);
    }
    if (character?.spriteOffset?.y) {
      characterSlot.style.setProperty("--character-sprite-offset-y", character.spriteOffset.y);
    }
    if (character?.spriteWidth) {
      characterSlot.style.setProperty("--character-sprite-width", character.spriteWidth);
    }
    if (character?.spriteMaxHeight) {
      characterSlot.style.setProperty("--character-sprite-max-height", character.spriteMaxHeight);
    }
    if (character?.spriteBottom) {
      characterSlot.style.setProperty("--character-sprite-bottom", character.spriteBottom);
    }
    if (character?.spriteMobileWidth) {
      characterSlot.style.setProperty("--character-sprite-mobile-width", character.spriteMobileWidth);
    }
    if (character?.spriteMobileMaxHeight) {
      characterSlot.style.setProperty("--character-sprite-mobile-max-height", character.spriteMobileMaxHeight);
    }
    if (character?.spriteMobileBottom) {
      characterSlot.style.setProperty("--character-sprite-mobile-bottom", character.spriteMobileBottom);
    }
    if (character?.spriteMobileOffset?.x) {
      characterSlot.style.setProperty("--character-sprite-mobile-offset-x", character.spriteMobileOffset.x);
    }
    if (character?.spriteMobileOffset?.y) {
      characterSlot.style.setProperty("--character-sprite-mobile-offset-y", character.spriteMobileOffset.y);
    }
    if (isCharacterAnimation(line.characterAnimation)) {
      characterImage.classList.add(`character-animation-${line.characterAnimation}`);
    }
    characterSlot.append(characterImage);
    characterLayer.append(characterSlot);
  }

  const dialogue = renderDialogue(line, character);
  stage.append(topbar, objectLayer, characterLayer);
  shell.append(stage, dialogue);
  replaceApp(shell);
  const dialogueText = dialogue.querySelector<HTMLElement>(".dialogue-text");
  if (dialogueText) {
    typeDialogueText(dialogueText, line);
  }
  playLineAudio(line);
}

function renderTopbar(scene: Scene) {
  const topbar = el("div", "topbar");
  const sceneLabel = el("div", "scene-name", scene.name);
  const topActions = el("div", "top-actions");
  if (!scene.hub) {
    topActions.append(makeIconButton("icon-button", "back", "Habitación", () => enterScene(getData().startScene)));
  }
  topActions.append(
    makeIconButton("icon-button", "settings", "Opciones", renderOptions),
    makeIconButton("icon-button", "home", "Menú", renderMenu),
  );
  topbar.append(sceneLabel, topActions);
  return topbar;
}

function renderClickable(clickable: Clickable) {
  const button = el("button", "clickable");
  button.style.left = `${clickable.x}%`;
  button.style.top = `${clickable.y}%`;
  button.style.width = `${clickable.width}%`;
  button.style.height = `${clickable.height}%`;
  const titleText = clickable.tooltip ?? clickable.label;
  button.classList.add(
    clickable.y < 18 ? "title-below" : "title-above",
    clickable.x < 18 ? "title-left" : clickable.x + clickable.width > 82 ? "title-right" : "title-center",
  );
  button.setAttribute("aria-label", titleText === clickable.label ? clickable.label : `${clickable.label}: ${titleText}`);

  if (clickable.image || clickable.hoverImage) {
    const image = el("img");
    image.alt = "";
    button.append(image);

    if (clickable.image) {
      image.src = assetUrl(clickable.image);
    } else {
      image.style.opacity = "0";
    }

    if (clickable.hoverImage) {
      const normalImage = clickable.image ? assetUrl(clickable.image) : undefined;
      const hoverImage = assetUrl(clickable.hoverImage);
      const preload = new Image();
      preload.src = hoverImage;

      const showHoverImage = () => {
        image.src = hoverImage;
        image.style.opacity = "1";
        image.classList.toggle("framed-hover-image", clickable.hoverImageStyle === "framed");
      };
      const showNormalImage = () => {
        if (normalImage) {
          image.src = normalImage;
        } else {
          image.style.opacity = "0";
        }
        image.classList.remove("framed-hover-image");
      };

      button.addEventListener("mouseenter", showHoverImage);
      button.addEventListener("mouseleave", showNormalImage);
      button.addEventListener("focus", showHoverImage);
      button.addEventListener("blur", showNormalImage);
    }
  }

  button.append(el("span", "clickable-title", titleText));

  if (clickable.hoverSfx) {
    const playHoverSfx = () => audio.playObjectSfx(clickable.hoverSfx, clickable.hoverSfxVolume);
    button.addEventListener("mouseenter", playHoverSfx);
    button.addEventListener("focus", playHoverSfx);
  }

  if (clickable.hoverOutSfx) {
    const playHoverOutSfx = () => audio.playObjectSfx(clickable.hoverOutSfx, clickable.hoverOutSfxVolume);
    button.addEventListener("mouseleave", playHoverOutSfx);
    button.addEventListener("blur", playHoverOutSfx);
  }

  button.addEventListener("click", () => {
    audio.playObjectSfx(clickable.clickSfx ?? clickable.sfx ?? "click", clickable.clickSfxVolume);
    const rendered = runActions(clickable.actions);
    if (rendered) {
      return;
    }

    if (clickable.inspectDialogue?.length) {
      state.inspection = {
        clickableId: clickable.id,
        lines: clickable.inspectDialogue,
        index: 0,
      };
      lastLineAudioKey = "";
      saveGame();
      renderGame();
    }
  });

  return button;
}

function renderDialogue(line: DialogueLine, character?: Character) {
  const box = el("section", "dialogue-box");
  const meta = el("div", "dialogue-meta");
  const speaker = el("strong", "speaker", character?.name ?? "Recuerdo");
  speaker.style.color = character?.color ?? "#ffe6a8";

  const progress = state.inspection
    ? `Objeto ${state.inspection.index + 1}/${state.inspection.lines.length}`
    : `${state.dialogueIndex + 1}/${getScene().dialogues.length}`;
  const counter = el("span", "dialogue-counter", progress);
  meta.append(speaker, counter);

  const text = el("p", `dialogue-text${line.important ? " important-line" : ""}`);

  const controls = el("div", "dialogue-controls");
  const choices = getVisibleChoices(line);

  if (choices.length > 0 && !state.inspection) {
    const choicesWrap = el("div", "choices");
    for (const choice of choices) {
      const choiceButton = el("button", "choice-button", choice.label);
      choiceButton.addEventListener("click", () => choose(choice));
      choicesWrap.append(choiceButton);
    }
    controls.append(choicesWrap);
  } else {
    const next = el(
      "button",
      "primary-button next-button",
      state.inspection ? "Seguir inspeccionando" : "Siguiente",
    );
    next.addEventListener("click", advanceDialogue);
    controls.append(next);
  }

  if (state.inspection) {
    const close = makeButton("ghost-button", "Cerrar", () => {
      state.inspection = undefined;
      renderGame();
    });
    controls.append(close);
  }

  box.append(meta, text, controls);
  return box;
}

function isCharacterAnimation(animation?: string): animation is CharacterAnimation {
  return Boolean(animation && (CHARACTER_ANIMATIONS as readonly string[]).includes(animation));
}

function isTextAnimation(animation: string): animation is TextAnimation {
  return (TEXT_ANIMATIONS as readonly string[]).includes(animation);
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseDialogueText(text: string) {
  const segments: DialogueTextSegment[] = [];
  const tagPattern = /\[anim=([a-zA-Z0-9_-]+)\]([\s\S]*?)\[\/anim\]/g;
  let cursor = 0;

  for (const match of text.matchAll(tagPattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex) });
    }

    const animation = match[1].toLowerCase();
    const animatedText = match[2];
    segments.push(isTextAnimation(animation) ? { text: animatedText, animation } : { text: animatedText });
    cursor = matchIndex + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments.filter((segment) => segment.text.length > 0);
}

function renderDialogueTextSegments(target: HTMLElement, segments: DialogueTextSegment[], visibleChars: number) {
  target.replaceChildren();
  let remaining = visibleChars;

  for (const segment of segments) {
    if (remaining <= 0) {
      break;
    }

    const visibleText = segment.text.slice(0, remaining);
    if (segment.animation) {
      const animated = el("span", `dialogue-text-anim dialogue-text-anim-${segment.animation}`);
      animated.textContent = visibleText;
      target.append(animated);
    } else {
      target.append(document.createTextNode(visibleText));
    }
    remaining -= visibleText.length;
  }
}

function typeDialogueText(target: HTMLElement, line: DialogueLine) {
  const segments = parseDialogueText(line.text);
  const totalChars = segments.reduce((total, segment) => total + segment.text.length, 0);
  const typingSpeed = Math.max(0, line.typingSpeed ?? DEFAULT_TYPING_SPEED);

  if (shouldReduceMotion() || typingSpeed === 0 || totalChars === 0) {
    renderDialogueTextSegments(target, segments, totalChars);
    return;
  }

  renderDialogueTextSegments(target, segments, 0);
  activeTyping = {
    target,
    segments,
    visibleChars: 0,
    totalChars,
  };

  activeTyping.timer = window.setInterval(() => {
    if (!activeTyping) {
      return;
    }

    activeTyping.visibleChars += 1;
    renderDialogueTextSegments(target, segments, activeTyping.visibleChars);
    if (activeTyping.visibleChars >= totalChars) {
      clearActiveTyping();
    }
  }, typingSpeed);
}

function getVisibleChoices(line: DialogueLine) {
  return (line.choices ?? []).filter(
    (choice) => hasRequiredFlags(choice.requiresFlags) && hasRequiredMemories(choice.requiresMemories),
  );
}

function choose(choice: Choice) {
  if (completeActiveTyping()) {
    return;
  }

  audio.playSfx(choice.sfx ?? "choice");
  const rendered = runActions(choice.actions);
  if (rendered) {
    return;
  }

  if (choice.goToScene) {
    enterScene(choice.goToScene, choice.dialogueIndex ?? 0);
    return;
  }

  if (typeof choice.dialogueIndex === "number") {
    state.dialogueIndex = choice.dialogueIndex;
    state.inspection = undefined;
    saveGame();
    renderGame();
    return;
  }

  advanceDialogue();
}

function advanceDialogue() {
  if (completeActiveTyping()) {
    return;
  }

  const line = getCurrentLine();
  audio.playSfx("blip");

  if (state.inspection) {
    const rendered = runActions(line.actions);
    if (rendered) {
      return;
    }

    if (state.inspection.index < state.inspection.lines.length - 1) {
      state.inspection.index += 1;
    } else {
      state.inspection = undefined;
    }
    saveGame();
    renderGame();
    return;
  }

  const rendered = runActions(line.actions);
  if (rendered) {
    return;
  }

  const scene = getScene();
  if (state.dialogueIndex < scene.dialogues.length - 1) {
    state.dialogueIndex += 1;
    saveGame();
    renderGame();
    return;
  }

  renderSceneEnd();
}

function renderSceneEnd() {
  const scene = getScene();

  if (scene.hub) {
    renderHubEnd(scene);
    return;
  }

  const shell = el("main", "game-shell");
  const stage = el("section", "stage");
  stage.style.backgroundImage = `url("${assetUrl(scene.background)}")`;
  const box = el("section", "dialogue-box end-box");
  const title = el("strong", "speaker", scene.completionTitle ?? "Recuerdo completo");
  const text = el(
    "p",
    "dialogue-text",
    scene.completionText ?? "Este recuerdo ya puede quedarse guardado en la habitación.",
  );
  const controls = el("div", "dialogue-controls");
  controls.append(
    makeButton("primary-button", scene.completeLabel ?? "Guardar recuerdo", () => completeScene(state.sceneId)),
    makeButton("secondary-button", "Recuerdos", renderMemories),
    makeButton("ghost-button", "Habitación", () => enterScene(getData().startScene)),
  );
  box.append(title, text, controls);
  stage.append(renderTopbar(scene));
  shell.append(stage, box);
  replaceApp(shell);
}

function renderHubEnd(scene: Scene) {
  const shell = el("main", "game-shell");
  const stage = el("section", "stage");
  stage.style.backgroundImage = `url("${assetUrl(scene.background)}")`;
  const objectLayer = el("div", "object-layer");
  for (const clickable of scene.clickables ?? []) {
    objectLayer.append(renderClickable(clickable));
  }
  const showNextMemoryButton = shouldShowNextMemoryButton();
  const box = el("section", "dialogue-box end-box");
  const title = el("strong", "speaker", "Habitación de recuerdos");
  const text = el(
    "p",
    "dialogue-text",
    showNextMemoryButton
      ? "La cajita, el álbum y el mapa siguen aquí. Puedes continuar el siguiente recuerdo o revisar lo que ya guardaste."
      : "La cajita, el álbum y el mapa siguen aquí. Puedes revisar lo que ya guardaste.",
  );
  const controls = el("div", "dialogue-controls");
  if (showNextMemoryButton) {
    controls.append(makeButton("primary-button", "Siguiente recuerdo", enterNextChapter));
  }
  box.append(title, text, controls);
  stage.append(renderTopbar(scene), objectLayer);
  shell.append(stage, box);
  replaceApp(shell);
}

function completeScene(sceneId: string, skipMinigame = false) {
  const scene = getScene(sceneId);
  if (scene.minigameId && !skipMinigame && !state.completedMinigames[scene.minigameId]) {
    beginMinigame(scene.minigameId, sceneId);
    return;
  }

  const gained = applySceneRewards(sceneId);
  saveGame();

  if (scene.chapter === 30) {
    renderLetter("carta_final", "credits");
    return;
  }

  const showNextMemoryButton = Boolean(scene.nextScene) && shouldShowNextMemoryButton();
  renderUnlockScreen(
    scene.completionTitle ?? "Recuerdo guardado",
    scene.completionText ?? "El recuerdo quedó guardado en la habitación.",
    gained,
    () => {
      if (showNextMemoryButton && scene.nextScene) {
        enterScene(scene.nextScene);
      } else {
        enterScene(getData().startScene);
      }
    },
    showNextMemoryButton ? "Siguiente recuerdo" : "Volver a la habitación",
  );
}

function applySceneRewards(sceneId: string) {
  const data = getData();
  const scene = getScene(sceneId);
  const gained: string[] = [];
  const memoryId = scene.memoryId ?? Object.entries(data.memories).find(([, memory]) => memory.scene === sceneId)?.[0];
  const unlocks: UnlockSet = {
    memories: memoryId ? [memoryId] : [],
    letters: scene.unlocks?.letters ?? [],
    gallery: scene.unlocks?.gallery ?? [],
    words: [scene.word, ...(scene.unlocks?.words ?? [])].filter(Boolean) as string[],
  };

  state.completedScenes[sceneId] = true;
  gained.push(...applyUnlocks(unlocks));

  const currentMemory = memoryId ? data.memories[memoryId] : undefined;
  const nextMemory = getSortedMemories().find(
    ([, memory]) => memory.chapter === (currentMemory?.chapter ?? 0) + 1,
  );
  if (nextMemory && !state.unlocked.memories[nextMemory[0]]) {
    state.unlocked.memories[nextMemory[0]] = true;
    gained.push(`Nuevo capítulo: ${nextMemory[1].title}`);
  }

  return gained.length > 0 ? gained : ["Progreso actualizado"];
}

function renderUnlockScreen(
  titleText: string,
  bodyText: string,
  gained: string[],
  next: () => void,
  nextLabel = "Continuar",
) {
  const screen = el("main", "modal-screen");
  screen.style.backgroundImage = `linear-gradient(rgba(8, 14, 28, 0.55), rgba(8, 14, 28, 0.88)), url("${assetUrl(getScene().background)}")`;
  const panel = el("section", "unlock-panel");
  const title = el("h1", "screen-title", titleText);
  const body = el("p", "screen-copy", bodyText);
  const list = el("ul", "unlock-list");
  for (const item of gained) {
    list.append(el("li", undefined, item));
  }
  const controls = el("div", "dialogue-controls");
  controls.append(makeButton("primary-button", nextLabel, next), makeButton("ghost-button", "Menú", renderMenu));
  panel.append(title, body, list, controls);
  screen.append(panel);
  replaceApp(screen);
}

function beginMinigame(minigameId: string, returnSceneId?: string) {
  if (!getData().minigames[minigameId]) {
    throw new Error(`Minigame "${minigameId}" does not exist.`);
  }
  state.screen = "minigame";
  state.activeMinigame = {
    id: minigameId,
    selected: [],
    returnSceneId,
  };
  audio.playSfx("sparkle");
  renderMinigame();
}

function renderMinigame() {
  const active = state.activeMinigame;
  if (!active) {
    renderGame();
    return;
  }

  const minigame = getData().minigames[active.id];
  const ordered = minigame.kind === "sequence" || minigame.kind === "order";
  const screen = el("main", `minigame-screen ${minigame.kind}`);
  const panel = el("section", "minigame-panel");
  const title = el("h1", "screen-title", minigame.title);
  const prompt = el("p", "screen-copy", minigame.prompt);
  const progress = el(
    "p",
    "minigame-progress",
    `${active.selected.length}/${minigame.items.length} pasos`,
  );
  const board = el("div", "minigame-board");

  for (const item of minigame.items) {
    const selected = active.selected.includes(item.id);
    const button = el("button", selected ? "minigame-item selected" : "minigame-item", item.label);
    button.disabled = selected;
    button.title = item.hint ?? item.label;
    button.addEventListener("click", () => selectMinigameItem(item.id, ordered));
    board.append(button);
  }

  const feedback = el("p", "minigame-feedback", active.feedback ?? " ");
  const controls = el("div", "dialogue-controls");
  controls.append(
    makeButton("ghost-button", "Reiniciar", () => {
      state.activeMinigame = { ...active, selected: [], feedback: undefined };
      renderMinigame();
    }),
    makeButton("ghost-button", "Volver", () => {
      state.activeMinigame = undefined;
      if (active.returnSceneId) {
        renderSceneEnd();
      } else {
        renderGame();
      }
    }),
  );

  panel.append(title, prompt, progress, board, feedback, controls);
  screen.append(panel);
  replaceApp(screen);
}

function selectMinigameItem(itemId: string, ordered: boolean) {
  const active = state.activeMinigame;
  if (!active) {
    return;
  }
  const minigame = getData().minigames[active.id];
  const nextExpected = minigame.items[active.selected.length]?.id;

  if (ordered && itemId !== nextExpected) {
    state.activeMinigame = {
      ...active,
      selected: [],
      feedback: "Ese paso no iba todavía. Inténtalo otra vez desde el inicio.",
    };
    audio.playSfx("soft");
    renderMinigame();
    return;
  }

  const selected = [...active.selected, itemId];
  state.activeMinigame = {
    ...active,
    selected,
    feedback: selected.length === minigame.items.length ? minigame.successText : "Bien. Sigue.",
  };
  audio.playSfx(selected.length === minigame.items.length ? "unlock" : "choice");

  if (selected.length === minigame.items.length) {
    finishMinigame(active.id, active.returnSceneId);
    return;
  }

  renderMinigame();
}

function finishMinigame(minigameId: string, returnSceneId?: string) {
  const minigame = getData().minigames[minigameId];
  state.completedMinigames[minigameId] = true;
  state.activeMinigame = undefined;
  const gained = applyUnlocks(minigame.unlocks);
  saveGame();

  if (returnSceneId) {
    completeScene(returnSceneId, true);
    return;
  }

  renderUnlockScreen(minigame.title, minigame.successText, gained, renderGame);
}

function renderMemories() {
  state.screen = "memories";
  audio.playMusic("hub");

  const screen = renderCatalogShell("Recuerdos", "Entre inicio, manos, cartas, música, calma, confianza, futuro y estrellas, todo me lleva a elegirte.");
  const grid = el("div", "catalog-grid memory-grid");

  for (const [id, memory] of getSortedMemories()) {
    const unlocked = state.unlocked.memories[id];
    const completed = state.completedScenes[memory.scene];
    const card = el("article", unlocked ? "catalog-card" : "catalog-card locked");
    const number = el("span", "chapter-pill", `Cap. ${memory.chapter}`);
    const title = el("h2", undefined, unlocked ? memory.title : "Recuerdo bloqueado");
    const meta = el("p", "catalog-meta", unlocked ? `${memory.date} · ${memory.word}` : "Sigue avanzando para abrirlo.");
    const copy = el("p", "catalog-copy", unlocked ? memory.description : "Un objeto de la habitación guardará este momento cuando sea tiempo.");
    const status = el("span", completed ? "status done" : "status", completed ? "Guardado" : "Pendiente");
    card.append(number, title, meta, copy, status);
    if (unlocked) {
      const label = completed ? "Revisitar" : "Jugar";
      card.append(
        makeIconTextButton("secondary-button small-button", "play", label, () => enterScene(memory.scene), `${label} ${memory.title}`),
      );
    }
    grid.append(card);
  }

  screen.querySelector(".catalog-body")?.append(grid);
  replaceApp(screen);
}

function renderLetters() {
  state.screen = "letters";
  audio.playMusic("letters");

  const screen = renderCatalogShell("Cartas", "Papel beige, sonidos suaves y palabras que se quedan.");
  const grid = el("div", "catalog-grid");

  for (const [id, letter] of Object.entries(getData().letters)) {
    const unlocked = state.unlocked.letters[id];
    const card = el("article", unlocked ? "catalog-card letter-card" : "catalog-card letter-card locked");
    card.append(
      el("h2", undefined, unlocked ? letter.title : "Carta bloqueada"),
      el("p", "catalog-meta", unlocked ? letter.date : "Todavía está en la cajita."),
      el("p", "catalog-copy", unlocked ? letter.description : "Se desbloquea al avanzar por los recuerdos."),
    );
    if (unlocked) {
      card.append(makeIconTextButton("secondary-button small-button", "letter", "Leer", () => renderLetter(id, "letters"), `Leer ${letter.title}`));
    }
    grid.append(card);
  }

  screen.querySelector(".catalog-body")?.append(grid);
  replaceApp(screen);
}

function renderLetter(id: string, back: ReturnScreen) {
  const letter = getData().letters[id];
  if (!letter) {
    renderLetters();
    return;
  }
  state.unlocked.letters[id] = true;
  saveGame();

  const screen = el("main", "letter-screen");
  const paper = el("article", "paper-panel");
  paper.append(el("p", "eyebrow", letter.date), el("h1", "screen-title", letter.title));
  for (const paragraph of letter.paragraphs) {
    paper.append(el("p", "letter-paragraph", paragraph));
  }
  const controls = el("div", "dialogue-controls");
  controls.append(
    makeIconTextButton("primary-button", "save", "Guardar en la cajita", () => renderScreen(back === "game" ? "letters" : back), "Guardar en la cajita"),
    makeIconButton("ghost-button", "home", "Menú", renderMenu),
  );
  paper.append(controls);
  screen.append(paper);
  replaceApp(screen);
}

function getGalleryCollection(gallery: GalleryScreen) {
  const data = getData();
  return gallery === "gallery_extra" ? data.gallery_extra ?? {} : data.gallery;
}

function renderGallery(gallery: GalleryScreen = "gallery") {
  if (gallery === "gallery_extra") {
    renderGalleryExtra();
    return;
  }

  state.screen = gallery;
  audio.playMusic("hub");

  const screen = renderCatalogShell("Galería", "Fotos reales y espacios temporales para cambiarlos luego por PNG o JPG.");
  const grid = el("div", "catalog-grid gallery-grid");

  for (const [id, item] of Object.entries(getData().gallery)) {
    const unlocked = state.unlocked.gallery[id];
    const card = el("article", unlocked ? "catalog-card gallery-card" : "catalog-card gallery-card locked");
    const image = el("img", "gallery-thumb");
    image.src = assetUrl(unlocked ? item.image : "assets/ui/photo_locked.svg");
    image.alt = unlocked ? item.title : "";
    card.append(
      image,
      el("h2", undefined, unlocked ? item.title : "Foto pendiente"),
      el("p", "catalog-meta", unlocked ? `${item.date} · ${item.category}` : "Pendiente"),
      el("p", "catalog-copy", unlocked ? item.description : "Reemplaza este espacio cuando tengas la foto real."),
    );
    if (unlocked) {
      card.append(makeIconTextButton("secondary-button small-button", "image", "Ver", () => renderGalleryItem(id, "gallery"), `Ver ${item.title}`));
    }
    grid.append(card);
  }

  screen.querySelector(".catalog-body")?.append(grid);
  replaceApp(screen);
}

function renderGalleryExtra() {
  if (!hasUnlockedAllMemories()) {
    renderGalleryExtraLockedNotice();
    return;
  }

  state.screen = "gallery_extra";
  audio.playMusic("hub");

  const screen = renderCatalogShell("Galeria extra", "Fotos extra guardadas en este cajon de recuerdos.");
  const grid = el("div", "catalog-grid gallery-grid");

  for (const [id, item] of Object.entries(getGalleryCollection("gallery_extra"))) {
    const card = el("article", "catalog-card gallery-card");
    const image = el("img", "gallery-thumb");
    image.src = assetUrl(item.image);
    image.alt = item.title;
    card.append(
      image,
      el("h2", undefined, item.title),
      el("p", "catalog-meta", `${item.date} Â· ${item.category}`),
      el("p", "catalog-copy", item.description),
      makeIconTextButton("secondary-button small-button", "image", "Ver", () => renderGalleryItem(id, "gallery_extra", "gallery_extra"), `Ver ${item.title}`),
    );
    grid.append(card);
  }

  screen.querySelector(".catalog-body")?.append(grid);
  replaceApp(screen);
}

function renderGalleryExtraLockedNotice() {
  audio.playSfx("soft");

  const screen = el("main", "modal-screen");
  const currentScene = getData().scenes[state.sceneId];
  if (currentScene) {
    screen.style.backgroundImage = `linear-gradient(rgba(8, 14, 28, 0.62), rgba(8, 14, 28, 0.9)), url("${assetUrl(currentScene.background)}")`;
  }

  const panel = el("section", "unlock-panel");
  panel.append(
    el("h1", "screen-title", "Cajon bloqueado"),
    el(
      "p",
      "screen-copy",
      "Para entrar aqui, primero debes completar o encontrar todos los recuerdos.",
    ),
    makeIconTextButton("primary-button", "back", "Volver a la habitación", () => enterScene(getData().startScene), "Volver a la habitación"),
  );
  screen.append(panel);
  replaceApp(screen);
}

function renderGalleryItem(id: string, back: ReturnScreen, gallery: GalleryScreen = "gallery") {
  const data = getData();
  let item: GalleryItem | undefined = getGalleryCollection(gallery)[id];
  let itemGallery = gallery;

  if (!item && gallery !== "gallery") {
    item = data.gallery[id];
    itemGallery = "gallery";
  }

  if (!item && gallery !== "gallery_extra") {
    item = data.gallery_extra?.[id];
    itemGallery = "gallery_extra";
  }

  if (!item) {
    renderGallery(back === "gallery_extra" ? "gallery_extra" : "gallery");
    return;
  }
  if (itemGallery === "gallery") {
    state.unlocked.gallery[id] = true;
  }
  saveGame();

  const screen = el("main", "gallery-detail-screen");
  const panel = el("section", "gallery-detail");
  const image = el("img", "gallery-image");
  image.src = assetUrl(item.image);
  image.alt = item.title;
  panel.append(
    image,
    el("p", "eyebrow", item.date),
    el("h1", "screen-title", item.title),
    el("p", "screen-copy", item.description),
  );
  const controls = el("div", "dialogue-controls");
  const backScreen: Exclude<Screen, "game" | "minigame"> = back === "game" ? itemGallery : back;
  controls.append(
    makeIconButton("primary-button", "back", "Volver", () => renderScreen(backScreen)),
    makeIconButton("ghost-button", "home", "Menú", renderMenu),
  );
  panel.append(controls);
  screen.append(panel);
  replaceApp(screen);
}

function renderOptions() {
  openSettingsPopup();
}

function openSettingsPopup() {
  activeSettingsClose?.();

  const overlay = el("div", "settings-overlay");
  const panel = el("section", "settings-popover");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Opciones del juego");

  const closePopup = () => {
    overlay.remove();
    window.removeEventListener("keydown", handleKeydown);
    if (activeSettingsClose === closePopup) {
      activeSettingsClose = undefined;
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closePopup();
    }
  };

  const renderSettingsContent = () => {
    const header = el("div", "settings-header");
    const titleBlock = el("div");
    titleBlock.append(el("p", "eyebrow", "Opciones"), el("h2", "settings-title", "Configuración"));
    header.append(
      titleBlock,
      makeIconButton("icon-button settings-close", "close", "Cerrar opciones", closePopup),
    );

    const controls = el("div", "settings-controls");
    controls.append(
      makeSettingsToggle("music", "Música", state.musicMuted, () => {
        state.musicMuted = !state.musicMuted;
        saveAudioSettings();
        audio.setMusicMuted(state.musicMuted);
        renderSettingsContent();
      }),
      makeSettingsToggle("speaker", "Efectos", state.sfxMuted, () => {
        state.sfxMuted = !state.sfxMuted;
        saveAudioSettings();
        audio.setSfxMuted(state.sfxMuted);
        renderSettingsContent();
      }),
    );

    const resetButton = makeButton("settings-reset", "Reiniciar progreso", () => {
      if (!window.confirm("Esto borrara todo el progreso guardado. Quieres reiniciar?")) {
        return;
      }

      resetSave();
      state.unlocked = createInitialUnlocks(getData());
      state.completedScenes = {};
      state.completedMinigames = {};
      state.flags = {};
      window.location.reload();
    });
    resetButton.prepend(makeIcon("reset"));

    panel.replaceChildren(
      header,
      controls,
      resetButton,
      el("p", "settings-hint", "Reinicia el progreso si cambiaste datos del juego y una partida quedó en un punto viejo."),
    );
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePopup();
    }
  });
  window.addEventListener("keydown", handleKeydown);

  renderSettingsContent();
  overlay.append(panel);
  app.append(overlay);
  activeSettingsClose = closePopup;

  const closeButton = panel.querySelector<HTMLButtonElement>(".settings-close");
  closeButton?.focus();
}

function makeSettingsToggle(icon: IconName, label: string, muted: boolean, onClick: () => void) {
  const action = muted ? "Activar" : "Silenciar";
  const button = el("button", `settings-toggle${muted ? " is-muted" : ""}`);
  button.type = "button";
  button.title = `${action} ${label.toLowerCase()}`;
  button.setAttribute("aria-label", `${action} ${label.toLowerCase()}`);
  button.setAttribute("aria-pressed", String(!muted));

  const copy = el("span", "settings-toggle-copy");
  copy.append(el("strong", "", label), el("span", "settings-toggle-status", muted ? "Apagado" : "Activo"));
  button.append(makeIcon(icon), copy);
  button.addEventListener("click", onClick);
  return button;
}

function renderCredits() {
  state.screen = "credits";
  audio.playMusic("final");
  const screen = el("main", "credits-screen");
  const panel = el("section", "credits-panel");
  panel.append(el("p", "eyebrow", "Créditos"), el("h1", "screen-title", "Todavía nos faltan cielos por mirar juntos"));
  for (const line of getData().credits) {
    panel.append(el("p", "screen-copy", line));
  }
  panel.append(
    makeButton("primary-button", "Volver al menú", renderMenu),
    makeButton("secondary-button", "Ver recuerdos", renderMemories),
  );
  screen.append(panel);
  replaceApp(screen);
}

function renderExit() {
  state.screen = "exit";
  const screen = el("main", "modal-screen");
  const panel = el("section", "unlock-panel");
  panel.append(
    el("h1", "screen-title", "Gracias por recorrerlo"),
    el("p", "screen-copy", "El navegador no permite cerrar la pestaña desde el juego. Puedes cerrarla cuando quieras; el progreso queda guardado."),
    makeButton("primary-button", "Volver al menú", renderMenu),
  );
  screen.append(panel);
  replaceApp(screen);
}

function renderCatalogShell(titleText: string, copyText: string) {
  const screen = el("main", "catalog-screen");
  const header = el("section", "catalog-header");
  header.append(el("h1", "screen-title", titleText), el("p", "screen-copy", copyText));
  const actions = el("div", "catalog-actions");
  actions.append(
    makeIconButton("secondary-button", "back", "Habitación", () => enterScene(getData().startScene)),
    makeIconButton("ghost-button", "home", "Menú", renderMenu),
  );
  if (shouldShowNextMemoryButton()) {
    actions.append(makeIconButton("primary-button", "next", "Siguiente recuerdo", enterNextChapter));
  }
  header.append(actions);
  const body = el("section", "catalog-body");
  screen.append(header, body);
  return screen;
}

function getSortedMemories() {
  return Object.entries(getData().memories).sort((a, b) => a[1].chapter - b[1].chapter);
}

function playLineAudio(line: DialogueLine) {
  const key = state.inspection
    ? `${state.sceneId}:object:${state.inspection.clickableId}:${state.inspection.index}`
    : `${state.sceneId}:dialogue:${state.dialogueIndex}`;
  if (key === lastLineAudioKey) {
    return;
  }

  lastLineAudioKey = key;
  audio.playSfx(line.sfx);
}

function handleKeyboard(event: KeyboardEvent) {
  if (state.screen !== "game") {
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    if (activeTyping) {
      event.preventDefault();
      completeActiveTyping();
      return;
    }

    const line = getCurrentLine();
    if (getVisibleChoices(line).length === 0 || state.inspection) {
      event.preventDefault();
      advanceDialogue();
    }
  }
}

function installAutosaveHandlers() {
  window.addEventListener("pagehide", saveGame);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveGame();
    }
  });
}

function installAudioUnlockHandlers() {
  const unlockAudio = () => {
    void audio.unlock();
  };

  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);
}

async function bootstrap() {
  if (isPhoneDevice()) {
    renderMobileDeviceNotice();
    return;
  }

  try {
    const response = await fetch(assetUrl("content/game.json"));
    if (!response.ok) {
      throw new Error(`Could not load content/game.json (${response.status}).`);
    }

    gameData = (await response.json()) as GameData;
    audio = new AudioManager(gameData.audio);
    state.unlocked = createInitialUnlocks(gameData);
    audio.setMusicMuted(state.musicMuted);
    audio.setSfxMuted(state.sfxMuted);
    installAudioUnlockHandlers();
    window.addEventListener("keydown", handleKeyboard);
    installAutosaveHandlers();

    const save = loadSave();
    if (save && restoreSave(save)) {
      return;
    }

    renderMenu();
  } catch (error) {
    const screen = el("main", "error-screen");
    const title = el("h1", undefined, "No se pudo cargar el juego");
    const detail = el(
      "p",
      undefined,
      error instanceof Error ? error.message : "Error desconocido.",
    );
    screen.append(title, detail);
    replaceApp(screen);
  }
}

bootstrap();
