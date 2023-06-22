import fs from 'fs';
import path from 'path';
import uslug from 'uslug';
import request from './utils/request.js';
import { Link } from './link.js';
export class MDFile {
    _absoluteLinks;
    /**
     * This regex should match the following example:
     * * ```markdown
     * * [link label]: https://exxample.com
     * * ```
     */
    _codeBlockRegex = /`{3}.*?`{3}/gs;
    _urlRegex = /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%,*_+.~#?&//=]*)/;
    /**
     * This regex should match the following example:
     * * [link](https://example.com)
     * * [link label]: https://exxample.com
     * * <img src="http://example.com/avatar.jpg">
     */
    _absoluteRegex = new RegExp(`(]\\(|]:\\s*)(${this._urlRegex.source})`, 'g');
    /**
     * This regex should match the following example:
     * * http://example.com/avatar.jpg
     */
    _standaloneRegex = new RegExp(`(?<!(]\\(|]:\\s*))${this._urlRegex.source}`, 'g');
    _cache;
    _originalContent;
    _content;
    _ignorePatterns;
    _optionalMdExtension;
    _allowOtherExtensions;
    _internalLinks;
    _invalidLinks;
    /**
     * This regex should match the following examples:
     * * [link](#somewhere)
     * * [link] (#somewhere) → invalid link.
     * * [link]( #somewhere)
     */
    _internalRegex = /]\s*\(\s*(#\S*?)\)/g;
    _links;
    _path;
    _relativeLinks;
    _directory;
    _relativePath;
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
    _relativeRegex = /(?<![!`].*?)]\(([./][^)]*)\)|(]:\s*)([./][^\s]*)(?!.*?`)/g;
    _relativeRegexWithImages = /(?<!`.*?)]\(([./][^)]*)\)|(]:\s*)([./][^\s]*)(?!.*?`)/g;
    _titles;
    _titleRegex = /^#{1,6}\s+(.*)$/gm;
    _normalizedTitles;
    constructor(directory, relativePath, ignorePatterns, optionalMdExtension = false, allowOtherExtensions = false) {
        this._directory = directory;
        this._relativePath = relativePath;
        this._path = path.join(directory, relativePath);
        this._absoluteLinks = new Set();
        this._cache = new Set();
        this._internalLinks = new Set();
        this._relativeLinks = new Set();
        this._titles = new Set();
        this._normalizedTitles = new Set();
        this._ignorePatterns = ignorePatterns;
        this._optionalMdExtension = optionalMdExtension;
        this._allowOtherExtensions = allowOtherExtensions;
        this._originalContent = fs.readFileSync(this._path, { encoding: 'utf-8' }); // eslint-disable-line no-sync
        this.stripCodeBlocks();
        this.getRelativeLinks();
        this.getAbsoluteLinks();
        this.getInternalLinks();
        this.getTitles();
    }
    stripCodeBlocks() {
        this._content = this._originalContent.replaceAll(this._codeBlockRegex, (match) => {
            return '\n'.repeat(match.split('\n').length - 1);
        });
    }
    getRelativeLinks() {
        let val;
        while ((val = this._allowOtherExtensions ? this._relativeRegexWithImages.exec(this._content) : this._relativeRegex.exec(this._content)) !== null) {
            const url = val[3] || val[1];
            if (this._cache.has(url)) {
                continue;
            }
            // [link](./somewhere.md) → shift will be 1 because of "]("
            let shift = 2;
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
    getAbsoluteLinks() {
        let val;
        while ((val = this._absoluteRegex.exec(this._content)) !== null) {
            const url = val[2];
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
            const url = val[0].replace(/\.$/, '');
            if (this._cache.has(url)) {
                continue;
            }
            this._cache.add(url);
            this._absoluteLinks.add(new Link(url, val.index, this._content));
        }
    }
    getInternalLinks() {
        let val;
        while ((val = this._internalRegex.exec(this._content)) !== null) {
            const url = val[1];
            if (this._cache.has(url)) {
                continue;
            }
            this._cache.add(url);
            this._internalLinks.add(new Link(url, val.index + 2, this._content));
        }
    }
    getTitles() {
        let val;
        while ((val = this._titleRegex.exec(this._content)) !== null) {
            this._titles.add(val[1]);
            this._normalizedTitles.add(uslug(val[1]));
        }
    }
    ignoreLink(url) {
        return this._ignorePatterns.some((pattern) => {
            return pattern.test(url);
        });
    }
    async validateAbsoluteLinks() {
        const promises = [];
        for (const link of this._absoluteLinks) {
            if (this.ignoreLink(link.link)) {
                link.isValid = true;
                continue;
            }
            const promise = request.get(link.link)
                .then((linkStatus) => {
                link.isValid = linkStatus.isOk;
                link.statusCode = linkStatus.statusCode;
            });
            promises.push(promise);
        }
        await Promise.all(promises);
    }
    validateRelativeLink(link) {
        if (this.ignoreLink(link.link)) {
            link.isValid = true;
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
        }
        else {
            // Else append a `.md` extensions if missing
            filePath = this._optionalMdExtension && !path.extname(originalFilePath) ? `${originalFilePath}.md` : originalFilePath;
        }
        // Relative links should point to a md file.
        if (!this._allowOtherExtensions && path.extname(filePath) !== '.md') {
            link.isValid = false;
            return;
        }
        const exists = fs.existsSync(filePath); // eslint-disable-line no-sync
        if (!exists) {
            link.isValid = false;
            return;
        }
        if (exists && this._allowOtherExtensions && path.extname(filePath) !== '.md') {
            link.isValid = true;
            return;
        }
        if (!hash) {
            link.isValid = true;
            return;
        }
        /**
         * 1. Read file content
         * 2. Get titles
         * 3. Check if has exists.
         */
        const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' }); // eslint-disable-line no-sync
        const normalizedTitles = new Set();
        let val;
        while ((val = this._titleRegex.exec(fileContent)) !== null) {
            normalizedTitles.add(uslug(val[1]));
        }
        link.isValid = normalizedTitles.has(hash);
    }
    validateRelativeLinks() {
        this._relativeLinks.forEach((link) => {
            this.validateRelativeLink(link);
        });
    }
    validateInternalLink(link) {
        if (this.ignoreLink(link.link)) {
            link.isValid = true;
            return;
        }
        if (this._normalizedTitles.has(link.link.substr(1))) {
            link.isValid = true;
            return;
        }
        link.isValid = false;
    }
    validateInternalLinks() {
        this._internalLinks.forEach((link) => {
            this.validateInternalLink(link);
        });
    }
    async validateLinks() {
        await this.validateAbsoluteLinks();
        this.validateRelativeLinks();
        this.validateInternalLinks();
    }
    get absoluteLinks() {
        return this._absoluteLinks;
    }
    get internalLinks() {
        return this._internalLinks;
    }
    get path() {
        return this._path;
    }
    get relativeLinks() {
        return this._relativeLinks;
    }
    get relativePath() {
        return this._relativePath;
    }
    get titles() {
        return this._titles;
    }
    get invalidLinks() {
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
    get links() {
        if (this._links) {
            return this._links;
        }
        this._links = new Set([...this._absoluteLinks, ...this._relativeLinks, ...this._internalLinks]);
        return this._links;
    }
}
//# sourceMappingURL=mdfile.js.map