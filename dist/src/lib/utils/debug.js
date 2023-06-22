import path from 'path';
import d from 'debug';
const debugEnabled = (process.argv.includes('--debug'));
// must do this initialization *before* other requires in order to work
if (debugEnabled) {
    d.enable('markdown-link-validator:*');
}
export const debug = (filePath) => {
    let output = path.basename(filePath, path.extname(filePath));
    let dirPath = path.dirname(filePath);
    let currentDir = path.basename(dirPath);
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
//# sourceMappingURL=debug.js.map