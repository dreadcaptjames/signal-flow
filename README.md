# Signal Flow Trainer

A browser game for practicing **commercial AV signal flow**. Each level is a client brief: you choose the gear, wire it, and test whether the system works. Some levels are troubleshooting tickets where you find what someone else wired wrong.

▶ **Play:** once GitHub Pages is on (see below), the game is at `https://<your-username>.github.io/signal-flow/`.

## What you practice

- Mic, line and speaker levels, preamps, and why a mic can't go straight into a powered speaker
- +48V phantom power for condenser mics
- Power amps, passive vs. powered speakers, 8Ω vs. 70V distributed systems
- HDMI distance limits, HDBaseT (and why it isn't Ethernet), SDI
- USB conferencing: the room PC as codec, a two-way DSP USB link, echo cancellation, USB extenders
- Dante networked audio and PoE-powered endpoints
- Assistive listening feeds, live production switchers and streaming encoders
- Budgets and cable distances taken from a site survey

## Difficulty levels

| Level | Help you get |
|---|---|
| **Novice** | Compatible ports glow. Wrong connections are blocked and explained. Signal feedback is live. |
| **Intermediate** | Ports still glow and feedback is live, but you're allowed to make mistakes. |
| **Advanced** | No glow and no live feedback: you find out when you press **Test System**. Distances matter. |
| **Pro** | Tight budgets and multi-fault tickets. The test tells you how many problems there are, not where they are. |

### 🎲 Random Challenge

Pick a difficulty and Build, Troubleshoot or Either, then press **Generate** for a new room. The generator chooses a room type (huddle room, boardroom, classroom, café/retail, lecture hall or multipurpose hall), the features the client needs, and random cable distances. It builds a working reference design at the same time, adding HDBaseT or USB extenders when a run is too long.

Troubleshooting levels start from that working design and break it with realistic faults: missing cables, a mixer without phantom power, an 8Ω amp on a 70V line, a switch without PoE, a removed extender, a mic plugged into a speaker, a speaker output into a line input, or HDBaseT plugged into a network switch. The ticket lists the symptoms users would notice.

Every generated level is checked with the simulation engine (the reference passes, the starting point doesn't) before you see it. Levels are seeded, so **🔗 Copy link** shares the exact same level, e.g. `…/signal-flow/#rnd-advanced-build-12345`.

There are 13 hand-built scenarios (Build and Troubleshoot) across the four levels. Stars: ★ for passing, ★★ for passing without hints, ★★★ for no hints and coming in at or under the par cost. Progress is saved in your browser.

## How to play

1. Read the brief, the requirements and the **Site Survey** (cable distances between zones).
2. Add equipment from the list: drag it onto a zone, or click **+**. Click an item to read what it does.
3. Wire it by dragging from port to port, or by clicking one port and then another. Outputs are on the right of each device, inputs on the left, and **⇄** marks two-way ports.
4. Click any device or cable to inspect it and see which signals are present.
5. Press **▶ Test System**.

The **Field Guide** in the top bar explains each concept.

## Publishing on GitHub Pages

It's a plain static site with no build step.

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**, choose your branch (e.g. `main`) and the **/ (root)** folder, then **Save**.
4. After a minute the site is live at `https://<user>.github.io/<repo>/`.

You can also just open `index.html` in a browser locally.

## Project layout

```
index.html          page shell
css/styles.css      styling
js/ports.js         signal/connector types and connection rules
js/devices.js       equipment catalog (ports, internal routing, prices)
js/scenarios.js     levels: briefs, zones/distances, palettes, requirements, hints, reference solutions
js/engine.js        signal-flow simulation and grading
js/generator.js     random scenario generator (build + troubleshoot)
js/guide.js         Field Guide and How-to-Play text
js/app.js           UI (canvas, wiring, inspector, testing, progress)
tests/              node test that checks every level is solvable and starts unsolved
```

Run the checks with `node tests/scenarios.test.js` (hand-built levels) and `node tests/generator.test.js` (thousands of generated levels).

### Adding a scenario

Add an object to `SF.SCENARIOS` in `js/scenarios.js`. Give it zones and distances, `fixed` devices (or a `preset` for troubleshooting), a `palette`, `reqs`, `hints` and a `solution`. Then run the test to confirm the reference solution passes.
