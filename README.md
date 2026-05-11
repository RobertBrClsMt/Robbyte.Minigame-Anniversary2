# Mini Game Anniversary 2

Base para un mini juego de novela visual pixel art hecho con Vite + TypeScript.

El motor esta separado del contenido. Para agregar escenas, personajes, objetos,
musica o sonidos, normalmente solo debes editar `public/content/game.json` y
poner tus archivos dentro de `public/assets`.

## Comandos

```bash
npm install
npm run dev
npm run build
```

- `npm run dev`: abre el juego en local para probar cambios.
- `npm run build`: compila la version estatica que se publica en GitHub Pages.
- `npm run preview`: revisa localmente el resultado de `dist`.

## Estructura importante

```text
public/
  content/
    game.json
  assets/
    backgrounds/
    characters/
    objects/
    audio/
      music/
      sfx/
src/
  main.ts
  styles.css
```

- `public/content/game.json`: historia, personajes, escenas, opciones, flags y
  objetos clickeables.
- `public/assets/backgrounds`: fondos de escenarios.
- `public/assets/characters`: sprites o retratos de personajes.
- `public/assets/objects`: imagenes para objetos clickeables.
- `public/assets/audio/music`: musica de fondo.
- `public/assets/audio/sfx`: efectos de sonido.
- `src/main.ts`: motor del juego. No necesitas editarlo para agregar contenido.

## Reglas del JSON

`game.json` debe ser JSON valido:

- No uses comentarios dentro del archivo.
- Usa comillas dobles.
- No pongas coma despues del ultimo elemento de una lista u objeto.
- Las rutas empiezan desde `public`, pero no incluyen la palabra `public`.

Ejemplo correcto de ruta:

```json
"background": "assets/backgrounds/playa.svg"
```

## Estructura general de `game.json`

```json
{
  "title": "Segundo Aniversario",
  "subtitle": "Texto del menu principal",
  "startScene": "plaza",
  "audio": {},
  "characters": {},
  "scenes": {}
}
```

- `title`: titulo del menu.
- `subtitle`: texto corto del menu.
- `startScene`: id de la primera escena.
- `audio`: nombres reutilizables para musica y sonidos.
- `characters`: personajes disponibles.
- `scenes`: todos los escenarios del juego.

## Agregar un personaje

1. Coloca el sprite en `public/assets/characters`.
2. Agrega una entrada dentro de `characters`.
3. Usa el id del personaje en los dialogos.

Ejemplo:

```json
"maria": {
  "name": "Maria",
  "color": "#ff9ac2",
  "sprite": "assets/characters/maria.png",
  "side": "right"
}
```

Campos:

- `name`: nombre que aparece en la caja de dialogo.
- `color`: color del nombre del personaje.
- `sprite`: ruta de la imagen.
- `side`: posicion del sprite. Valores: `left`, `center`, `right`.

Despues puedes usarlo asi:

```json
{
  "character": "maria",
  "text": "Este lugar me recuerda a nuestra primera salida."
}
```

Tambien puedes crear personajes sin sprite para narrador o pensamientos:

```json
"narrator": {
  "name": "Recuerdo",
  "color": "#ffe6a8"
}
```

## Agregar una escena

1. Coloca el fondo en `public/assets/backgrounds`.
2. Agrega una nueva entrada dentro de `scenes`.
3. Crea sus `dialogues`.
4. Agrega una opcion desde otra escena para llegar a ella.

Ejemplo completo:

```json
"playa": {
  "name": "Playa al atardecer",
  "background": "assets/backgrounds/playa.png",
  "music": "playa",
  "dialogues": [
    {
      "character": "narrator",
      "text": "El atardecer pinta el cielo como una promesa tranquila.",
      "sfx": "sparkle"
    },
    {
      "character": "maria",
      "text": "Este seria un buen lugar para guardar otro recuerdo."
    },
    {
      "character": "narrator",
      "text": "El camino continua.",
      "choices": [
        {
          "label": "Volver a la plaza",
          "goToScene": "plaza"
        }
      ]
    }
  ],
  "clickables": []
}
```

Campos de escena:

- `name`: nombre visible arriba a la izquierda.
- `background`: imagen del fondo.
- `music`: id de musica definido en `audio.music`.
- `dialogues`: lista de dialogos.
- `clickables`: lista de objetos interactivos del escenario.

Para conectar una escena desde otra, agrega una opcion:

```json
{
  "label": "Ir a la playa",
  "goToScene": "playa"
}
```

## Agregar dialogos

Un dialogo simple:

```json
{
  "character": "leo",
  "text": "Queria traerte aqui porque este recuerdo importa."
}
```

Un dialogo con efecto de sonido:

```json
{
  "character": "narrator",
  "text": "Una estrella cruza el cielo.",
  "sfx": "sparkle"
}
```

Un dialogo que usa un sprite distinto solo para esa linea:

```json
{
  "character": "maria",
  "sprite": "assets/characters/maria-happy.png",
  "text": "Me encanta esta sorpresa."
}
```

