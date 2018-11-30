import * as fs from 'fs';
import * as path from 'path';

import test from 'ava';

import { Link } from '../../src/lib/link';

const content: string = fs.readFileSync(path.join(__dirname, 'fixtures', 'link', 'content.md'), { encoding: 'utf-8' }); // eslint-disable-line no-sync

test('An exception is thrown if "content" is not set', (t) => {
    t.plan(1);

    try {
        new Link('#accessibility', 47, ''); // eslint-disable-line no-new
    } catch (e) {
        t.is(e.message, `"content" can't be empty or null`);
    }
});

test('An exception is thrown if "index" is not set', (t) => {
    t.plan(1);

    try {
        new Link('#accessibility', null, content); // eslint-disable-line no-new
    } catch (e) {
        t.is(e.message, `"index" has to be a number`);
    }
});

test('An exception is thrown if "link" is not set', (t) => {
    t.plan(1);

    try {
        new Link('', 47, content); // eslint-disable-line no-new
    } catch (e) {
        t.is(e.message, `"link" can't be empty or null`);
    }
});

test('Create a new Link has to set everything right', (t) => {
    const link = new Link('#accessibility', 47, content);

    t.is(link.link, '#accessibility');
    t.is(link.position.line, 3);
    t.is(link.position.column, 26);
});
