/** Convenience wrapper to add a delay using promises. */
export default (millisecs) => {
    return new Promise((resolve) => {
        setTimeout(resolve, millisecs);
    });
};
//# sourceMappingURL=delay.js.map