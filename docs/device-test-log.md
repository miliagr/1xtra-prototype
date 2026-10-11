# On-device test log

The perf budget's FPS and load-time targets cannot be checked in CI. They are
checked here, by hand, on real hardware. One row per pass.

How to run a pass:

1. Open the preview URL on the phone with `?fps=1`.
2. Hard-reload (or use a private tab) so you are measuring a cold load.
3. Record the FPS readout's running minimum after ~30s of interaction.
4. Note anything that felt wrong — input lag, a jump on rotation, UI under the
   notch.

| Date | Build | Device | Browser | Cold load | FPS (min) | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | _no hardware pass recorded yet — see below_ |

## What has been verified so far

Scaffold commit, against the live Pages URL, in headless Chrome emulating an
iPhone 14 Pro (393x852 CSS px, DPR 3, touch events):

- Boots on WebGL, no console errors, no failed requests.
- Canvas is exactly 393x852 — fills the viewport, no letterboxing, no scroll
  (`scrollHeight` equals viewport height).
- `touch-action: none` and `overscroll-behavior: none` both resolve as
  intended, so no scroll, pinch-zoom or pull-to-refresh.
- Synthetic taps on the circle increment the counter and flip its colour; a tap
  outside the circle correctly does not register.
- Rotating to landscape and back re-runs the layout and re-centres cleanly.

## Outstanding

**Nothing here has run on physical hardware**, and two targets cannot be
confirmed without it:

- **60fps on mid-range Android.** Headless Chrome on a Mac says nothing useful
  about this. Needs one mid-range device — that class of hardware is what the
  target is set by.
- **Safe-area insets.** Chrome's device emulation reports insets of 0, so the
  notch and home-bar handling is correct by construction but unproven. Needs
  one iPhone with a dynamic island, in Safari, ideally also added to the home
  screen (standalone mode has different insets than the browser).

Until both rows exist, treat the FPS and cold-load figures in the README as
predicted, not measured.
