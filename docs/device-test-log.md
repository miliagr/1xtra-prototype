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
| | | | | | | _no pass recorded yet — see below_ |

## Outstanding

The scaffold has been verified in a desktop browser at phone viewport sizes
(portrait, landscape, rotation, notch insets simulated). **It has not yet been
run on physical hardware.** The first real pass needs a phone in hand:

- one mid-range Android (the 60fps target is set by this class of device)
- one iPhone with a notch or dynamic island (the safe-area handling is only
  truly proven here)

Until those two rows exist, treat the FPS and cold-load numbers as predicted,
not measured.
