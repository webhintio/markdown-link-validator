import path from 'path';

import d from 'debug';

const debugEnabled: boolean = (process.argv.includes('--debug'));

// must do this initialization *before* other requires in order to work
if (debugEnabled) {
    d.enable('markdown-link-validator:*');
}

export const debug = (filePath: string): d.IDebugger => {

    let output: string = path.basename(filePath, path.extname(filePath));
    let dirPath: string = path.dirname(filePath);
    let currentDir: string = path.basename(dirPath);

    /*
     * The debug message is generated from the file path, e.g.:
     *
     *  * src/lib/cli.ts => markdown-link-validator:cli
     */

    while (currentDir && currentDir !== 'lib') {
        output = `${currentDir}:${output}`;

        dirPath = path.join(dirPath, '..');
        currentDir = path.basename(dirPath);
    }

    return d(`markdown-link-validator:${output}`);
};
