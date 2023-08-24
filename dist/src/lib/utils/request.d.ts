type CacheValue = {
    isOk: boolean;
    statusCode?: number;
};
declare const _default: {
    get: (url: string, ignoreStatusCodes?: number[]) => Promise<CacheValue>;
};
export default _default;
