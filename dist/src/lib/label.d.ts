import { ILabel, Position } from './types.js';
export declare class Label implements ILabel {
    private _isValid;
    private _statusCode;
    private _label;
    private _position;
    constructor(label: string, index: number, content: string);
    private getPosition;
    get label(): string;
    get position(): Position;
    get isValid(): boolean;
    get statusCode(): number;
    set isValid(value: boolean);
    set statusCode(value: number);
}
