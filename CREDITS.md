<!-- markdownlint-disable MD013 -->

# Credits

Jargle is built on the work below. Versions are the ones pinned in the lock files in this repo.

## Fonts

Jargle uses one custom font. It is served from the app itself, not from a font CDN.

| Font | By | License |
| --- | --- | --- |
| Fredoka | The Fredoka Project Authors | [SIL Open Font License 1.1](https://openfontlicense.org/) |

## Libraries in the app

| Library | Version | License | Used for |
| --- | --- | --- | --- |
| [Preact](https://preactjs.com/) | 11.0.2 | MIT | The user interface |
| [Tauri](https://tauri.app/) (Rust crate `tauri`) | 2.12.5 | MIT or Apache-2.0 | The Mac and Windows shell |
| [tauri-plugin-opener](https://crates.io/crates/tauri-plugin-opener) | 2.7.2 | MIT or Apache-2.0 | Opening outside links in the browser |
| [Capacitor](https://capacitorjs.com/) (`@capacitor/core`, `@capacitor/android`) | 8.5.3 | MIT | The Android shell |

## Build and test tools

| Tool | Version | License | Used for |
| --- | --- | --- | --- |
| [Vite](https://vite.dev/) | 8.3.5 | MIT | Building the web app |
| [@preact/preset-vite](https://github.com/preactjs/preset-vite) | 2.10.6 | MIT | Preact support in Vite |
| [TypeScript](https://www.typescriptlang.org/) | 6.0.3 | Apache-2.0 | Type checking |
| [Vitest](https://vitest.dev/) | 5.0.5 | MIT | Tests |
| [jsdom](https://github.com/jsdom/jsdom) | 30.1.3 | MIT | Browser stand-in for tests |
| [oxlint](https://oxc.rs/) | 1.89.0 | MIT | Linting |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped) | 24.19.2 | MIT | Node type definitions |
| [Tauri CLI](https://tauri.app/) (`@tauri-apps/cli`) | 2.12.4 | MIT or Apache-2.0 | Building the desktop apps |
| [Capacitor CLI](https://capacitorjs.com/) (`@capacitor/cli`) | 8.5.3 | MIT | Syncing the Android project |
| [GitHub Actions](https://github.com/features/actions) and [GitHub Pages](https://pages.github.com/) | n/a | Service | Tests, builds, releases and the public site |
| [Caddy](https://caddyserver.com/) | n/a | Apache-2.0 | Web server on the Oracle Cloud VM |

## Art and sound

Floyd and Bud are 3D characters modeled in [Blender](https://www.blender.org/) by a script in `art/`, then rendered to small WebP images. The app icon is made the same way. The badges and other icons are drawings written as code (SVG). The sounds are generated in the app with the Web Audio API. There are no image, audio or video files from other people in this repo.

## Words and facts

Every word in `content/` lists the pages it was drafted from under `sources`. Those pages belong to their publishers, such as government agencies, dictionaries, museums, library guides and device makers. Jargle links to them and uses its own wording.

## License

Jargle's own code and content are under the [MIT License](LICENSE). The libraries and fonts above keep their own licenses.
