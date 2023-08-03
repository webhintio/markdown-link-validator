import fs from 'fs';
import path from 'path';

import uslug from 'uslug';

import request from './utils/request.js';

import { IMDFile, ILink, ILabel } from './types.js';
import { Link } from './link.js';
import { Label } from './label.js';

export class MDFile implements IMDFile {
    private _absoluteLinks: Set<ILink>;
    /**
     * This regex should match the following example:
     * * ```markdown
     * * [link label]: https://exxample.com
     * * ```
     */
    private _codeBlockRegex: RegExp = /`{3}.*?`{3}/gs;
    private _urlRegex: RegExp = /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%,*_+.~#?&//=]*)/;
    /**
     * This regex should match the following example:
     * * [link](https://example.com)
     * * [link label]: https://exxample.com
     * * <img src="http://example.com/avatar.jpg">
     */
    private _absoluteRegex: RegExp = new RegExp(`(]\\(|]:\\s*)(${this._urlRegex.source})`, 'g');
    /**
     * This regex should match the following example:
     * * http://example.com/avatar.jpg
     */
    private _standaloneRegex: RegExp = new RegExp(`(?<!(]\\(|]:\\s*))${this._urlRegex.source}`, 'g');
    private _cache: Set<string>;
    private _originalContent: string;
    private _content: string;
    private _ignorePatterns: RegExp[];
    private _ignoreStatusCodes: number[];
    private _optionalMdExtension: boolean;
    private _allowOtherExtensions: boolean;
    private _noEmptyFiles: boolean;
    private _internalLinks: Set<ILink>;
    private _invalidLinks: Set<ILink>;
    private _invalidLabels: Set<ILabel>;
    /**
     * This regex should match the following examples:
     * * [link](#somewhere)
     * * [link] (#somewhere) → invalid link.
     * * [link]( #somewhere)
     */
    private _internalRegex: RegExp = /]\s*\(\s*(#\S*?)\)/g;
    private _links: Set<ILink>;
    private _path: string;
    private _relativeLinks: Set<ILink>;
    private _linkLabels: Set<ILabel>;
    private _linkAnchors: Set<string>;
    private _directory: string;
    private _relativePath: string;
    /**
     * This regex should match the following examples:
     * * [link label]: /somewhere.md
     * * [link label]: ./somewhere.md
     * * [link label]: ../somewhere.md
     * * [link label]: /somewhere
     * * [link label]: ./somewhere
     * * [link label]: ../somewhere
     * * [link label]:/somewhere.md
     * * [link label]:./somewhere.md
     * * [link label]:../somewhere.md
     * * [link label]:/somewhere
     * * [link label]:./somewhere
     * * [link label]:../somewhere
     * * [link](/somewhere.md)
     * * [link](./somewhere.md)
     * * [link](../somewhere.md)
     * * [link](/somewhere/)
     * * [link](./somewhere/)
     * * [link](../somewhere/)
     */
    private _relativeRegex: RegExp = /(?<![!`].*?)]\(([./][^)]*)\)|(]:\s*)([./][^\s]*)(?!.*?`)/g;
    private _relativeRegexWithImages: RegExp = /(?<!`.*?)]\(([./][^)]*)\)|(]:\s*)([./][^\s]*)(?!.*?`)/g;
    /**
     * This regex should match the link labels and anchors:
     * * Text with a [link][anchor].
     * * [anchor]: http://example.com
     */
    private _labelRegex: RegExp = new RegExp(`\\[.+?\\]\\[(.+?)\\]`, 'g');
    private _anchorRegex: RegExp = new RegExp(`(?<![-*]\\s+)\\[(.+?)\\]:\\s*`, 'g');
    private _titles: Set<string>;
    private _titleRegex: RegExp = /^#{1,6}\s+(.*)$/gm;
    private _normalizedTitles: Set<string>;

    public constructor(directory: string, relativePath: string, ignorePatterns: RegExp[], ignoreStatusCodes: number[], optionalMdExtension: boolean = false, allowOtherExtensions: boolean = false, noEmptyFiles: boolean = false) {
        this._directory = directory;
        this._relativePath = relativePath;
        this._path = path.join(directory, relativePath);
        this._absoluteLinks = new Set();
        this._cache = new Set();
        this._internalLinks = new Set();
        this._relativeLinks = new Set();
        this._linkLabels = new Set();
        this._linkAnchors = new Set();
        this._titles = new Set();
        this._normalizedTitles = new Set();
        this._ignorePatterns = ignorePatterns;
        this._ignoreStatusCodes = ignoreStatusCodes;
        this._optionalMdExtension = optionalMdExtension;
        this._allowOtherExtensions = allowOtherExtensions;
        this._noEmptyFiles = noEmptyFiles;

        this._originalContent = fs.readFileSync(this._path, { encoding: 'utf-8' }); // eslint-disable-line no-sync

        this.stripCodeBlocks();
        this.getRelativeLinks();
        this.getAbsoluteLinks();
        this.getInternalLinks();
        this.getLinkLabels();
        this.getLinkAnchors();
        this.getTitles();
    }

    private stripCodeBlocks() {
        this._content = this._originalContent.replaceAll(this._codeBlockRegex, (match) => {
            return '\n'.repeat(match.split('\n').length - 1);
        });
    }

    private getRelativeLinks() {
        let val: RegExpExecArray;

        while ((val = this._allowOtherExtensions ? this._relativeRegexWithImages.exec(this._content) : this._relativeRegex.exec(this._content)) !== null) {
            const url: string = val[3] || val[1];

            if (this._cache.has(url)) {
                continue;
            }

            // [link](./somewhere.md) → shift will be 1 because of "]("
            let shift: number = 2;

            if (!val[1]) {
                /**
                 * [link label]: ./somewhere.md → val[2] will be ": "
                 * [link label]:./somewhere.md → val[2] will be ":"
                 */
                shift = val[2].length;
            }

            this._cache.add(url);
            this._relativeLinks.add(new Link(url, val.index + shift, this._content));
        }
    }

    private getAbsoluteLinks() {
        let val: RegExpExecArray;

        while ((val = this._absoluteRegex.exec(this._content)) !== null) {
            const url: string = val[2];

            if (this._cache.has(url)) {
                continue;
            }

            /**
             * [link](https://example.com) → val[1] will be "]("
             * [link label]: https://exxample.com → val[1] will be "]: "
             * <img src="http://example.com/avatar.jpg"> → val[1] will be 'src="'
             */
            const shift = val[1].length;

            this._cache.add(url);
            this._absoluteLinks.add(new Link(url, val.index + shift, this._content));
        }

        while ((val = this._standaloneRegex.exec(this._content)) !== null) {
            const url: string = val[0].replace(/\.$/, '');

            if (this._cache.has(url)) {
                continue;
            }

            this._cache.add(url);
            this._absoluteLinks.add(new Link(url, val.index, this._content));
        }
    }

    private getInternalLinks() {
        let val: RegExpExecArray;

        while ((val = this._internalRegex.exec(this._content)) !== null) {
            const url: string = val[1];

            if (this._cache.has(url)) {
                continue;
            }

            this._cache.add(url);
            this._internalLinks.add(new Link(url, val.index + 2, this._content));
        }
    }

    private getLinkLabels() {
        let val: RegExpExecArray;

        while ((val = this._labelRegex.exec(this._content)) !== null) {
            const label: string = val[1];

            this._linkLabels.add(new Label(label, val.index, this._content));
        }
    }

    private getLinkAnchors() {
        let val: RegExpExecArray;

        while ((val = this._anchorRegex.exec(this._content)) !== null) {
            const anchor: string = val[1];

            this._linkAnchors.add(val[1]);
        }
    }

    private getTitles() {
        let val: RegExpExecArray;

        while ((val = this._titleRegex.exec(this._content)) !== null) {
            this._titles.add(val[1]);
            this._normalizedTitles.add(uslug(val[1]));
        }
    }

    private ignoreLink(url: string): boolean {
        return this._ignorePatterns.some((pattern) => {
            return pattern.test(url);
        });
    }

    private async validateAbsoluteLinks(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const link of this._absoluteLinks) {
            if (this.ignoreLink(link.link)) {
                link.isValid = true;
                link.statusCode = 200;

                continue;
            }

            const promise: Promise<void> = request.get(link.link, this._ignoreStatusCodes)
                .then((linkStatus): void => {
                    link.isValid = linkStatus.isOk;
                    link.statusCode = linkStatus.statusCode;
                });

            promises.push(promise);
        }

        await Promise.all(promises);
    }

    private validateRelativeLink(link: ILink): void {
        if (this.ignoreLink(link.link)) {
            link.isValid = true;
            link.statusCode = 200;

            return;
        }

        const fullPath = link.link.startsWith('/') ? path.join(this._directory, link.link) : path.join(path.dirname(this._path), link.link);
        const [originalFilePath, hash] = fullPath.split('#');

        const originalFilePathIsDirectory = fs.existsSync(originalFilePath) && fs.statSync(originalFilePath).isDirectory(); // eslint-disable-line no-sync

        // Relative links should point to a md file, but extension is optional
        let filePath = originalFilePath;

        if (originalFilePathIsDirectory) {
            // If relative link points to a folder, search for a `index.md` file inside that folder.
            filePath = this._optionalMdExtension ? path.join(originalFilePath, 'index.md') : originalFilePath;
        } else {
            // Else append a `.md` extensions if missing
            filePath = this._optionalMdExtension && !path.extname(originalFilePath) ? `${originalFilePath}.md` : originalFilePath;
        }

        // Relative links should point to a md file.
        if (!this._allowOtherExtensions && path.extname(filePath) !== '.md') {
            link.isValid = false;
            link.statusCode = 404;

            return;
        }

        const exists = fs.existsSync(filePath); // eslint-disable-line no-sync

        if (!exists) {
            link.isValid = false;
            link.statusCode = 404;

            return;
        }

        if (exists && this._allowOtherExtensions && path.extname(filePath) !== '.md') {
            link.isValid = true;
            link.statusCode = 200;

            return;
        }

        /**
         * 1. Read file content
         * 2. Check if file is not empty
         * 3. Get titles
         * 4. Check if has exists.
         */

        const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' }); // eslint-disable-line no-sync
        const normalizedTitles: Set<string> = new Set();
        let val: RegExpExecArray;

        if (!hash) {
            link.isValid = !(this._noEmptyFiles && !fileContent);
            link.statusCode = !fileContent ? 204 : 200;

            return;
        }

        while ((val = this._titleRegex.exec(fileContent)) !== null) {
            normalizedTitles.add(uslug(val[1]));
        }

        link.isValid = normalizedTitles.has(hash);
        link.statusCode = link.isValid ? 200 : 404;
    }

    private validateRelativeLinks(): void {
        this._relativeLinks.forEach((link) => {
            this.validateRelativeLink(link);
        });
    }

    private validateInternalLink(link: ILink): void {
        if (this.ignoreLink(link.link)) {
            link.isValid = true;
            link.statusCode = 200;

            return;
        }

        if (this._normalizedTitles.has(link.link.substring(1))) {
            link.isValid = true;
            link.statusCode = 200;

            return;
        }

        link.isValid = false;
        link.statusCode = 404;
    }

    private validateInternalLinks(): void {
        this._internalLinks.forEach((link) => {
            this.validateInternalLink(link);
        });
    }

    private validateLabel(label: ILabel): void {
        if (this._linkAnchors.has(label.label)) {
            label.isValid = true;
            label.statusCode = 200;

            return;
        }

        label.isValid = false;
        label.statusCode = 404;
    }

    public validateLabels(): void {
        this._linkLabels.forEach((label) => {
            this.validateLabel(label);
        });
    }

    public async validateLinks(): Promise<void> {
        await this.validateAbsoluteLinks();
        this.validateRelativeLinks();
        this.validateInternalLinks();
        this.validateLabels();
    }

    public get absoluteLinks() {
        return this._absoluteLinks;
    }

    public get internalLinks() {
        return this._internalLinks;
    }

    public get linkLabels() {
        return this._linkLabels;
    }

    public get linkAnchors() {
        return this._linkAnchors;
    }

    public get path() {
        return this._path;
    }

    public get relativeLinks() {
        return this._relativeLinks;
    }

    public get relativePath() {
        return this._relativePath;
    }

    public get titles() {
        return this._titles;
    }

    public get invalidLinkLabels(): Set<ILabel> {
        if (this._invalidLabels) {
            return this._invalidLabels;
        }

        const invalidLabels = [...this._linkLabels]
            .filter((label) => {
                return !label.isValid;
            });

        this._invalidLabels = new Set(invalidLabels);

        return this._invalidLabels;
    }

    public get invalidLinks(): Set<ILink> {
        if (this._invalidLinks) {
            return this._invalidLinks;
        }

        const invalidAbsoluteLinks = [...this._absoluteLinks]
            .filter((link) => {
                return !link.isValid;
            });
        const invalidRelativeLinks = [...this._relativeLinks]
            .filter((link) => {
                return !link.isValid;
            });
        const invalidInternalLinks = [...this._internalLinks]
            .filter((link) => {
                return !link.isValid;
            });


        this._invalidLinks = new Set(invalidAbsoluteLinks.concat(invalidRelativeLinks).concat(invalidInternalLinks));

        return this._invalidLinks;
    }

    public get links(): Set<ILink> {
        if (this._links) {
            return this._links;
        }

        this._links = new Set([...this._absoluteLinks, ...this._relativeLinks, ...this._internalLinks]);

        return this._links;
    }
}
