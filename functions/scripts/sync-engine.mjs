import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const shared = new URL('../src/shared/', import.meta.url);
mkdirSync(shared, { recursive: true });
cpSync(fileURLToPath(new URL('../../src/game-engine/', import.meta.url)), fileURLToPath(new URL('game-engine/', shared)), { recursive: true });
mkdirSync(new URL('types/', shared), { recursive: true });
cpSync(new URL('../../src/types/game.ts', import.meta.url), new URL('types/game.ts', shared));
