"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function handleStart(cls) {
    if (cls.started === true) {
        throw new Error('Already started');
    }
    else {
        cls.started = true;
    }
}
exports.handleStart = handleStart;
function handleSetup(cls) {
    if (cls.started === true) {
        throw new Error('Already setup');
    }
    else {
        cls.started = true;
    }
}
exports.handleSetup = handleSetup;
//# sourceMappingURL=class.js.map