Campos de dialogo:

- `character`: id del personaje. Opcional.
- `text`: texto mostrado.
- `sprite`: sprite temporal para esta linea. Opcional.
- `sfx`: efecto de sonido al mostrar la linea. Opcional.
- `choices`: opciones de decision. Opcional.
- `actions`: acciones que ocurren al avanzar. Opcional.

## Agregar opciones

Las opciones aparecen cuando una linea de dialogo tiene `choices`.

```json
{
  "character": "narrator",
  "text": "Hay dos caminos frente a ustedes.",
  "choices": [
    {
      "label": "Ir al parque",
      "goToScene": "parque"
    },
    {
      "label": "Quedarse conversando",
      "dialogueIndex": 4
    }
  ]
}
```

Campos de opcion:

- `label`: texto del boton.
- `goToScene`: id de la escena destino.
- `dialogueIndex`: linea de dialogo a la que salta dentro de la escena actual
  o de la escena destino.
- `requiresFlags`: muestra la opcion solo si existen esas flags.
- `actions`: acciones ejecutadas al elegir la opcion.
- `sfx`: sonido al elegir la opcion.

Ejemplo de opcion bloqueada hasta ver una foto:

```json
{
  "label": "Ir a la azotea con la foto",
  "goToScene": "azotea",
  "requiresFlags": ["photo_seen"]
}
```

## Agregar objetos clickeables

1. Coloca la imagen del objeto en `public/assets/objects`.
2. Agrega un objeto en `clickables` dentro de la escena.
3. Ajusta `x`, `y`, `width` y `height` hasta que quede bien posicionado.

Ejemplo:

```json
{
  "id": "ramo_flores",
  "label": "Ramo",
  "tooltip": "Mirar el ramo de flores",
  "image": "assets/objects/flowers.png",
  "x": 72,
  "y": 56,
  "width": 9,
  "height": 14,
  "sfx": "sparkle",
  "actions": [
    {
      "type": "setFlag",
      "flag": "flowers_seen",
      "value": true
    }
  ],
  "inspectDialogue": [
    {
      "character": "narrator",
      "text": "El ramo conserva el color de una tarde especial."
    },
    {
      "character": "maria",
      "text": "Este detalle si cuenta como sorpresa."
    }
  ]
}
```

Campos de objeto:

- `id`: identificador unico del objeto.
- `label`: nombre corto.
- `tooltip`: texto al pasar el mouse.
- `image`: ruta de la imagen. Opcional, pero recomendado.
- `x`: posicion horizontal en porcentaje.
- `y`: posicion vertical en porcentaje.
- `width`: ancho en porcentaje.
- `height`: alto en porcentaje.
- `sfx`: sonido al hacer clic.
- `actions`: acciones que ocurren al hacer clic.
- `inspectDialogue`: dialogos que aparecen al inspeccionar.
- `requiresFlags`: muestra el objeto solo si esas flags existen.
- `hiddenWhenFlags`: oculta el objeto cuando esas flags existen.

Las posiciones usan porcentajes del escenario:

```json
{
  "x": 61,
  "y": 58,
  "width": 8,
  "height": 12
}
```

Recomendacion practica: empieza con `width` y `height` grandes para encontrar el
area del clic, luego reduce el tamano hasta que coincida con el objeto visual.

## Usar flags

Las flags son estados guardados en el progreso del jugador. Sirven para
desbloquear opciones, mostrar objetos, ocultar objetos o recordar decisiones.

Crear o activar una flag:

```json
{
  "type": "setFlag",
  "flag": "photo_seen",
  "value": true
}
```

Usar una flag para desbloquear opcion:

```json
{
  "label": "Ir a la azotea con la foto",
  "goToScene": "azotea",
  "requiresFlags": ["photo_seen"]
}
```

Usar una flag para mostrar un objeto:

```json
{
  "id": "regalo_secreto",
  "label": "Regalo",
  "image": "assets/objects/gift.png",
  "x": 44,
  "y": 60,
  "width": 8,
  "height": 12,
  "requiresFlags": ["letter_found"],
  "inspectDialogue": [
    {
      "character": "narrator",
      "text": "El regalo aparece despues de leer la carta."
    }
  ]
}
```

Ocultar un objeto despues de una accion:

```json
{
  "id": "llave",
  "label": "Llave",
  "image": "assets/objects/key.png",
  "x": 50,
  "y": 70,
  "width": 5,
  "height": 8,
  "hiddenWhenFlags": ["key_taken"],
  "actions": [
    {
      "type": "setFlag",
      "flag": "key_taken",
      "value": true
    }
  ],
  "inspectDialogue": [
    {
      "character": "narrator",
      "text": "Guardaste la llave."
    }
  ]
}
```

## Acciones disponibles

Actualmente el motor soporta estas acciones:

```json
{
  "type": "setFlag",
  "flag": "nombre_de_flag",
  "value": true
}
```

