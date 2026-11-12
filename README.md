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

The engine renders the edit plan: stills, video footage, motion, graphics, and narration.

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
| `public/assets` | Media files. Stills live in `images`, footage in `videos` |
| `src/data` | JSON inputs (`edit-plan`, timed script, asset analysis) |
| `src/types` | TypeScript schemas for those JSON files |
| `src/engine` | Timeline, clip/layer dispatch, asset lookup |
| `src/components` | Visual rendering only |
| `src/validation` | Fail-fast checks before render |
| `src/utils` | Time, easing, math helpers |
| `src/styles` | Shared documentary theme |
| `scripts` | Local validate/render helpers |

## Video footage

A clip can play a video file instead of a still. Set `"source": "video"`, or point `src` at an `.mp4`, `.webm`, `.mov`, `.mkv`, or `.m4v`. Asset ids `vid_001` and `vid001` resolve to `public/assets/videos/vid_001.mp4`.

```json
{
  "id": "interview",
  "start_sec": 12,
  "end_sec": 18.5,
  "source": "video",
  "src": "assets/videos/interview.mp4",
  "trim_start_sec": 4.2,
  "trim_end_sec": 12,
  "playback_rate": 1,
  "volume": 1,
  "fit": "cover",
  "layers": []
}
```

`trim_start_sec` and `trim_end_sec` are times in the file. `playback_rate` is speed (`2` plays twice as fast, so the same trim occupies half as much timeline). `playback_rate_end` eases from the start speed to another speed across the shot. `reverse` plays that trim backwards. `conform` stretches the trim to fill the shot, so leave `playback_rate` unset. `freeze` holds the in-point. `audio_fade_in_sec` and `audio_fade_out_sec` fade the footage's own sound. `focus_x` and `focus_y` aim a cover crop: `0` is the left or top edge, `50` is the center. `volume` is `0`–`1`. Use `0` when narration should stay in front. `loop` repeats the trimmed range. Without it, the last frame holds when the file runs out.

A straight cut plays on the video's own clock, so the sound stays in sync. Reverse, a speed ramp, and a loop step through frames instead.

## Artistic looks

`look` grades the picture without touching titles. Set it on `video` to grade the whole film, on a clip to grade that shot, or on a video layer to grade one window. A layer value wins. `"none"` leaves that window clean.

```json
{
  "id": "interview",
  "start_sec": 12,
  "end_sec": 18.5,
  "source": "video",
  "src": "assets/videos/interview.mp4",
  "look": "cinema",
  "transition_in": { "type": "whip_pan", "duration_sec": 0.4 },
  "layers": []
}
```

| Look | What you see |
| --- | --- |
| `cinema` | Letterbox, cooler contrast, light grain |
| `film` | Warm print, heavier grain |
| `noir` | Black and white, crushed edges |
| `golden` | Amber hour |
| `teal` | Teal shadows, warm highlights |
| `fade` | Lifted, washed print |
| `vhs` | Scan lines, a tracking bar, a small wobble |
| `dream` | Soft bright center |
| `ink` | High-contrast graphic |

`cinematic`, `vintage`, `black_and_white`, `gold`, `tape`, and `poster` are accepted aliases.

Entrances that read as an edit, not a dissolve: `flash_cut`, `circle_pulse`, `whip_pan`, `glitch_cut`. The glitch moves the frame and tints the edges. It does not split the footage into separate color channels.

Open `ArtisticIllustration` for a 50-second walk through every look on a real still. `VideoEditReel` is the short version on the sample footage.

A layer with `"type": "video"` does the same inside a shot. Leave `x`, `y`, and `width` off to fill the frame, or set them to place the footage (a picture-in-picture). `fit`, `overlay`, and `motion` work the same way they do on stills.

`audio` can be one track or a list. Each track accepts `start_sec`, `end_sec`, `trim_start_sec`, `trim_end_sec`, `volume`, `playback_rate`, and `loop`.

Open `VideoEditReel` in Remotion Studio to see a full-frame plate, a sped-up picture-in-picture, and a trimmed shot. The sample file is `public/assets/videos/sample-bars.mp4`.
