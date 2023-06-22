import http from 'http';
import https from 'https';
import { URL, fileURLToPath } from 'url';
import { debug as d } from './debug.js';
import delay from './delay.js';
const __filename = fileURLToPath(import.meta.url);
const debug = d(__filename);
const cache = new Map();
const defaultOptions = {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36' },
    rejectUnauthorized: false
};
const getHttpOptions = (url, method) => {
    return Object.assign({
        hostname: url.hostname,
        method,
        path: `${url.pathname}${url.search}`,
        protocol: url.protocol
    }, defaultOptions);
};
const getUrl = (url, method) => {
    return new Promise((resolve) => {
        debug(`Checking ${url} ...`);
        let redirects = 10;
        const get = (urlString, base) => {
            let urlObject;
            try {
                urlObject = new URL(urlString);
            }
            catch (e) {
                urlObject = new URL(urlString, base);
            }
            const options = getHttpOptions(urlObject, method);
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
                        return resolve({ isOk: false, statusCode: res.statusCode });
                    }
                    debug(`${url} OK`);
                    return resolve({ isOk: true, statusCode: res.statusCode });
                });
            };
            let req;
            if (options.protocol === 'https:') {
                req = https.request(options, callback);
            }
            else {
                req = http.request(options, callback);
            }
            req.on('error', (e) => {
                debug(`problem with request: ${e.message} - ${url}`);
                return resolve({ isOk: false, statusCode: 400 });
            });
            req.end();
        };
        get(url);
    });
};
const get = async (url) => {
    if (cache.has(url)) {
        debug(`Getting value from cache for url: ${url}`);
        return cache.get(url);
    }
    let response = await getUrl(url, 'head');
    let retries = 3;
    // Sometimes, head doesn't work, so we need to double check using the 'get' method.
    if (!response.isOk) {
        while (!response.isOk && retries > 0) {
            // Check if the value is now in the cache.
            if (cache.has(url)) {
                debug(`Getting value from cache for url: ${url}`);
                return cache.get(url);
            }
            response = await getUrl(url, 'get');
            if (!response.isOk) {
                await delay(500);
            }
            retries--;
        }
    }
    cache.set(url, response);
    return response;
};
export default { get };
//# sourceMappingURL=request.js.map