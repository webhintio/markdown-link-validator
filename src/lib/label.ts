import { ILabel, Position } from './types.js';

export class Label implements ILabel {
    private _isValid: boolean;
    private _statusCode: number;
    private _label: string;
    private _position: Position;

    public constructor(label: string, index: number, content: string) {
        if (!label) {
            throw new Error(`"label" can't be empty or null`);
        }

        if (typeof index !== 'number') {
            throw new Error(`"index" has to be a number`);
        }

        if (!content) {
            throw new Error(`"content" can't be empty or null`);
        }

        this._label = label;

        this.getPosition(index, content);
    }

    private getPosition(index: number, content: string) {
        const partialContent = content.substring(0, index);
        const lines = partialContent.split('\n');

        this._position = {
            column: lines[lines.length - 1].length + 1,
            line: lines.length
        };
    }

    public get label() {
        return this._label;
    }

    public get position() {
        return this._position;
    }

    public get isValid() {
        return this._isValid;
    }

    public get statusCode() {
        return this._statusCode;
    }

    public set isValid(value: boolean) {
        this._isValid = value;
    }

    public set statusCode(value: number) {
        this._statusCode = value;
    }
}
