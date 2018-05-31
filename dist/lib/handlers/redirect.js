"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@app/constants");
exports.baseRedirect = (msg) => {
    if (msg.data.to) {
        return {
            code: constants_1.STATUS_TEMP_REDIR,
            location: msg.data.to
        };
    }
    else {
        return {
            code: constants_1.STATUS_BAD_REQUEST,
            error: 'Parameter "to" is required'
        };
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXJlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2hhbmRsZXJzL3JlZGlyZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsOENBQXVFO0FBRTFELFFBQUEsWUFBWSxHQUFHLENBQUMsR0FBd0IsRUFBa0IsRUFBRTtJQUN2RSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ2YsT0FBTztZQUNMLElBQUksRUFBRSw2QkFBaUI7WUFDdkIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtTQUN0QixDQUFBO0tBQ0Y7U0FBTTtRQUNMLE9BQU87WUFDTCxJQUFJLEVBQUUsOEJBQWtCO1lBQ3hCLEtBQUssRUFBRSw0QkFBNEI7U0FDcEMsQ0FBQTtLQUNGO0FBQ0gsQ0FBQyxDQUFBIn0=