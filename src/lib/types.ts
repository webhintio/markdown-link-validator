export type CLIOptions = {
    _: string[];
    pattern: string;
    debug: boolean;
};

export type Issue = {
    message: string;
    path: string;
};

export type Position = {
    line: number;
    column: number;
};

export interface ILink {
    link: string;
    isValid: boolean;
    position: Position;
}

export interface IMDFile {
    absoluteLinks: Set<ILink>;
    internalLinks: Set<ILink>;
    invalidLinks: Set<ILink>;
    path: string;
    relativeLinks: Set<ILink>;
    relativePath: string;
    titles: Set<string>;
    validateLinks: () => Promise<void>;
}
