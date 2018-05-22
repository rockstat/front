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
const SIZE = 99999;
let IdGenRoundCounter = class IdGenRoundCounter {
    constructor() {
        this.num = Math.round(Math.random() * SIZE);
    }
    take() {
        if (this.num === SIZE) {
            this.num = 0;
        }
        return ++this.num;
    }
};
IdGenRoundCounter = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], IdGenRoundCounter);
exports.IdGenRoundCounter = IdGenRoundCounter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91bmRfY291bnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaWQvcm91bmRfY291bnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUFpQztBQUVqQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUM7QUFHbkIsSUFBYSxpQkFBaUIsR0FBOUI7SUFFRTtRQUNFLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELElBQUk7UUFDRixJQUFJLElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNwQixDQUFDO0NBQ0YsQ0FBQTtBQVpZLGlCQUFpQjtJQUQ3QixnQkFBTyxFQUFFOztHQUNHLGlCQUFpQixDQVk3QjtBQVpZLDhDQUFpQiJ9