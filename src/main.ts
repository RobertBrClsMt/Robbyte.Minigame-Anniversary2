import "./styles.css";

type FlagMap = Record<string, boolean>;
type UnlockMap = Record<string, boolean>;

type Screen =
  | "menu"
  | "game"
  | "memories"
  | "letters"
  | "gallery"
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

type DialogueLine = {
  character?: string;
  text: string;
  sprite?: string;
  sfx?: string;
  important?: boolean;
  actions?: Action[];
  choices?: Choice[];
};

type Clickable = {
  id: string;
  label: string;
  image?: string;
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
  muted: boolean;
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

const SAVE_KEY = "ven-a-buscarme-save-v2";
const LEGACY_SAVE_KEY = "anniversary-vn-save-v1";
const MUTE_KEY = "anniversary-vn-muted-v1";
const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Missing #app root element.");
}

const app = appElement;

let gameData: GameData | null = null;
let lastLineAudioKey = "";
let typeTimer: number | undefined;
let state: AppState = {
  screen: "menu",
  sceneId: "",
  dialogueIndex: 0,
  flags: {},
  unlocked: emptyUnlocks(),
  completedScenes: {},
  completedMinigames: {},
  muted: loadMuted(),
};

class AudioManager {
  private context?: AudioContext;
  private musicTimer?: number;
  private htmlMusic?: HTMLAudioElement;
  private currentMusic?: string;
  private muted = false;

  constructor(private readonly data?: GameData["audio"]) { }

