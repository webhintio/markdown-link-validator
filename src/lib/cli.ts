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
    const filesPath = await globby('**/*.md', { cwd: directory });

    const result = [];

    filesPath.forEach((relativePath) => {
        const file = new MDFile(directory, relativePath);

        result.push(file);
    });

    return result;
};

const validateLinks = async (mdFiles: IMDFile[]): Promise<void> => {
    const promises: Promise<void>[] = [];

    for (const mdFile of mdFiles) {
        promises.push(mdFile.validateLinks());
    }

    await Promise.all(promises);
};

const getInvalidLinks = (mdFiles: IMDFile[]): ILink[] => {
    return mdFiles.reduce((total, mdFile) => {
        const invalidLinks = [...mdFile.invalidLinks];

        return total.concat(invalidLinks);
    }, []);
};

const reportInvalidLinks = (mdFiles: IMDFile[], directory: string): void => {
    let totalInvalidLinks = 0;

    mdFiles.forEach((mdFile) => {
        let totalInFile = 0;

        if (mdFile.invalidLinks.size === 0) {
            return;
        }

        console.log('');
        console.log(chalk.cyan(mdFile.path));

        mdFile.invalidLinks.forEach((link) => {
            totalInFile++;
            console.log(`Line: ${link.position.line} Column: ${link.position.line} Link: ${link.link}`);
        });

        totalInvalidLinks += totalInFile;

        if (totalInFile > 0) {
            console.log('');
            console.log(chalk.red(`Found ${totalInFile} invalid links`));
        }
    });

    if (totalInvalidLinks > 0) {
        console.log('');
        console.log(chalk.red(`Found a total of ${totalInvalidLinks} invalid links in directory: ${directory}`));
    }
};

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

    for (const directory of directories) {
        /* Get all md files */
        const mdFiles = await getMDFiles(directory);

        await validateLinks(mdFiles);

        reportInvalidLinks(mdFiles, directory);

        invalidLinks = invalidLinks.concat(getInvalidLinks(mdFiles));
    }

    if (invalidLinks.length > 0) {
        return 1;
    }

    return 0;
};
