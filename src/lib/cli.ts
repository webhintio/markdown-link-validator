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

import { debug as d } from './utils/debug.js';
import { globby } from 'globby';
import chalk from 'chalk';
import wrapPromise from './utils/wrappromise.js';

const __filename = fileURLToPath(import.meta.url);

const debug: debug.IDebugger = d(__filename);

import { options } from './cli/options.js';
import { CLIOptions, IMDFile, ILink } from './types.js';
import { MDFile } from './mdfile.js';

const getMDFiles = async (directory, ignorePatterns: RegExp[], optionalMdExtension?: boolean, allowOtherExtensions?: boolean): Promise<IMDFile[]> => {
    const filesPath = await globby(['**/*.md', '!node_modules', '!**/node_modules'], { cwd: directory });

    return filesPath.map((relativePath) => {
        const file = new MDFile(directory, relativePath, ignorePatterns, optionalMdExtension, allowOtherExtensions);

        return file;
    });
};

const validateLinks = async (mdFiles: IMDFile[]): Promise<void> => {
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

const getInvalidLinks = (mdFiles: IMDFile[]): ILink[] => {
    return mdFiles.reduce((total, mdFile) => {
        const invalidLinks = [...mdFile.invalidLinks];

        return [...total, ...mdFile.invalidLinks];
    }, []);
};

const reportLinks = (mdFiles: IMDFile[], directory: string, quietMode?: boolean): void => {
    const totalLinksByFile = {};
    const totalLinks = {
        error: 0,
        success: 0
    };

    mdFiles.forEach((mdFile) => {
        totalLinksByFile[mdFile.path] = {
            error: 0,
            success: 0
        };

        if (!quietMode) {
            console.log('');

            console.log(chalk.cyan(mdFile.path));
        }

        mdFile.links.forEach((link) => {
            if (link.isValid) {
                totalLinksByFile[mdFile.path].success++;

                if (!quietMode) {
                    console.log(chalk.green(`✔ ${link.link}`));
                }

                return;
            }
            totalLinksByFile[mdFile.path].error++;

            if (quietMode && totalLinksByFile[mdFile.path].error === 1) {
                console.log('');

                console.log(chalk.cyan(mdFile.path));
            }

            console.log(chalk.red(`✖ ${link.link}:${link.position.line}:${link.position.column}`));
        });

        totalLinks.success += totalLinksByFile[mdFile.path].success;
        totalLinks.error += totalLinksByFile[mdFile.path].error;

        let chalkColor = chalk.green;

        if (totalLinksByFile[mdFile.path].error > 0) {
            chalkColor = chalk.red;
        }

        if (!quietMode) {
            console.log(chalkColor(`Found ${totalLinksByFile[mdFile.path].error + totalLinksByFile[mdFile.path].success} links:
    ${totalLinksByFile[mdFile.path].success} valid
    ${totalLinksByFile[mdFile.path].error} invalid`));
        }

    });

    let chalkColor = chalk.green;

    if (totalLinks.error > 0) {
        chalkColor = chalk.red;
    }

    console.log('');
    console.log(chalkColor(`Found a total of ${totalLinks.error + totalLinks.success} links in directory "${directory}":
    ${totalLinks.success} valid
    ${totalLinks.error} invalid`));
};

/**
 * Execute the analysis for the directories passed as parameter.
 * * e.g. markdown-link-validator ./documentation
 * * e.g. markdown-link-validator ./docs --debug
 * * e.g. markdown-link-validator ./docs -i https?:\/\/test\.com\/.* -f gi
 */
const execute = async (args: string[]) => {
    let currentOptions: CLIOptions;

    try {
        currentOptions = options.parse(args);
    } catch (err) {
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

    /* Get the directories full path */
    const directories = currentOptions._.map((dir) => {
        return path.resolve(process.cwd(), dir);
    });

    debug(`Directories to analyze: ${directories.toString()}`);

    let invalidLinks = [];

    const start = Date.now();

    for (const directory of directories) {
        /* Get all md files */
        const mdFiles = await getMDFiles(directory, ignorePatterns, currentOptions.optionalMdExtension, currentOptions.allowOtherExtensions);

        await validateLinks(mdFiles);

        reportLinks(mdFiles, directory, currentOptions.quietMode);

        invalidLinks = invalidLinks.concat(getInvalidLinks(mdFiles));
    }

    console.log('');
    console.log(`Time to validate: ${(Date.now() - start) / 1000}s`);

    if (invalidLinks.length > 0) {
        return 1;
    }

    return 0;
};

export default { execute };