  setMuted(muted: boolean) {
    this.muted = muted;
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

  playMusic(key?: string) {
    this.currentMusic = key;
    this.stopMusic(false);

    if (!key || this.muted) {
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

  playSfx(key?: string) {
    if (!key || this.muted) {
      return;
    }

    const source = this.data?.sfx?.[key] ?? key;
    if (source.startsWith("procedural:")) {
      this.playProceduralSfx(source.replace("procedural:", ""));
      return;
    }

    const audio = new Audio(assetUrl(source));
    audio.volume = 0.62;
    audio.play().catch(() => undefined);
  }

  private ensureContext() {
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") {
      this.context.resume().catch(() => undefined);
    }
    return this.context;
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

  private playProceduralSfx(variant: string) {
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
    this.playTone(frequency, duration, 0.085, wave);
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

function loadMuted() {
  return localStorage.getItem(MUTE_KEY) === "true";
}

function saveMuted() {
  localStorage.setItem(MUTE_KEY, String(state.muted));
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
  button.addEventListener("click", onClick);
  return button;
}

function replaceApp(node: HTMLElement) {
  if (typeTimer) {
    window.clearInterval(typeTimer);
    typeTimer = undefined;
  }
  app.replaceChildren(node);
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
    renderGallery();
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
  const nextMemory = getSortedMemories().find(
    ([, memory]) =>
      state.unlocked.memories[getMemoryId(memory)] && !state.completedScenes[memory.scene],
  );

  if (nextMemory) {
    enterScene(nextMemory[1].scene);
    return;
  }

  const lockedNext = getSortedMemories().find(([, memory]) => !state.completedScenes[memory.scene]);
  if (lockedNext) {
    state.unlocked.memories[getMemoryId(lockedNext[1])] = true;
    enterScene(lockedNext[1].scene);
    return;
  }

  renderCredits();
}

function startNewGame() {
  const data = getData();
  state = {
    screen: "game",
    sceneId: data.startScene,
    dialogueIndex: 0,
    flags: {},
    unlocked: createInitialUnlocks(data),
    completedScenes: {},
    completedMinigames: {},
    muted: state.muted,
  };
  resetSave();
  audio.setMuted(state.muted);
  enterScene(data.startScene);
}

function continueGame() {
  const save = loadSave();
  if (!save || !restoreSave(save)) {
    return;
  }
}

function restoreSave(save: SaveData) {
  if (!getData().scenes[save.sceneId]) {
    localStorage.removeItem(SAVE_KEY);
    return false;
  }

  state = {
    screen: "game",
    sceneId: save.sceneId,
    dialogueIndex: save.dialogueIndex,
    flags: save.flags ?? {},
    unlocked: save.unlocked ?? createInitialUnlocks(getData()),
    completedScenes: save.completedScenes ?? {},
    completedMinigames: save.completedMinigames ?? {},
    muted: state.muted,
  };
  mergeInitialUnlocks();
  audio.setMuted(state.muted);
  enterScene(save.sceneId, save.dialogueIndex);
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

  actions.append(
    makeButton("primary-button", "Empezar", startNewGame),
    makeButton("secondary-button", "Continuar", continueGame),
    makeButton("secondary-button", "Recuerdos", renderMemories),
    makeButton("secondary-button", "Cartas", renderLetters),
    makeButton("secondary-button", "Galería", renderGallery),
    makeButton("ghost-button", "Opciones", renderOptions),
    makeButton("ghost-button", "Salir", renderExit),
  );
  (actions.children[1] as HTMLButtonElement).disabled = !hasSave;

  const mute = makeButton("icon-button menu-mute", state.muted ? "Audio OFF" : "Audio ON", () => {
    state.muted = !state.muted;
    saveMuted();
    audio.setMuted(state.muted);
    renderMenu();
  });

  panel.append(eyebrow, title, subtitle, actions, mute);
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

  const topbar = renderTopbar(scene.name);

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
    const characterImage = el("img", `character-sprite ${character?.side ?? "center"}`);
    characterImage.src = assetUrl(sprite);
    characterImage.alt = character?.name ?? "";
    characterLayer.append(characterImage);
  }

  const dialogue = renderDialogue(line, character);
  stage.append(topbar, objectLayer, characterLayer);
  shell.append(stage, dialogue);
  replaceApp(shell);
  playLineAudio(line);
}

function renderTopbar(sceneName: string) {
  const topbar = el("div", "topbar");
  const sceneLabel = el("div", "scene-name", sceneName);
  const topActions = el("div", "top-actions");
  const mute = makeButton("icon-button", state.muted ? "Audio OFF" : "Audio ON", () => {
    state.muted = !state.muted;
    saveMuted();
    audio.setMuted(state.muted);
    renderGame();
  });
  topActions.append(
    makeButton("icon-button", "Recuerdos", renderMemories),
    makeButton("icon-button", "Cartas", renderLetters),
    makeButton("icon-button", "Galería", renderGallery),
    mute,
    makeButton("icon-button", "Menú", renderMenu),
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
  button.title = clickable.tooltip ?? clickable.label;
  button.setAttribute("aria-label", clickable.label);

  if (clickable.image) {
    const image = el("img");
    image.src = assetUrl(clickable.image);
    image.alt = "";
    button.append(image);
  } else {
    button.textContent = clickable.label;
  }

  button.addEventListener("click", () => {
    audio.playSfx(clickable.sfx ?? "click");
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
  if (line.important) {
    typeImportantText(text, line.text);
  } else {
    text.textContent = line.text;
  }

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

function typeImportantText(target: HTMLElement, text: string) {
  let index = 0;
  target.textContent = "";
  typeTimer = window.setInterval(() => {
    target.textContent = text.slice(0, index);
    index += 1;
    if (index > text.length) {
      if (typeTimer) {
        window.clearInterval(typeTimer);
        typeTimer = undefined;
      }
    }
  }, 20);
}

function getVisibleChoices(line: DialogueLine) {
  return (line.choices ?? []).filter(
    (choice) => hasRequiredFlags(choice.requiresFlags) && hasRequiredMemories(choice.requiresMemories),
  );
}

function choose(choice: Choice) {
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
  stage.append(renderTopbar(scene.name));
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
  const box = el("section", "dialogue-box end-box");
  const title = el("strong", "speaker", "Habitación de recuerdos");
  const text = el(
    "p",
    "dialogue-text",
    "La cajita, el álbum y el mapa siguen aquí. Puedes continuar el siguiente recuerdo o revisar lo que ya guardaste.",
  );
  const controls = el("div", "dialogue-controls");
  controls.append(
    makeButton("primary-button", "Siguiente recuerdo", enterNextChapter),
    makeButton("secondary-button", "Recuerdos", renderMemories),
    makeButton("secondary-button", "Cartas", renderLetters),
    makeButton("secondary-button", "Galería", renderGallery),
  );
  box.append(title, text, controls);
  stage.append(renderTopbar(scene.name), objectLayer);
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

  renderUnlockScreen(
    scene.completionTitle ?? "Recuerdo guardado",
    scene.completionText ?? "El recuerdo quedó guardado en la habitación.",
    gained,
    () => {
      if (scene.nextScene) {
        enterScene(scene.nextScene);
      } else {
        enterScene(getData().startScene);
      }
    },
    scene.nextScene ? "Siguiente recuerdo" : "Volver a la habitación",
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
      card.append(
        makeButton("secondary-button small-button", completed ? "Revisitar" : "Jugar", () => enterScene(memory.scene)),
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
      card.append(makeButton("secondary-button small-button", "Leer", () => renderLetter(id, "letters")));
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
    makeButton("primary-button", "Guardar en la cajita", () => renderScreen(back === "game" ? "letters" : back)),
    makeButton("ghost-button", "Menú", renderMenu),
  );
  paper.append(controls);
  screen.append(paper);
  replaceApp(screen);
}

function renderGallery() {
  state.screen = "gallery";
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
      card.append(makeButton("secondary-button small-button", "Ver", () => renderGalleryItem(id, "gallery")));
    }
    grid.append(card);
  }

  screen.querySelector(".catalog-body")?.append(grid);
  replaceApp(screen);
}

function renderGalleryItem(id: string, back: ReturnScreen) {
  const item = getData().gallery[id];
  if (!item) {
    renderGallery();
    return;
  }
  state.unlocked.gallery[id] = true;
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
  controls.append(
    makeButton("primary-button", "Volver", () => renderScreen(back === "game" ? "gallery" : back)),
    makeButton("ghost-button", "Menú", renderMenu),
  );
  panel.append(controls);
  screen.append(panel);
  replaceApp(screen);
}

function renderOptions() {
  state.screen = "options";
  const screen = renderCatalogShell("Opciones", "Ajustes simples para probar el regalo.");
  const panel = el("section", "options-panel");
  panel.append(
    makeButton("primary-button", state.muted ? "Activar audio" : "Silenciar audio", () => {
      state.muted = !state.muted;
      saveMuted();
      audio.setMuted(state.muted);
      renderOptions();
    }),
    makeButton("ghost-button", "Reiniciar progreso", () => {
      resetSave();
      state.unlocked = createInitialUnlocks(getData());
      state.completedScenes = {};
      state.completedMinigames = {};
      state.flags = {};
      renderOptions();
    }),
    el("p", "catalog-copy", "Si cambias muchos datos del juego, reinicia el progreso para evitar continuar desde un punto viejo."),
  );
  screen.querySelector(".catalog-body")?.append(panel);
  replaceApp(screen);
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
    makeButton("primary-button", "Siguiente recuerdo", enterNextChapter),
    makeButton("secondary-button", "Habitación", () => enterScene(getData().startScene)),
    makeButton("ghost-button", "Menú", renderMenu),
  );
  header.append(actions);
  const body = el("section", "catalog-body");
  screen.append(header, body);
  return screen;
}

function getSortedMemories() {
  return Object.entries(getData().memories).sort((a, b) => a[1].chapter - b[1].chapter);
}

function getMemoryId(memoryToFind: Memory) {
  return (
    Object.entries(getData().memories).find(([, memory]) => memory === memoryToFind)?.[0] ??
    memoryToFind.scene
  );
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

async function bootstrap() {
  try {
    const response = await fetch(assetUrl("content/game.json"));
    if (!response.ok) {
      throw new Error(`Could not load content/game.json (${response.status}).`);
    }

    gameData = (await response.json()) as GameData;
    audio = new AudioManager(gameData.audio);
    state.unlocked = createInitialUnlocks(gameData);
    audio.setMuted(state.muted);
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
