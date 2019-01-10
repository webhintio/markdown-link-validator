/**
 * Add properties resolved and rejected to know the status of a promise.
 */
export default (promise: any): any => {
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
