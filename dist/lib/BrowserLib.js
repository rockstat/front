"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const fs_1 = require("fs");
const constants_1 = require("@app/constants");
const rock_me_ts_1 = require("rock-me-ts");
class BrowserLib {
    constructor() {
        this.loaded = false;
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        const appConfig = typedi_1.Container.get(rock_me_ts_1.AppConfig);
        this.dev = appConfig.env === constants_1.ENV_DEV;
        this.options = appConfig.static;
        // warmup lib
        this.lib();
        this.log.info({
            fn: this.options.file,
            size: `${Math.round(this.content.length / 1024)}kb`,
            dev: this.dev
        }, 'loaded browser lib');
    }
    lib() {
        if (!this.loaded || this.dev) {
            this.content = fs_1.readFileSync(this.options.file);
            this.loaded = true;
        }
        return this.content;
    }
    rtConfig(params) {
        return `window.alco&&window.alco('configure',${JSON.stringify(params)});`;
    }
    prepare(params) {
        const cmd = new Buffer(this.rtConfig(params));
        return Buffer.concat([cmd, this.lib()]);
    }
}
exports.BrowserLib = BrowserLib;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnJvd3NlckxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvQnJvd3NlckxpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUE0QztBQUM1QywyQkFBa0M7QUFFbEMsOENBQXlDO0FBQ3pDLDJDQUEyRDtBQUczRDtJQVFFO1FBRkEsV0FBTSxHQUFZLEtBQUssQ0FBQztRQUd0QixJQUFJLENBQUMsR0FBRyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLG1CQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsTUFBTSxTQUFTLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQTRCLHNCQUFTLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEtBQUssbUJBQU8sQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDaEMsYUFBYTtRQUNiLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNYLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1osRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSTtZQUNyQixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJO1lBQ25ELEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztTQUNkLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsR0FBRztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxpQkFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDcEI7UUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztJQUVELFFBQVEsQ0FBQyxNQUFpQjtRQUN4QixPQUFPLHdDQUF3QyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDNUUsQ0FBQztJQUVELE9BQU8sQ0FBQyxNQUFpQjtRQUN2QixNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDOUMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBdENELGdDQXNDQyJ9