# JSON-driven Remotion editing engine

This project renders educational/documentary videos from `edit_plan.json`.

The engine does not make editing decisions. JSON describes **what** should happen. Remotion components describe **how** it is drawn.

```
timed_script.json + asset_analysis.json + edit_plan.json
        ↓
  Remotion engine
        ↓
     rendered MP4
```

For this first stage, only project initialization and architecture are in place. Motion, image playback, educational graphics, and full validation are not implemented yet.

## Run locally

```console
cd video-editor
npm i
npm run dev
```

That opens Remotion Studio. The composition id is `VideoComposition`.

Render (close Remotion Studio first so it is not competing for RAM):

```console
npm run render
```

That is the default Remotion render. Use it when the machine has enough RAM.

On 8GB RAM or if a render runs out of memory:

```console
npm run render:low-ram
```

That writes `out/youtube-low-ram.mp4` with one Chrome tab and no parallel encode. It is slower, not lower resolution.

## GitHub Actions (production renderer)

This engine is meant to render on GitHub, not on a 4GB PC. You need a **GitHub.com** repository (GitHub Actions does not run on a folder that only exists on disk).

If the repo does not exist yet:

1. Create a free account at [github.com](https://github.com/signup) if you do not have one.
2. Create an empty repository (no README). A good name is `video-editor`.
3. From this folder, push:

```console
git remote add origin https://github.com/YOUR_USERNAME/video-editor.git
git push -u origin main
```

Then on GitHub: **Actions → Render YouTube video → Run workflow**. When it finishes, download the `youtube-video` artifact (the MP4) and upload it to YouTube.

Keep videos at **3 minutes or less**.

## Current pipeline

1. `src/data/edit-plan.json` is the input.
2. `src/Root.tsx` registers `VideoComposition` and converts seconds to frames.
3. `src/Composition.tsx` passes the plan into `VideoEngine`.
4. `VideoEngine` renders clips.
5. `ClipRenderer` places each clip on the timeline.
6. `LayerRenderer` maps a layer `type` to a React component.

## Folder purpose

| Path | Role |
| --- | --- |
| `public/assets` | Media files referenced by asset ids |
| `src/data` | JSON inputs (`edit-plan`, timed script, asset analysis) |
| `src/types` | TypeScript schemas for those JSON files |
| `src/engine` | Timeline, clip/layer dispatch, asset lookup |
| `src/components` | Visual rendering only |
| `src/validation` | Fail-fast checks before render |
| `src/utils` | Time, easing, math helpers |
| `src/styles` | Shared documentary theme |
| `scripts` | Local validate/render helpers |

## Next

Implement the image layer next: resolve `asset_id`, fill the 16:9 frame, and add deterministic Ken Burns-style motion from JSON.
