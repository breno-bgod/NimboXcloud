# NimboXcloud

**More control over browser-based cloud gaming.**

**[Leia em português](./README.md)**

**NimboXcloud — Developed by KReight.**

NimboXcloud is an unofficial, open-source userscript for [Xbox Cloud Gaming](https://play.xbox.com/). It experiments with local region settings, streaming data-center preferences, video quality negotiation, IPv4 filtering, and connection diagnostics, with particular attention to **Android, Samsung DeX, and Windows**. It runs on the official website and **is not an independent cloud gaming service**.

> **Current status:** version **3.6.37**, experimental. Implemented code does not guarantee compatibility with every xCloud release. End-to-end streaming tests on different devices have not yet been documented.

## About the developer

I am **KReight**, a self-taught JavaScript student and independent developer in training. I learn at home through courses, tutorials from various YouTube channels, and free learning resources available online. I study code and open-source projects to understand how they work and put that knowledge into practice.

**NimboXcloud is a personal learning experiment.** I use it to test what I have learned so far, understand mistakes, and build my own solutions. I am not a company or a professional development team. **Advice, feedback, bug reports, code reviews, suggestions, and contributions are welcome**, regardless of experience level.

## Open source, forks, and credits

NimboXcloud is **open-source software under the MIT License**. You may read, study, copy, modify, fork, redistribute, and use the code in your own projects, including commercial ones, subject to the license terms.

**My request:** if NimboXcloud helps or inspires your work, please acknowledge **KReight / NimboXcloud** in your credits or acknowledgments and, if possible, link to this repository. This is a **courtesy request**, not an additional legal requirement beyond the MIT License.

**License requirement:** copies and substantial portions of the software must retain applicable copyright and MIT license notices, including notices for reused third-party code. Acknowledgment does not transfer authorship of the original code or imply endorsement by its authors. See [LICENSE](./LICENSE).

## Features

| Feature | Description |
| --- | --- |
| Video profiles | 1080p/Windows default, experimental 1080p HQ/Tizen, and manual 720p |
| Bitrate | Automatic or configurable limits; higher requested values do not guarantee server delivery |
| Region | Experimental adjustments to market and territory information |
| Data center | Preference among streaming regions supported by the script |
| Connectivity | Optional filtering of IPv6 ICE candidates to prefer IPv4 |
| Diagnostics | Expandable NX panel with RTT, packet loss, bitrate, resolution, and dropped frames |
| Input | The userscript does not force priority between touch, controller, and keyboard/mouse |

**Important:** HQ/Tizen is an experimental negotiation profile, not a promise of 1440p or guaranteed 1080p. Actual video quality depends on the service and WebRTC session. The current default is 1080p/Windows to avoid interfering with native touch controls.

## Why this project exists

Microsoft introduced a [new Xbox Cloud Gaming web experience](https://news.xbox.com/en-us/2026/01/26/try-the-new-xbox-cloud-gaming-web-experience-now-in-public-preview/) in 2026. The older `xbox.com/play` and newer `play.xbox.com` experiences differ, and extensions and userscripts may need adaptation. This project explores ways to improve the newer website while learning from existing open-source work.

**The project is still experimental.** Planned features should not be treated as finished or verified.

## Installation

1. Install a compatible userscript manager, such as Tampermonkey.
2. Open [xbox-cloud-unlock-ptbr.user.js](./NimboXcloud.user.js).
3. Use GitHub's **Raw** option to download or import the script.
4. Enable the script and visit [play.xbox.com](https://play.xbox.com/).

The script runs at `document-start`. Browser support and permissions vary. **Update metadata is configured** (`@updateURL` and `@downloadURL` point to the `main` branch), but **automatic updates cannot work normally while this repository is private** because the Raw endpoint requires authorized access. Until the script is publicly accessible, update manually. Do not change repository visibility without reviewing the published content.

## Contributing

**Help of any kind is welcome.** Open an issue to share an idea, ask a question, describe a bug, or suggest an improvement. Pull requests are also welcome. Please do not include access tokens, cookies, account identifiers, or other sensitive data in reports.

See [CONTRIBUTING.md](./CONTRIBUTING.md), [CHANGELOG.md](./CHANGELOG.md), [Architecture](./docs/ARQUITETURA.md), and [Roadmap](./docs/ROADMAP.md).

## Acknowledgments and code origins

- [**RoyLiu04 / xbox-cloud-unlock**](https://github.com/RoyLiu04/xbox-cloud-unlock): original MIT-licensed technical base of this userscript. The original copyright and license notice are preserved in [LICENSE](./LICENSE).
- [**redphx / better-xcloud**](https://github.com/redphx/better-xcloud): inspiration and technical reference for streaming controls, quality profiles, and architecture.
- [**redphx / better-xcloud-android**](https://github.com/redphx/better-xcloud-android): reference for mobile experiences.
- [**darkchaox / xbox-cloud-gaming-optimizer**](https://github.com/darkchaox/xbox-cloud-gaming-optimizer): historical reference for region-related approaches.

These acknowledgments **do not imply affiliation, partnership, or endorsement**.

## Limitations and legal notice

NimboXcloud is **unofficial** and is not affiliated with Microsoft, Xbox, or the referenced developers. Service APIs and behavior can change without notice. Region-related adjustments may not work and may conflict with service terms. No setting guarantees a specific resolution, bitrate, latency, or availability. Real-device compatibility testing is still needed.

**Maintainer:** KReight · **License:** MIT · **Status:** Experimental / educational.
