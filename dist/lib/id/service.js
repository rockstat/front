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
const snow_flake_1 = require("./snow_flake");
const round_counter_1 = require("./round_counter");
let IdService = class IdService {
    constructor() {
        this.rpcCounter = new round_counter_1.IdGenRoundCounter();
    }
    eventId() {
        return this.sf.take();
    }
    userId() {
        return this.sf.take();
    }
    rpcId() {
        return this.rpcCounter.take().toString(36);
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", snow_flake_1.IdGenShowFlake)
], IdService.prototype, "sf", void 0);
IdService = __decorate([
    typedi_1.Service()
], IdService);
exports.IdService = IdService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaWQvc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUF5QztBQUN6Qyw2Q0FBOEM7QUFDOUMsbURBQW9EO0FBR3BELElBQWEsU0FBUyxHQUF0QjtJQURBO1FBTUUsZUFBVSxHQUFzQixJQUFJLGlDQUFpQixFQUFFLENBQUM7SUFjMUQsQ0FBQztJQVpDLE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVELE1BQU07UUFDSixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVELEtBQUs7UUFDSCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FFRixDQUFBO0FBaEJDO0lBREMsZUFBTSxFQUFFOzhCQUNMLDJCQUFjO3FDQUFDO0FBSFIsU0FBUztJQURyQixnQkFBTyxFQUFFO0dBQ0csU0FBUyxDQW1CckI7QUFuQlksOEJBQVMifQ==