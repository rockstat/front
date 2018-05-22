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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGVscGVycy9jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFCQUE0QixHQUEwQjtJQUNwRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNwQztTQUFNO1FBQ0wsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7S0FDcEI7QUFDSCxDQUFDO0FBTkQsa0NBTUM7QUFHRCxxQkFBNEIsR0FBMEI7SUFDcEQsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtRQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0tBQ2xDO1NBQU07UUFDTCxHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUNwQjtBQUNILENBQUM7QUFORCxrQ0FNQyJ9