Activa o desactiva una flag.

```json
{
  "type": "goToScene",
  "scene": "azotea",
  "dialogueIndex": 0
}
```

Cambia de escena desde un dialogo, opcion u objeto.

```json
{
  "type": "playSfx",
  "sfx": "sparkle"
}
```

Reproduce un efecto de sonido.

## Agregar musica

1. Copia tu archivo a `public/assets/audio/music`.
2. Agrega un id en `audio.music`.
3. Usa ese id en el campo `music` de una escena.

Ejemplo:

```json
"audio": {
  "music": {
    "playa": "assets/audio/music/playa.mp3"
  }
}
```

Luego en la escena:

```json
"music": "playa"
```

Formatos recomendados para navegador:

- `.mp3`
- `.ogg`
- `.wav`

Para GitHub Pages conviene usar archivos comprimidos como `.mp3` u `.ogg`.

## Agregar efectos de sonido

1. Copia tu archivo a `public/assets/audio/sfx`.
2. Agrega un id en `audio.sfx`.
3. Usa ese id en `sfx` de dialogos, opciones u objetos.

Ejemplo:

```json
"audio": {
  "sfx": {
    "campana": "assets/audio/sfx/campana.mp3"
  }
}
```

Usarlo en un dialogo:

```json
{
  "character": "narrator",
  "text": "Suena una campana a lo lejos.",
  "sfx": "campana"
}
```

Usarlo en un objeto:

```json
{
  "id": "campana",
  "label": "Campana",
  "image": "assets/objects/bell.png",
  "x": 20,
  "y": 30,
  "width": 8,
  "height": 12,
  "sfx": "campana",
  "inspectDialogue": [
    {
      "character": "narrator",
      "text": "La campana suena suave."
    }
  ]
}
```

## Sonidos procedurales de ejemplo

La demo incluye sonidos generados por codigo. Sirven para probar sin archivos
externos.

Musica procedural disponible:

```json
"menu": "procedural:menu",
"plaza": "procedural:warm",
"habitacion": "procedural:cozy",
"azotea": "procedural:stars"
```

SFX procedural disponible:

```json
"blip": "procedural:blip",
"choice": "procedural:choice",
"paper": "procedural:paper",
"sparkle": "procedural:sparkle",
"click": "procedural:click"
```

Puedes reemplazarlos por archivos reales cuando quieras.

## Flujo recomendado para crear una escena nueva

1. Agrega el fondo en `public/assets/backgrounds`.
2. Agrega sprites nuevos en `public/assets/characters` si hacen falta.
3. Registra personajes nuevos en `characters`.
4. Registra musica nueva en `audio.music` si hace falta.
5. Crea la entrada de escena en `scenes`.
6. Escribe `dialogues`.
7. Agrega `choices` para llegar o salir de la escena.
8. Agrega `clickables` si hay objetos del entorno.
9. Ejecuta `npm run dev` y prueba el flujo.
10. Ejecuta `npm run build` antes de publicar.

## Plantilla rapida de escena

```json
"id_de_escena": {
  "name": "Nombre visible",
  "background": "assets/backgrounds/fondo.png",
  "music": "id_musica",
  "dialogues": [
    {
      "character": "narrator",
      "text": "Primera linea de la escena."
    },
    {
      "character": "leo",
      "text": "Segunda linea."
    },
    {
      "character": "narrator",
      "text": "Elige a donde ir.",
      "choices": [
        {
          "label": "Volver",
          "goToScene": "plaza"
        }
      ]
    }
  ],
  "clickables": [
    {
      "id": "objeto_unico",
      "label": "Objeto",
      "tooltip": "Mirar objeto",
      "image": "assets/objects/objeto.png",
      "x": 50,
      "y": 60,
      "width": 8,
      "height": 10,
      "sfx": "click",
      "inspectDialogue": [
        {
          "character": "narrator",
          "text": "Descripcion del objeto."
        }
      ]
    }
  ]
}
```

## Autosave y reinicio

El juego guarda automaticamente:

- escena actual,
- indice de dialogo,
- flags activas.

El guardado vive en `localStorage` del navegador. Si cambias mucho el JSON y una
partida guardada queda rara, usa `Reiniciar progreso` desde el menu.

## Publicacion en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila `dist` y lo publica en GitHub
Pages al hacer push a `main`.

En GitHub:

1. Entra a `Settings`.
2. Abre `Pages`.
3. En `Source`, elige `GitHub Actions`.
4. Haz push a `main`.
5. Espera a que termine el workflow `Deploy to GitHub Pages`.

## Checklist antes de publicar

- `npm run build` termina sin errores.
- El menu abre.
- `Iniciar`, `Continuar` y `Reiniciar progreso` funcionan.
- Todas las opciones llevan a escenas existentes.
- Todos los personajes usados existen en `characters`.
- Todas las rutas de imagen y audio existen.
- Los objetos clickeables quedan alineados en desktop y movil.
- El boton de audio/mute funciona.
