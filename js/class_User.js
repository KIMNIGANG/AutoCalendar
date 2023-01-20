export class User {
    /**
     * @param {Number} id :ユーザーID
     * @param {String} name :ユーザー名
     * @param {String} mail :メールアドレス
     * @param {Schedule} lifestyle :定例スケジュール
     * @param {Schedule} schedule :スケジュール
     * @param {Settings} settings :設定
     */
    constructor(id, name, mail, lifestyle, schedule, settings) {
        this.id = id;
        this.name = name;
        this.mail = mail;
        this.lifestyle = lifestyle;
        this.schedule = schedule;
        this.settings = settings;
    }
}
