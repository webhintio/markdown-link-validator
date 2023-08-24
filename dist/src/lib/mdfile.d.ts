import { IMDFile, ILink, ILabel } from './types.js';
export declare class MDFile implements IMDFile {
    private _absoluteLinks;
    /**
     * This regex should match the following example:
     * * ```markdown
     * * [link label]: https://exxample.com
     * * ```
     */
    private _codeBlockRegex;
    private _urlRegex;
    /**
     * This regex should match the following example:
     * * [link](https://example.com)
     * * [link label]: https://exxample.com
     * * <img src="http://example.com/avatar.jpg">
     */
    private _absoluteRegex;
    /**
     * This regex should match the following example:
     * * http://example.com/avatar.jpg
     */
    private _standaloneRegex;
    private _cache;
    private _originalContent;
    private _content;
    private _ignorePatterns;
    private _ignoreStatusCodes;
    private _optionalMdExtension;
    private _allowOtherExtensions;
    private _noEmptyFiles;
    private _internalLinks;
    private _invalidLinks;
    private _invalidLabels;
    /**
     * This regex should match the following examples:
     * * [link](#somewhere)
     * * [link] (#somewhere) → invalid link.
     * * [link]( #somewhere)
     */
    private _internalRegex;
    private _links;
    private _path;
    private _relativeLinks;
    private _linkLabels;
    private _linkAnchors;
    private _directory;
    private _relativePath;
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
    private _relativeRegex;
    private _relativeRegexWithImages;
    /**
     * This regex should match the link labels and anchors:
     * * Text with a [link][anchor].
     * * [anchor]: http://example.com
     */
    private _labelRegex;
    private _anchorRegex;
    private _titles;
    private _titleRegex;
    private _normalizedTitles;
    constructor(directory: string, relativePath: string, ignorePatterns: RegExp[], ignoreStatusCodes: number[], optionalMdExtension?: boolean, allowOtherExtensions?: boolean, noEmptyFiles?: boolean);
    private stripCodeBlocks;
    private getRelativeLinks;
    private getAbsoluteLinks;
    private getInternalLinks;
    private getLinkLabels;
    private getLinkAnchors;
    private getTitles;
    private ignoreLink;
    private validateAbsoluteLinks;
    private validateRelativeLink;
    private validateRelativeLinks;
    private validateInternalLink;
    private validateInternalLinks;
    private validateLabel;
    validateLabels(): void;
    validateLinks(): Promise<void>;
    get absoluteLinks(): Set<ILink>;
    get internalLinks(): Set<ILink>;
    get linkLabels(): Set<ILabel>;
    get linkAnchors(): Set<string>;
    get path(): string;
    get relativeLinks(): Set<ILink>;
    get relativePath(): string;
    get titles(): Set<string>;
    get invalidLinkLabels(): Set<ILabel>;
    get invalidLinks(): Set<ILink>;
    get links(): Set<ILink>;
}
