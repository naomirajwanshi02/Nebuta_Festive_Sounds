# 🏮 Nebuta Festive Sounds: a scan-to-listen WebAR sound note

Point your phone at the printed **Nebuta float** picture ([`target.png`](target.png)). When it is
recognised, a short note tells you that you can begin, and on **OK** the festive sounds of the
Nebuta Festival (Aomori) play over your live camera view. Three notes slide across the top: the
festival, how the sound is made, then the floats (every **12 seconds**).

**Play locally:** `http://localhost:8132/` · **Without the picture:** `?demo=1` · **Without any camera:** `?preview=1`

It is the same experience as Gion Matsuri Festive Sounds: camera permission, scan, explanatory
note, listening screen with the sound note player. Only the content changed.

| File | What it is |
|---|---|
| `index.html`, `js/app.js`, `js/scan.js`, `js/player.js` | The flow, scanner (MindAR image) and player |
| `js/data.js` | The two sliding notes and `NOTE_MS` |
| `assets/festive-sounds.m4a` | The voice note |
| `assets/nebuta-float.jpg` | The float photo: thumbnail and source of the tracking picture |
| `target.png` / `targets.mind` | The picture to scan and its compiled MindAR target |
| `tools/make-target.html`, `tools/serve.ps1` | Rebuild the target (`?build=1`); local server (port 8132) |

Look: [Anatomy](https://github.com/wheresryan22/anatomy) sepia theme in `vendor/anatomy/`.
Version pins: `mind-ar@1.2.5` with `three@0.160.0`. Phones need HTTPS (e.g. GitHub Pages) for the camera.
