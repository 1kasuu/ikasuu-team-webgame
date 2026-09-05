# CodePlatform

A browser-based coding puzzle platformer where players write HTML/CSS to build a safe route and reach the goal.

## Run locally

Use a local HTTP server because official stage data is loaded from JSON via `fetch()`.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project structure

```text
index.html
css/style.css
js/game.js
data/levels/manifest.json
data/levels/level-01.json ... level-10.json
audio/background.opus      # optional, user supplied
```

## Level data

Each official stage is stored in its own JSON file. Physics and collision logic remain in `js/game.js`, so editing a stage does not require editing the engine.

The default official arena is 720×360. Custom stages may use another arena size through Stage Editor.

## Stage Editor

The editor supports:
- Edit / Place / Delete tools
- drag objects
- Spawn / Goal drag
- inspector values
- grid snapping
- Undo / Redo
- Copy / Paste / Duplicate
- JSON Import / Export
- custom arena size
- Playtest

Custom stages are stored in browser `localStorage`. Exported JSON can be shared or versioned in Git.

## Background music

Place an Opus audio file at:

```text
audio/background.opus
```

Then enable **Backsound** in Settings. The game stores the toggle in `localStorage`.

## GitHub releases

Recommended version tags:

```text
v1.0.0  Initial release
v1.1.0  Feature update
v1.2.0  Collision/JSON architecture
v1.3.0  Editor, responsive, audio hook, stage rebuild
```

See `CHANGELOG.md` for release history.
