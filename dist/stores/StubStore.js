"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
let StubStore = class StubStore {
    constructor() {
    }
    push(data) {
        // this.log.debug(data, 'Received');
    }
};
StubStore = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], StubStore);
exports.StubStore = StubStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3R1YlN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N0b3Jlcy9TdHViU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBaUM7QUFLakMsSUFBYSxTQUFTLEdBQXRCO0lBSUU7SUFFQSxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQVM7UUFDWixvQ0FBb0M7SUFDdEMsQ0FBQztDQUNGLENBQUE7QUFYWSxTQUFTO0lBRHJCLGdCQUFPLEVBQUU7O0dBQ0csU0FBUyxDQVdyQjtBQVhZLDhCQUFTIn0=