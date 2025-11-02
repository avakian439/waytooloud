import path from 'path';
import { app } from 'electron';
import { isDevMode } from './util.js';

export function getPreloadPath() {
    return path.join(
        app.getAppPath(),
        isDevMode() ? '.' : '..',
        '/dist-electron/preload.cjs',
    );
}