/**
 * Add properties resolved and rejected to know the status of a promise.
 */
export default (promise) => {
    promise.then(() => {
        promise.resolved = true;
        return promise;
    })
        .catch(() => {
        promise.rejected = true;
        return promise;
    });
    return promise;
};
//# sourceMappingURL=wrappromise.js.map