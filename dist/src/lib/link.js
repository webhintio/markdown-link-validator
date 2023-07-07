export class Link {
    _isValid;
    _statusCode;
    _link;
    _position;
    constructor(link, index, content) {
        if (!link) {
            throw new Error(`"link" can't be empty or null`);
        }
        if (typeof index !== 'number') {
            throw new Error(`"index" has to be a number`);
        }
        if (!content) {
            throw new Error(`"content" can't be empty or null`);
        }
        this._link = link;
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
    get link() {
        return this._link;
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
//# sourceMappingURL=link.js.map