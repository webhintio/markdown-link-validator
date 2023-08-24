import { ILink, Position } from './types.js';
export declare class Link implements ILink {
    private _isValid;
    private _statusCode;
    private _link;
    private _position;
    constructor(link: string, index: number, content: string);
    private getPosition;
    get link(): string;
    get position(): Position;
    get isValid(): boolean;
    get statusCode(): number;
    set isValid(value: boolean);
    set statusCode(value: number);
}
