export type CLIOptions = {
    _: string[];
    debug: boolean;
    flags: string;
    optionalMdExtension: boolean;
    allowOtherExtensions: boolean;
    noEmptyFiles: boolean;
    quietMode: boolean;
    help: boolean;
    ignorePatterns: string[];
    ignorePatternsFrom: string;
    ignoreStatusCodes: number[];
};

export type Position = {
    line: number;
    column: number;
};

interface IFragment {
    isValid: boolean;
    position: Position;
    statusCode?: number;
}

export interface ILink extends IFragment {
    link: string;
}

export interface ILabel extends IFragment {
    label: string;
}

export interface IMDFile {
    absoluteLinks: Set<ILink>;
    internalLinks: Set<ILink>;
    invalidLinks: Set<ILink>;
    invalidLinkLabels: Set<ILabel>;
    links: Set<ILink>;
    path: string;
    relativeLinks: Set<ILink>;
    relativePath: string;
    titles: Set<string>;
    validateLinks: () => Promise<void>;
}

export type Message = {
    message: string;
    level?: 'info' | 'warning' | 'error';
}
