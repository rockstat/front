"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import 'module-alias/register';
// import 'tsconfig-paths/register';
require("source-map-support/register");
const AppServer_1 = require("@app/AppServer");
AppServer_1.appServer.start();
exports.default = AppServer_1.appServer;
