import "./styles.css";

type FlagMap = Record<string, boolean>;

type Action =
  | { type: "setFlag"; flag: string; value?: boolean }
  | { type: "goToScene"; scene: string; dialogueIndex?: number }
  | { type: "playSfx"; sfx: string };

type Choice = {
  label: string;
  goToScene?: string;
  dialogueIndex?: number;
  requiresFlags?: string[];
  actions?: Action[];
  sfx?: string;
};

type DialogueLine = {
  character?: string;
  text: string;
  sprite?: string;
  sfx?: string;
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
  dialogues: DialogueLine[];
  clickables?: Clickable[];
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
  scenes: Record<string, Scene>;
};

type InspectionState = {
  clickableId: string;
  lines: DialogueLine[];
  index: number;
};

type AppState = {
  screen: "menu" | "game";
  sceneId: string;
  dialogueIndex: number;
  flags: FlagMap;
  muted: boolean;
  inspection?: InspectionState;
};

type SaveData = {
  sceneId: string;
  dialogueIndex: number;
  flags: FlagMap;
};

const SAVE_KEY = "anniversary-vn-save-v1";
const MUTE_KEY = "anniversary-vn-muted-v1";
const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Missing #app root element.");
}

const app = appElement;

let gameData: GameData | null = null;
let lastLineAudioKey = "";
let state: AppState = {
  screen: "menu",
  sceneId: "",
  dialogueIndex: 0,
  flags: {},
  muted: loadMuted(),
};

class AudioManager {
  private context?: AudioContext;
  private musicTimer?: number;
  private htmlMusic?: HTMLAudioElement;
  private currentMusic?: string;
  private muted = false;

  constructor(private readonly data?: GameData["audio"]) {}

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
    audio.volume = 0.35;
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
    audio.volume = 0.65;
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
      menu: [523.25, 659.25, 783.99, 659.25],
      warm: [392, 493.88, 587.33, 493.88],
      cozy: [349.23, 440, 523.25, 440],
      stars: [587.33, 739.99, 880, 739.99],
    };
    const notes = progressions[variant] ?? progressions.warm;
    let step = 0;

    this.musicTimer = window.setInterval(() => {
      this.playTone(notes[step % notes.length], 0.22, 0.045, "triangle");
      if (step % 4 === 0) {
        this.playTone(notes[0] / 2, 0.55, 0.03, "sine");
      }
      step += 1;
    }, 460);
  }

  private playProceduralSfx(variant: string) {
    const presets: Record<string, [number, number, OscillatorType]> = {
      blip: [740, 0.055, "square"],
      choice: [620, 0.11, "triangle"],
      paper: [280, 0.08, "sawtooth"],
      sparkle: [1046.5, 0.18, "sine"],
      click: [440, 0.045, "square"],
    };
    const [frequency, duration, wave] = presets[variant] ?? presets.click;
    this.playTone(frequency, duration, 0.09, wave);
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
    oscillator.stop(now + duration + 0.025);
  }
}

let audio = new AudioManager();

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
    return JSON.parse(raw) as SaveData;
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

