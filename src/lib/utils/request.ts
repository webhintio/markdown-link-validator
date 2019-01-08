import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

import { debug as d } from './debug';
import delay from './delay';

const debug: debug.IDebugger = d(__filename);

const cache: Map<string, boolean> = new Map();

const defaultOptions: https.RequestOptions = {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36' },
    rejectUnauthorized: false
};

const getHttpOptions = (url: URL, method: string): https.RequestOptions => {
    return Object.assign({
        hostname: url.hostname,
        method,
        path: `${url.pathname}${url.search}`,
        protocol: url.protocol
    }, defaultOptions);
};

const getUrl = (url: string, method: string): Promise<boolean> => {
    return new Promise((resolve) => {
        debug(`Checking ${url} ...`);
        let redirects = 10;

        const get = (urlString: string, base?: string) => {
            let urlObject: URL;

            try {
                urlObject = new URL(urlString);
            } catch (e) {
                urlObject = new URL(urlString, base);
            }

            const options: https.RequestOptions = getHttpOptions(urlObject, method);

            const callback = (res) => {
                res.setEncoding('utf8');
                res.on('data', () => { });
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        debug(`Status code for ${url}: ${res.statusCode}`);

                        // If there is a redirect, check if the destination of the redirect exists.
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
                            redirects--;

                            return get(res.headers.location, urlObject.href);
                        }

                        return resolve(false);
                    }

                    debug(`${url} OK`);

                    return resolve(true);
                });
            };

            let req: http.ClientRequest;

            if (options.protocol === 'https:') {
                req = https.request(options, callback);
            } else {
                req = http.request(options, callback);
            }

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message} - ${url}`);

                return resolve(false);
            });

            req.end();
        };

        get(url);
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
            // Check if the value is now in the cache.
            if (cache.has(url)) {
                debug(`Getting value from cache for url: ${url}`);

                return cache.get(url);
            }

            isOk = await getUrl(url, 'get');

            if (!isOk) {
                await delay(500);
            }

            retries--;
        }
    }

    cache.set(url, isOk);

    return isOk;
};
