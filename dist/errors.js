class NotFoundError extends Error {
    constructor(message) {
        super(message || 'NotFound');
        this.name = 'NotFoundError';
    }
}
