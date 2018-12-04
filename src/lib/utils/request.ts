import * as r from 'request';

import { debug as d } from './debug';

const debug: debug.IDebugger = d(__filename);

const cache: Map<string, boolean> = new Map();

const request = r.defaults({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36' },
    strictSSL: false
});

const getUrl = (url: string, method: string): Promise<boolean> => {
    return new Promise((resolve) => {
        debug(`Checking ${url} ...`);

        request(url, { method }, (error, response) => {
            if (error) {
                debug(`Error checking ${url}: ${error}`);

                return resolve(false);
            }

            if (response.statusCode !== 200) {
                debug(`Status code for ${url}: ${response.statusCode}`);

                return resolve(false);
            }

            debug(`${url} OK`);

            return resolve(true);
        });
    });
};

export const get = async (url: string): Promise<boolean> => {
    if (cache.has(url)) {
        debug(`Getting value from cache for url: ${url}`);

        return cache.get(url);
    }

    let isOk = await getUrl(url, 'head');
    let retries = 3;

    // Sometimes, head doesn't work, so we need to double check using the 'get' method.
    if (!isOk) {
        while (!isOk && retries > 0) {
            isOk = await getUrl(url, 'get');
            retries--;
        }
    }

    cache.set(url, isOk);

    return isOk;
};
