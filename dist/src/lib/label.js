export class Label {
    _isValid;
    _statusCode;
    _label;
    _position;
    constructor(label, index, content) {
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
    getPosition(index, content) {
        const partialContent = content.substring(0, index);
        const lines = partialContent.split('\n');
        this._position = {
            column: lines[lines.length - 1].length + 1,
            line: lines.length
        };
    }
    get label() {
        return this._label;
    }
    get position() {
        return this._position;
    }
    get isValid() {
        return this._isValid;
    }
    get statusCode() {
        return this._statusCode;
    }
    set isValid(value) {
        this._isValid = value;
    }
    set statusCode(value) {
        this._statusCode = value;
    }
}
//# sourceMappingURL=label.js.map