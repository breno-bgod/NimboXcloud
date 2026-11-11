# NimboXcloud

**More control over Xbox Cloud Gaming, directly in your browser.**

**[Leia em português](./README.md)**

**NimboXcloud** is an open-source userscript that adds a control center to [Xbox Cloud Gaming](https://play.xbox.com/). It provides streaming preferences, local video and audio adjustments, controller-layout tools, and connection diagnostics while continuing to use the official service.

> **Verified code version:** 4.12.16. Under development. A feature's presence in code does not guarantee successful operation in every session; experimental features are labeled below.

## What NimboXcloud does

### Streaming and network
- Video negotiation profiles for **720p, 1080p and experimental 1080p HQ**.
- Automatic bitrate or configurable SDP-requested limits.
- Data-center selection and preference based on historical RTT.
- Optional IPv4 preference through filtering IPv6 WebRTC ICE candidates.
- Experimental market and territory adjustments.

Actual quality, service availability and game access remain under Xbox Cloud Gaming's control.

### Video and display
- **Original, Balanced, Vivid and Custom** visual profiles.
- Local contrast, color and saturation adjustments.
- Fit modes, fullscreen, PNG frame capture and reduced background-tab visual processing.

The “sharpness” setting adjusts contrast; it is **not CAS, FSR, DLSS or true upscaling**.

### Audio
- Volume, mute and output selection where supported.
- **10-band equalizer** (32 Hz–16 kHz).
- **FPS, racing, cinema, music and dialogue** presets.
- Compression, normalization, limiter, dialogue enhancement, mono and L/R balance.

### Controls and HUD
- Diagnostics for **physical controllers, touch, mouse and keyboard**, including simultaneous activity.
- Draggable layout preview, button scaling, per-game presets, import/export and backups.
- **Experimental native HUD integration:** safely matched controls may be repositioned through CSS without synthesizing touch input.
- **Experimental analog-stick response curves** and native-input restoration.

### Gyroscope — experimental
- Sensor readings, calibration and axis preview.
- Preview inversion, deadzone and smoothing.
- Experimental gamepad-axis contribution with selectable strength and always-on or LT-held activation.

Some settings affect **only the preview**, not actual gameplay. In-game output still requires validation.

### Microphone and vibration
- Microphone selection and testing, input meter, noise suppression, echo cancellation, automatic gain, mute and push-to-talk preference.
- Local controller and device vibration tests where supported.

Voice chat and in-game haptics depend on the service and device capabilities.

### Real-time diagnostics
The **NX panel** displays available **FPS, RTT, jitter, packet loss, received bitrate, resolution, codec, dropped frames, freezes and server** metrics. It also includes session diagnostics, error history and structured reports.

### Compatibility lab — experimental
Platform-experience profiles, session negotiation observations, browser capability checks, protocol reports and an experimental **Xbox Shell** interface help investigate compatibility. They **do not emulate real Xbox hardware or server authentication, and do not unlock console-only games**.

## Development status

**Present in code:** streaming preferences, visual filters, audio processing, layout editor, NX panel and diagnostic tools.

**Experimental or not yet validated in real gameplay:** native HUD integration, applied analog curves, gyroscope game output, compatibility profiles and end-to-end operation across environments.

**Not implemented or not demonstrated in this userscript:** frame generation, true CAS/FSR/DLSS upscaling, full touch-based virtual keyboard/mouse, virtual steering wheel with pedals, contextual aim assist, integrated Remote Play and real Xbox-console authentication.

The goal is to **improve the player experience without promising capabilities that the browser or service cannot provide**.

## Installation

1. Install a compatible userscript manager such as Tampermonkey.
2. Open [NimboXcloud.user.js](./NimboXcloud.user.js) and use **Raw** to import it.
3. Enable the script and visit [play.xbox.com](https://play.xbox.com/).

The script runs at document start. **If the repository is private**, Raw access requires authorization and automatic userscript updates may not work; import new versions manually.

## About and credits

**Developed by KReight.** NimboXcloud is an independent learning and development project; feedback, bug reports, code reviews and contributions are welcome.

Distributed under the **MIT License**, with applicable third-party license notices preserved. Its technical foundation derives from [xbox-cloud-unlock (RoyLiu04)](https://github.com/RoyLiu04/xbox-cloud-unlock), with engineering references including [Better xCloud (redphx)](https://github.com/redphx/better-xcloud) and [Xbox Cloud Gaming Optimizer (darkchaox)](https://github.com/darkchaox/xbox-cloud-gaming-optimizer). These references do not imply endorsement or partnership.

NimboXcloud **is not affiliated with Microsoft or Xbox**. Region adjustments may fail or conflict with service terms.

## Documentation and contributions

- [Changelog](./CHANGELOG.md)
- [Development roadmap and pending tests](./DEVELOPMENT_ROADMAP.md)
- [Architecture and technical limitations](./docs/ARQUITETURA.md)
- [Contributing](./CONTRIBUTING.md)
- [Portuguese README](./README.md)