function saveGame() {
  if (state.screen !== "game") {
    return;
  }

  const save: SaveData = {
    sceneId: state.sceneId,
    dialogueIndex: state.dialogueIndex,
    flags: state.flags,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
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

function replaceApp(node: HTMLElement) {
  app.replaceChildren(node);
}

function getData() {
  if (!gameData) {
    throw new Error("Game data has not loaded.");
  }
  return gameData;
}

function getScene() {
  return getData().scenes[state.sceneId];
}

function getCurrentLine() {
  if (state.inspection) {
    return state.inspection.lines[state.inspection.index];
  }

  return getScene().dialogues[state.dialogueIndex];
}

function hasRequiredFlags(required?: string[]) {
  return !required?.some((flag) => !state.flags[flag]);
}

function isHiddenByFlags(hiddenWhen?: string[]) {
  return Boolean(hiddenWhen?.some((flag) => state.flags[flag]));
}

function runActions(actions?: Action[]) {
  if (!actions?.length) {
    return false;
  }

  for (const action of actions) {
    if (action.type === "setFlag") {
      state.flags[action.flag] = action.value ?? true;
    }

    if (action.type === "playSfx") {
      audio.playSfx(action.sfx);
    }

    if (action.type === "goToScene") {
      enterScene(action.scene, action.dialogueIndex ?? 0);
      return true;
    }
  }

  saveGame();
  return false;
}

function enterScene(sceneId: string, dialogueIndex = 0) {
  const scene = getData().scenes[sceneId];
  if (!scene) {
    throw new Error(`Scene "${sceneId}" does not exist.`);
  }

  state.screen = "game";
  state.sceneId = sceneId;
  state.dialogueIndex = Math.max(0, Math.min(dialogueIndex, scene.dialogues.length - 1));
  state.inspection = undefined;
  lastLineAudioKey = "";
  audio.playMusic(scene.music);
  saveGame();
  renderGame();
}

function startNewGame() {
  const data = getData();
  state = {
    screen: "game",
    sceneId: data.startScene,
    dialogueIndex: 0,
    flags: {},
    muted: state.muted,
  };
  resetSave();
  audio.setMuted(state.muted);
  enterScene(data.startScene);
}

function continueGame() {
  const save = loadSave();
  if (!save) {
    return;
  }

  state = {
    screen: "game",
    sceneId: save.sceneId,
    dialogueIndex: save.dialogueIndex,
    flags: save.flags ?? {},
    muted: state.muted,
  };
  audio.setMuted(state.muted);
  enterScene(save.sceneId, save.dialogueIndex);
}

function renderMenu() {
  const data = getData();
  state.screen = "menu";
  audio.playMusic("menu");

  const screen = el("main", "menu-screen");
  screen.style.backgroundImage = `linear-gradient(rgba(25, 25, 38, 0.5), rgba(25, 25, 38, 0.86)), url("${assetUrl("assets/backgrounds/plaza.svg")}")`;
  const panel = el("section", "menu-panel");
  const title = el("h1", "menu-title", data.title);
  const subtitle = el(
    "p",
    "menu-subtitle",
    data.subtitle ?? "Una novela visual pixel art para guardar recuerdos.",
  );
  const actions = el("div", "menu-actions");
  const hasSave = Boolean(loadSave());

  const start = el("button", "primary-button", "Iniciar");
  start.addEventListener("click", startNewGame);

  const resume = el("button", "secondary-button", "Continuar");
  resume.disabled = !hasSave;
  resume.addEventListener("click", continueGame);

  const reset = el("button", "ghost-button", "Reiniciar progreso");
  reset.disabled = !hasSave;
  reset.addEventListener("click", () => {
    resetSave();
    renderMenu();
  });

  const mute = el("button", "icon-button menu-mute", state.muted ? "Audio OFF" : "Audio ON");
  mute.addEventListener("click", () => {
    state.muted = !state.muted;
    saveMuted();
    audio.setMuted(state.muted);
    renderMenu();
  });

  actions.append(start, resume, reset);
  panel.append(title, subtitle, actions, mute);
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

  const topbar = el("div", "topbar");
  const sceneName = el("div", "scene-name", scene.name);
  const topActions = el("div", "top-actions");
  const mute = el("button", "icon-button", state.muted ? "Audio OFF" : "Audio ON");
  mute.addEventListener("click", () => {
    state.muted = !state.muted;
    saveMuted();
    audio.setMuted(state.muted);
    renderGame();
  });
  const menu = el("button", "icon-button", "Menu");
  menu.addEventListener("click", renderMenu);
  topActions.append(mute, menu);
  topbar.append(sceneName, topActions);

  const objectLayer = el("div", "object-layer");
  for (const clickable of scene.clickables ?? []) {
    if (!hasRequiredFlags(clickable.requiresFlags) || isHiddenByFlags(clickable.hiddenWhenFlags)) {
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
  stage.append(topbar, objectLayer, characterLayer, dialogue);
  shell.append(stage);
  replaceApp(shell);
  playLineAudio(line);
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
    const changedScene = runActions(clickable.actions);
    if (changedScene) {
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

  const text = el("p", "dialogue-text", line.text);
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
    const close = el("button", "ghost-button", "Cerrar");
    close.addEventListener("click", () => {
      state.inspection = undefined;
      renderGame();
    });
    controls.append(close);
  }

  box.append(meta, text, controls);
  return box;
}

function getVisibleChoices(line: DialogueLine) {
  return (line.choices ?? []).filter((choice) => hasRequiredFlags(choice.requiresFlags));
}

function choose(choice: Choice) {
  audio.playSfx(choice.sfx ?? "choice");
  const changedScene = runActions(choice.actions);
  if (changedScene) {
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
    const changedScene = runActions(line.actions);
    if (changedScene) {
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

  const changedScene = runActions(line.actions);
  if (changedScene) {
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
  const shell = el("main", "game-shell");
  const stage = el("section", "stage");
  stage.style.backgroundImage = `url("${assetUrl(scene.background)}")`;
  const objectLayer = el("div", "object-layer");
  for (const clickable of scene.clickables ?? []) {
    if (!hasRequiredFlags(clickable.requiresFlags) || isHiddenByFlags(clickable.hiddenWhenFlags)) {
      continue;
    }
    objectLayer.append(renderClickable(clickable));
  }

  const box = el("section", "dialogue-box end-box");
  const title = el("strong", "speaker", "Escena completa");
  const text = el(
    "p",
    "dialogue-text",
    "Puedes explorar los objetos del escenario, volver al menu o reiniciar la historia.",
  );
  const controls = el("div", "dialogue-controls");
  const menu = el("button", "primary-button", "Menu");
  menu.addEventListener("click", renderMenu);
  const restart = el("button", "ghost-button", "Reiniciar");
  restart.addEventListener("click", startNewGame);
  controls.append(menu, restart);
  box.append(title, text, controls);
  stage.append(objectLayer, box);
  shell.append(stage);
  replaceApp(shell);
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

async function bootstrap() {
  try {
    const response = await fetch(assetUrl("content/game.json"));
    if (!response.ok) {
      throw new Error(`Could not load content/game.json (${response.status}).`);
    }

    gameData = (await response.json()) as GameData;
    audio = new AudioManager(gameData.audio);
    audio.setMuted(state.muted);
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
