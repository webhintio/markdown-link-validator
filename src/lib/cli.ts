/**
 * @fileoverview Main CLI object, it reads the options from cli.
 */

/*
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */

import * as path from 'path';

import { debug as d } from './utils/debug';
import * as globby from 'globby';
import chalk from 'chalk';

const debug: debug.IDebugger = d(__filename);

import { options } from './cli/options';
import { CLIOptions, IMDFile, ILink } from './types';
import { MDFile } from './mdfile';

const getMDFiles = async (directory): Promise<IMDFile[]> => {
    const filesPath = await globby(['**/*.md', '!node_modules', '!**/node_modules'], { cwd: directory });

    return filesPath.map((relativePath) => {
        const file = new MDFile(directory, relativePath);

        return file;
    });
};

const validateLinks = async (mdFiles: IMDFile[]): Promise<void> => {
    for (const mdFile of mdFiles) {
        // Validate file by file to prevent 429 and socket hang up errors.
        await mdFile.validateLinks();
    }
};

const getInvalidLinks = (mdFiles: IMDFile[]): ILink[] => {
    return mdFiles.reduce((total, mdFile) => {
        const invalidLinks = [...mdFile.invalidLinks];

        return total.concat(invalidLinks);
    }, []);
};

const reportLinks = (mdFiles: IMDFile[], directory: string): void => {
    const totalLinks = {
        error: 0,
        success: 0
    };

    mdFiles.forEach((mdFile) => {
        const totalLinksInFile = {
            error: 0,
            success: 0
        };

        console.log('');
        console.log(chalk.cyan(mdFile.path));

        mdFile.links.forEach((link) => {
            if (link.isValid) {
                totalLinksInFile.success++;
                console.log(chalk.green(`✔ ${link.link}`));

                return;
            }
            totalLinksInFile.error++;

            console.log(chalk.red(`✖ ${link.link}:${link.position.line}:${link.position.column}`));
        });

        totalLinks.success += totalLinksInFile.success;
        totalLinks.error += totalLinksInFile.error;

        console.log('');

        let chalkColor = chalk.green;

        if (totalLinksInFile.error > 0) {
            chalkColor = chalk.red;
        }

        console.log(chalkColor(`Found ${totalLinksInFile.error + totalLinksInFile.success} links:
    ${totalLinksInFile.success} valid
    ${totalLinksInFile.error} invalid`));
    });

    console.log('');

    let chalkColor = chalk.green;

    if (totalLinks.error > 0) {
        chalkColor = chalk.red;
    }

    console.log(chalkColor(`Found a total of ${totalLinks.error + totalLinks.success} links in directory "${directory}":
    ${totalLinks.success} valid
    ${totalLinks.error} invalid`));
};

/**
 * Execute the analysis for the directories passed as parameter.
 * * e.g. markdown-link-validator ./documentation
 * * e.g. markdown-link-validator ./docs --debug
 */
export const execute = async (args: string[]) => {
    let currentOptions: CLIOptions;

    try {
        currentOptions = options.parse(args);
    } catch (err) {
        console.error(err);

        return 1;
    }

    /* Get the directories full path */
    const directories = currentOptions._.map((dir) => {
        return path.resolve(process.cwd(), dir);
    });

    debug(`Directories to analyze: ${directories.toString()}`);

    let invalidLinks = [];

    const start = Date.now();

    for (const directory of directories) {
        /* Get all md files */
        const mdFiles = await getMDFiles(directory);

        await validateLinks(mdFiles);

        reportLinks(mdFiles, directory);

        invalidLinks = invalidLinks.concat(getInvalidLinks(mdFiles));
    }

    console.log(`Time to validate: ${(Date.now() - start) / 1000}s`);

    if (invalidLinks.length > 0) {
        return 1;
    }

    return 0;
};
