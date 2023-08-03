/**
 * @fileoverview Main CLI object, it reads the options from cli.
 */
/*
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import events from 'events';
import fs from 'fs';
import readline from 'readline';
import { debug as d } from './utils/debug.js';
import { globby } from 'globby';
import chalk from 'chalk';
import wrapPromise from './utils/wrappromise.js';
const __filename = fileURLToPath(import.meta.url);
const debug = d(__filename);
import { options } from './cli/options.js';
import { MDFile } from './mdfile.js';
const getMDFiles = async (directory, ignorePatterns, ignoreStatusCodes, optionalMdExtension, allowOtherExtensions, noEmptyFiles) => {
    const filesPath = await globby(['**/*.md', '!node_modules', '!**/node_modules'], { cwd: directory });
    return filesPath.map((relativePath) => {
        const file = new MDFile(directory, relativePath, ignorePatterns, ignoreStatusCodes, optionalMdExtension, allowOtherExtensions, noEmptyFiles);
        return file;
    });
};
const validateLinks = async (mdFiles) => {
    const limit = 10;
    const promises = [];
    for (const mdFile of mdFiles) {
        promises.push(wrapPromise(mdFile.validateLinks()));
        if (promises.length >= limit) {
            // Wait for a file to be validated.
            await Promise.race(promises);
            // Remove the resolved/rejected file from the promises array.
            const index = promises.findIndex((promise) => {
                return promise.resolved || promise.rejected;
            });
            promises.splice(index, 1);
        }
    }
    // Wait for the pending promises to be resolved/rejected.
    await Promise.all(promises);
};
const getInvalidLinks = (mdFiles) => {
    return mdFiles.reduce((total, mdFile) => {
        return [...total, ...mdFile.invalidLinks];
    }, []);
};
const getInvalidLinkLabels = (mdFiles) => {
    return mdFiles.reduce((total, mdFile) => {
        return [...total, ...mdFile.invalidLinkLabels];
    }, []);
};
const reportLinks = (mdFiles, directory, quietMode, noEmptyFiles) => {
    const totalLinksByFile = {};
    const totalLinks = {
        error: 0,
        success: 0,
        warning: 0
    };
    mdFiles.forEach((mdFile) => {
        const messages = [];
        totalLinksByFile[mdFile.path] = {
            error: 0,
            success: 0,
            warning: 0
        };
        mdFile.links.forEach((link) => {
            if (link.isValid && link.statusCode !== 204) {
                totalLinksByFile[mdFile.path].success++;
                messages.push({
                    level: 'info',
                    message: chalk.green(`✔ [${link.statusCode}] ${link.link}`)
                });
            }
            else {
                const level = !noEmptyFiles && link.statusCode === 204 ? 'warning' : 'error';
                const errorMessage = chalk.red(`✖ [${link.statusCode}] ${link.link}:${link.position.line}:${link.position.column}`);
                const warningMessage = chalk.yellow(`○ [${link.statusCode}] ${link.link}:${link.position.line}:${link.position.column}`);
                totalLinksByFile[mdFile.path][level]++;
                messages.push({
                    level,
                    message: level === 'warning' ? warningMessage : errorMessage
                });
            }
        });
        mdFile.invalidLinkLabels.forEach((linkLabel) => {
            totalLinksByFile[mdFile.path].error++;
            messages.push({
                level: 'error',
                message: chalk.red(`✖ [${linkLabel.statusCode}] ${linkLabel.label}:${linkLabel.position.line}:${linkLabel.position.column}`)
            });
        });
        if (!quietMode || totalLinksByFile[mdFile.path].warning > 0 || totalLinksByFile[mdFile.path].error > 0) {
            console.log('');
            console.log(chalk.cyan(mdFile.path));
            messages
                .filter((message) => {
                return quietMode ? ['error', 'warning', undefined].includes(message.level) : true;
            })
                .forEach((message) => {
                console.log(message.message);
            });
        }
        totalLinks.success += totalLinksByFile[mdFile.path].success;
        totalLinks.error += totalLinksByFile[mdFile.path].error;
        let chalkColor = chalk.green;
        if (totalLinksByFile[mdFile.path].error > 0) {
            chalkColor = chalk.red;
        }
        if (!quietMode || totalLinksByFile[mdFile.path].error > 0) {
            console.log(chalkColor(`Found ${totalLinksByFile[mdFile.path].error + totalLinksByFile[mdFile.path].success} links and labels:
    ${totalLinksByFile[mdFile.path].success} valid
    ${totalLinksByFile[mdFile.path].error} invalid`));
        }
    });
    let chalkColor = chalk.green;
    if (totalLinks.error > 0) {
        chalkColor = chalk.red;
    }
    if (!quietMode || totalLinks.error > 0) {
        console.log('');
        console.log(chalkColor(`Found a total of ${totalLinks.error + totalLinks.success} links and labels in directory "${directory}":
    ${totalLinks.success} valid
    ${totalLinks.error} invalid`));
    }
};
/**
 * Execute the analysis for the directories passed as parameter.
 * * e.g. markdown-link-validator ./documentation
 * * e.g. markdown-link-validator ./docs --debug
 * * e.g. markdown-link-validator ./docs -i https?:\/\/test\.com\/.* -f gi
 */
const execute = async (args) => {
    let currentOptions;
    try {
        currentOptions = options.parse(args);
    }
    catch (err) {
        console.error(err);
        return 1;
    }
    if (currentOptions.help) {
        console.log(options.generateHelp());
        return 0;
    }
    console.log('Analyzing...');
    const ignorePatterns = currentOptions.ignorePatterns.map((pattern) => {
        return new RegExp(pattern, currentOptions.flags);
    });
    if (currentOptions.ignorePatternsFrom) {
        try {
            const rl = readline.createInterface({
                crlfDelay: Infinity,
                input: fs.createReadStream(currentOptions.ignorePatternsFrom)
            });
            rl.on('line', (pattern) => {
                if (pattern) {
                    ignorePatterns.push(new RegExp(pattern, currentOptions.flags));
                }
            });
            await events.once(rl, 'close');
        }
        catch (err) {
            console.error(err);
            return 1;
        }
    }
    const ignoreStatusCodes = [...(!currentOptions.noEmptyFiles ? [200, 204] : [200]), ...currentOptions.ignoreStatusCodes];
    /* Get the directories full path */
    const directories = currentOptions._.map((dir) => {
        return path.resolve(process.cwd(), dir);
    });
    debug(`Directories to analyze: ${directories.toString()}`);
    let invalidLinks = [];
    let invalidLinkLabels = [];
    const start = Date.now();
    for (const directory of directories) {
        /* Get all md files */
        const mdFiles = await getMDFiles(directory, ignorePatterns, ignoreStatusCodes, currentOptions.optionalMdExtension, currentOptions.allowOtherExtensions, currentOptions.noEmptyFiles);
        await validateLinks(mdFiles);
        reportLinks(mdFiles, directory, currentOptions.quietMode, currentOptions.noEmptyFiles);
        invalidLinks = invalidLinks.concat(getInvalidLinks(mdFiles));
        invalidLinkLabels = invalidLinkLabels.concat(getInvalidLinkLabels(mdFiles));
    }
    if (!currentOptions.quietMode) {
        console.log('');
        console.log(`Time to validate: ${(Date.now() - start) / 1000}s`);
    }
    if (invalidLinks.length > 0 || invalidLinkLabels.length > 0) {
        return 1;
    }
    return 0;
};
export default { execute };
//# sourceMappingURL=cli.js.map