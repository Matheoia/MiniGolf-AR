# three_vite
Basic THREE.js template using [Vite](https://vitejs.dev).

Allows testing and modifying [official THREE.js examples](https://threejs.org/examples/) locally, at lightning speed.
After trying Parcel and Rollup, this is probably the most developer-friendly to start THREE.js development in 2023 : it's insanely fast, it supports live reload out of the box, while remaining simple to use and to extend.

## Batteries included

Pre-configured to support :

- glTF file loading
- ammo.js wasm physics library
- VSCode launch scripts
- THREE.js type definitions : for IntelliSense in VS Code

Have a look at vite.config.js and customize it to your needs (additional libraries, file formats etc.).

## Installation

Install [Node.js](https://nodejs.org)

- Clone or download repo
- run `npm install` : fetches and install all dependencies
- `npm run build` : packages all code and resources into the `dist` folder
- `npm run dev` : launches a server and opens your browser in `https://localhost:5173` by default
- Edit your code : your changes are reflected instantly!



