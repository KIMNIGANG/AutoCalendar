export class Settings {
    /**
     * {Number} unit_time :ユーザの単位時間(例:15分, 30分, 45分, 60分)
     */
    constructor() {
        this.unit_time = 15 * 60 * 1000; // 15分に設定
    }

    setUnitTime(time) {
        this.unit_time = time * 60 * 1000;
    }
}
