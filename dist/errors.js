class NotFoundError extends Error {
    constructor(message) {
        super(message || 'NotFound');
        this.name = 'NotFoundError';
    }
}
//# sourceMappingURL=errors.js.map