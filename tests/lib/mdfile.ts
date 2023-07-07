import sinon from 'sinon';
import test from 'ava';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const request = {
    get(): Promise<boolean> {
        return Promise.resolve(false);
    }
};

import { MDFile } from '../../src/lib/mdfile.js';

const internalPositions = {
    '#can-evaluatescript': {
        column: 28,
        line: 13
    },
    '#elementelement-type': {
        column: 31,
        line: 3
    },
    '#fetchendresource-type': {
        column: 35,
        line: 4
    },
    '#fetcherrorresource-type': {
        column: 20,
        line: 5
    },
    '#fetchstartresource-type': {
        column: 20,
        line: 6
    },
    '#scanend': {
        column: 17,
        line: 7
    },
    '#scanstart': {
        column: 19,
        line: 8
    },
    '#traversedown': {
        column: 22,
        line: 9
    },
    '#traverseend': {
        column: 21,
        line: 10
    },
    '#traversestart': {
        column: 23,
        line: 11
    },
    '#traverseup': {
        column: 20,
        line: 12
    }
};

const absolutePositions = {
    'https://browsersl.ist/': {
        column: 61,
        line: 35
    },
    'https://github.com/ai/browserslist#queries': {
        column: 26,
        line: 39
    },
    'https://github.com/ai/browserslist#readme': {
        column: 32,
        line: 6
    },
    'https://webhint.io/docs/hints/hint-highest-available-document-mode/': {
        column: 14,
        line: 40
    }
};

const relativeLinks = {
    '../assets/not-md.txt': {
        column: 33,
        line: 7,
        valid: true
    },
    '../assets/pixel.png': {
        column: 21,
        line: 9,
        valid: true
    },
    '../link/empty.md': {
        column: 15,
        line: 37,
        valid: false
    },
    '../mdfile/valid-internal.md#canevaluatescript': {
        column: 19,
        line: 34,
        valid: false
    },
    '../mdfile/valid-internal.md#elementelement-type': {
        column: 19,
        line: 33,
        valid: true
    },
    './absolute-links': {
        column: 33,
        line: 5,
        valid: true
    },
    './absolute-links.md': {
        column: 33,
        line: 3,
        valid: true
    },
    './folder-link': {
        column: 33,
        line: 11,
        valid: true
    },
    './invalid-internal.md': {
        column: 18,
        line: 31,
        valid: true
    },
    './invalid.md': {
        column: 19,
        line: 32,
        valid: false
    },
    './valid-internal.md#canevaluatescript': {
        column: 54,
        line: 17,
        valid: false
    },
    './valid-internal.md#elementelement-type': {
        column: 51,
        line: 15,
        valid: true
    },
    '/fixtures/mdfile/absolute-links.md': {
        column: 29,
        line: 13,
        valid: true
    },
    '/fixtures/mdfile/valid-internal.md': {
        column: 15,
        line: 35,
        valid: true
    },
    '/invalid-root.md': {
        column: 15,
        line: 36,
        valid: false
    }
};

test('Create a new MDFile has to found all the links in the markdown file', (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/links.md', [], [200], false, true);

    t.is(mdfile.internalLinks.size, 2);
    // There is more than 5 absolute links, but 5 are uniques.
    t.is(mdfile.absoluteLinks.size, 5);
    // There is more than 7 relative links, but 7 are uniques.
    t.is(mdfile.relativeLinks.size, 8);
    t.is(mdfile.titles.size, 3);
});

test('Internal links are validated correctly', async (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/valid-internal.md', [], [200]);

    await mdfile.validateLinks();

    mdfile.internalLinks.forEach((link) => {
        t.true(link.isValid);
    });
});

test('Internal links positions are calculated correctly', (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/valid-internal.md', [], [200]);

    mdfile.internalLinks.forEach((link) => {
        const expectedPosition = internalPositions[link.link];

        t.is(link.position.column, expectedPosition.column);
        t.is(link.position.line, expectedPosition.line);
    });
});

test('Invalid internal links are validated correctly', async (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/invalid-internal.md', [], [200]);

    await mdfile.validateLinks();

    mdfile.internalLinks.forEach((link) => {
        if (link.link.includes('canevaluatescript')) {
            t.false(link.isValid);

            return;
        }

        t.true(link.isValid);
    });
});

test('Absolute links positions are calculated correctly', (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/absolute-links.md', [], [200]);

    mdfile.absoluteLinks.forEach((link) => {
        const expectedPosition = absolutePositions[link.link];

        t.is(link.position.column, expectedPosition.column);
        t.is(link.position.line, expectedPosition.line);
    });
});

test('Absolute links are validated correctly', async (t) => {
    const stub: sinon.SinonStub<string[], Promise<boolean>> = sinon.stub(request, 'get') as sinon.SinonStub<string[], Promise<boolean>>;

    stub.withArgs('https://webhint.io/docs/hints/hint-highest-available-document-mode/')
        .resolves(false);
    stub.resolves(true);

    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/absolute-links.md', [], [200]);

    await mdfile.validateLinks();

    mdfile.absoluteLinks.forEach((link) => {
        if (link.link === 'https://webhint.io/docs/hints/hint-highest-available-document-mode/') {
            t.false(link.isValid);

            return;
        }

        t.true(link.isValid);
    });

    stub.restore();
});

test('Relative links positions are calculated correctly', (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/relative-links.md', [], [200]);

    mdfile.relativeLinks.forEach((link) => {
        const expectedPosition = relativeLinks[link.link];

        t.is(link.position.column, expectedPosition.column);
        t.is(link.position.line, expectedPosition.line);
    });
});

test('Relative links are validated correctly', async (t) => {
    const mdfile = new MDFile(__dirname, 'fixtures/mdfile/relative-links.md', [], [200], true, true, true);

    await mdfile.validateLinks();

    mdfile.relativeLinks.forEach((link) => {
        t.is(link.isValid, relativeLinks[link.link].valid);
    });
});
