<div align="center">

# NimboXcloud

### Your xCloud. More control.
**Seu xCloud. Mais controle.**

**[Português](./README.md) · [English](./README_EN.md)**

**Built for the new Xbox Cloud Gaming experience — [play.xbox.com](https://play.xbox.com/)**

[**Install userscript**](./NimboXcloud.user.js) · [**Report an issue**](./../../issues) · [**Development roadmap**](./DEVELOPMENT_ROADMAP.md)

</div>

---

## A new experience deserves new possibilities

Xbox Cloud Gaming is evolving. While many customization tools were originally designed for the previous website, **NimboXcloud focuses on the new web experience at `play.xbox.com`**, not the older `xbox.com/play` page.

Our goal is to bring comparable customization and control capabilities to the new experience, explore additional possibilities, and make game streaming more transparent and configurable.

**NimboXcloud is an independent, open-source userscript.** It runs on the official Xbox Cloud Gaming website. It does not host games, replace the service, or guarantee access to Microsoft-controlled features.

## What NimboXcloud offers

| Area | Features |
| --- | --- |
| **Streaming and network** | Video-quality negotiation profiles, bitrate limits, data-center selection, latency-based preferences, and an option to prioritize IPv4. |
| **Video** | Visual presets, contrast and saturation controls, fit modes, fullscreen, and frame capture. |
| **Audio** | **10-band equalizer**, presets for different game and content types, compression, normalization, limiter, dialogue enhancement, and stereo balance. |
| **Controls and HUD** | Diagnostics for physical controllers, touch, keyboard and mouse; visual layout editor, scaling, per-game presets, import and export. |
| **Gyroscope** | Motion-sensor readings, calibration, axis preview, and experimental integration with controller input. |
| **Microphone and vibration** | Voice-input tests, browser-supported microphone settings, push-to-talk preference, and local vibration tests. |
| **Monitoring** | **NX panel** with available FPS, latency, jitter, packet loss, bitrate, resolution, codec, dropped frames, and session errors. |
| **Compatibility lab** | Experimental tools to investigate session negotiation, browser capabilities, and differences between xCloud client experiences. |

> **Note:** these are features present in the code, not a promise that every feature works in every session. Actual streaming quality and access permissions remain under the service's control.

## The NX panel

**NX** brings settings and diagnostics into one interface. The aim is to help players understand their sessions, try adjustments, and restore preferences without relying on separate diagnostic tools.

The project prioritizes **preserving native inputs**, including touch and physical controllers, rather than indiscriminately replacing the website's input systems.

## Development status

NimboXcloud is **under active development**. We distinguish code availability from tested functionality:

| Status | Examples |
| --- | --- |
| **Present in code** | Streaming preferences, visual filters, audio processing, NX panel, diagnostics, and layout management. |
| **Experimental / requires gameplay testing** | Native HUD repositioning, applied analog curves, in-game gyro output, and compatibility profiles. |
| **Not implemented or not demonstrated** | True CAS/FSR/DLSS upscaling, frame generation, full touch-based virtual keyboard and mouse, steering wheel with pedals, contextual aim assist, and integrated Remote Play. |

**The Xbox compatibility lab does not turn a browser into a real console or unlock console-only games.** We do not present unverified features as completed.

See the [development roadmap](./DEVELOPMENT_ROADMAP.md) for priorities and pending tests, and the [changelog](./CHANGELOG.md) for documented changes.

## Installation

1. Install a compatible userscript manager such as **Tampermonkey**.
2. Open **[NimboXcloud.user.js](./NimboXcloud.user.js)** and choose **Raw** to import it.
3. Enable the script and visit **[play.xbox.com](https://play.xbox.com/)**.

The userscript targets the **new website** (`https://play.xbox.com/*`), not the old one. Compatibility depends on website updates, browser capabilities, and permissions.

## Why open source?

NimboXcloud is an independent project by **KReight**, built to learn, experiment, and create alternatives with the community. Suggestions, code reviews, bug reports, and contributions are welcome.

The code is available under the **MIT License**, retaining applicable third-party notices. Its technical foundation derives from [xbox-cloud-unlock by RoyLiu04](https://github.com/RoyLiu04/xbox-cloud-unlock); engineering references include [Better xCloud by redphx](https://github.com/redphx/better-xcloud) and [Xbox Cloud Gaming Optimizer by darkchaox](https://github.com/darkchaox/xbox-cloud-gaming-optimizer). References and credits **do not imply partnership or endorsement**.

This is an **unofficial project**, not affiliated with Microsoft or Xbox. Experimental region adjustments may not work and may conflict with service terms.

## Explore the project

- [**Main userscript**](./NimboXcloud.user.js)
- [**Development roadmap**](./DEVELOPMENT_ROADMAP.md)
- [**Changelog**](./CHANGELOG.md)
- [**Architecture and technical limitations**](./docs/ARQUITETURA.md)
- [**Contributing**](./CONTRIBUTING.md)
- [**Português — README completo**](./README.md)

---

<div align="center">

**NimboXcloud — Your xCloud. More control.**

*Developed by KReight · Open source · MIT · Built for play.xbox.com*

</div>
