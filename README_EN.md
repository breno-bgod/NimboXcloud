<div align="center">

# NimboXcloud

### Your xCloud. More control.
**Seu xCloud. Mais controle.**

**[Português](./README.md) · [English](./README_EN.md)**

**Under development for the new Xbox Cloud Gaming experience — [play.xbox.com](https://play.xbox.com/)**

[**Try the userscript**](./NimboXcloud.user.js) · [**Report an issue**](./../../issues) · [**Development roadmap**](./DEVELOPMENT_ROADMAP.md)

</div>

---

## A solo project in development

I'm **KReight**, the creator and sole developer of **NimboXcloud**. This is a small, independent personal project that I'm building and testing step by step. **It is not a finished product or a stable release.**

Xbox Cloud Gaming is evolving. While many customization tools were originally designed for the previous website, **I'm developing NimboXcloud for the new web experience at `play.xbox.com`**, not the older `xbox.com/play` page.

My goal is to explore how to bring comparable control, accessibility, and customization features to the new experience, experiment with new ideas, and gradually improve cloud gaming. Not everything I'm planning is working yet.

**NimboXcloud is an experimental, open-source userscript.** I'm developing it to run on the official Xbox Cloud Gaming website. It does not host games, replace the service, or guarantee access to Microsoft-controlled features.

## What I'm implementing and testing

| Area | Features currently present in the code |
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

## The NX panel (work in progress)

I'm building **NX** to bring settings and diagnostics into one interface. The aim is to help players understand their sessions, try adjustments, and restore preferences without relying on separate diagnostic tools.

My priority is **preserving native inputs**, including touch and physical controllers, rather than indiscriminately replacing the website's input systems.

## Touch keyboard and mouse HUD (experimental)

The integrated **NimboTouch** module is loaded by the main userscript through `@require`. It provides relative mouse movement by touch, a WASD joystick, keyboard buttons, and an editable HUD. Open **NX → Keyboard and mouse → Enable keyboard and mouse**. It requires a game/session that accepts keyboard and mouse input; it does not convert mouse movement into an analog stick. Do not install older standalone NimboTouch copies alongside the main userscript.

## The new NX experience — minimal interface (in development)

The **NX** panel is being reorganized to reduce clutter during gameplay without removing advanced tools. Its navigation separates **Video, Streaming, Audio, Voice, Controls, Keyboard and mouse, Servers, Personalization, Compatibility, and System**. Each area keeps its own settings instead of mixing physical-controller input with keyboard and mouse.

### NX Stream Monitor

An optional overlay, independent from the main panel, is present in the code for use while the panel is closed:

- **Selectable metrics:** decoded FPS, WebRTC RTT, received bitrate, packet loss, resolution, and jitter, when available.
- **Layouts:** horizontal, vertical, compact, and automatic based on viewport width.
- **Appearance:** transparent-to-black background, four text colors, and adjustable scale.
- **Placement:** four screen corners or drag-to-position.
- **Region:** flags for known identified streaming datacenters; selecting a region does not prove the physical streaming location.
- **Local preferences:** settings are stored in the browser.

The monitor reuses existing WebRTC telemetry; **RTT is not the game's internal ping**. Real gameplay and cross-device layout validation remain pending.

### Region comparison: current limitations

The code stores **historical RTT for datacenters actually used in past sessions**. Live probing of all alternative regions, including periodic background checks, **has not been implemented**. Historical values must not be represented as current ping.

See the [architecture](./docs/ARQUITETURA.md) and [development roadmap](./DEVELOPMENT_ROADMAP.md) for technical status and remaining work.

## Current status: in development

**This project is under development and maintained by one person.** Some features are written in code, but I'm still testing their integration, compatibility, and behavior in real gameplay. The system is not finished:

| Status | Examples |
| --- | --- |
| **Present in code** | Streaming preferences, visual filters, audio processing, NX panel, diagnostics, and layout management. |
| **Experimental / requires gameplay testing** | Native HUD repositioning, applied analog curves, in-game gyro output, and compatibility profiles. |
| **Experimental / technical validation in progress** | Remote Play xHome: console discovery, session creation, SDP/ICE, and best-effort remote DELETE are present in code; playable video, audio, and controls are not yet verified. |
| **Not implemented or not demonstrated** | True CAS/FSR/DLSS upscaling, frame generation, full touch-based virtual keyboard and mouse, steering wheel with pedals, and contextual aim assist. |

**The Xbox compatibility lab does not turn a browser into a real console or unlock console-only games.** We do not present unverified features as completed.

See the [development roadmap](./DEVELOPMENT_ROADMAP.md) for priorities and pending tests, and the [changelog](./CHANGELOG.md) for documented changes.

## How to test the project

1. Install a compatible userscript manager such as **Tampermonkey**.
2. Open **[NimboXcloud.user.js](./NimboXcloud.user.js)** and choose **Raw** to import it.
3. Enable the script and visit **[play.xbox.com](https://play.xbox.com/)**.

I'm developing the userscript for the **new website** (`https://play.xbox.com/*`), not the old one. **Use it at your own risk: bugs, incompatibilities, and behavior changes are expected during testing.** Compatibility depends on website updates, browser capabilities, and permissions.

## Who is building this?

I'm **KReight**, the creator and sole developer currently working on NimboXcloud. I'm learning, planning, coding, and testing its features incrementally; there is no company or development team behind it. Suggestions, code reviews, bug reports, and contributions are welcome.

The code is available under the **GNU General Public License version 3 or later (GPL-3.0-or-later)**. Applicable copyright and license notices for incorporated components are retained in [Third-party notices](./THIRD_PARTY_NOTICES.md).

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

*KReight's solo project · Under development · Open source · GPL-3.0-or-later · play.xbox.com*

</div>

## License

The current distribution uses [GPL-3.0-or-later](./LICENSE). Redistribution and modifications must comply with the GPL, including providing corresponding source where required. Applicable [third-party MIT notices](./THIRD_PARTY_NOTICES.md) are retained. Earlier MIT releases keep their original grants.
