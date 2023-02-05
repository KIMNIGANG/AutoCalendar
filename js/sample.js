class Task {
    /** (引数の数：19個)
     * @param {Number} id :Taskのid
     * @param {String} name :Task名
     * @param {String} category :カテゴリー
     * @param {String} overview :メモ
     * @param {Boolean} favorite :お気に入り
     * @param {String} plan_or_task :予定かタスクか(内部では0,1で表す)
     * @param {Boolean} finished :終了済みか
     * @param {Boolean} duplicate :重複を許すか
     * @param {Date} deadline :Taskの締め切り時間
     * @param {Number} required_time :Taskの推定所要時間(時間)
     * @param {Number} days :何日に分けるか
     * @param {Boolean} auto_scheduled :自動スケジューリングするか
     * @param {List} specified_time :開始時間, 終了時間(入力は二次元配列で受け取り,内部では一次元配列で表す)
     * @param {Number} unit_time :単位時間 (時間) (childでは-1であるとする)
     * @param {String} repeat_unit :繰り返し単位（毎年/毎月/毎週/毎日/null (定例スケジュール用)）
     * @param {Number} importance :重要度
     * @param {String} place :場所
     * @param {String} color :色
     * @param {Boolean} valid :有効か無効かを表すフラグ
     */
    constructor(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, required_time,
        days, auto_scheduled, specified_time, unit_time, repeat_unit, importance, place, color, valid) {
        this.id = id;
        this.name = name;
        if (name == null) {
            this.name = "(タイトルなし)";
        }
        this.category = category;
        this.overview = overview;
        this.favorite = favorite;

        // plan_or_taskは予定なら0,タスクなら1で表す
        if (plan_or_task == "Plan") {
            this.plan_or_task = 0;
        } else {
            this.plan_or_task = 1;
        }
        this.finished = finished;
        this.duplicate = duplicate;
        this.deadline = deadline;
        this.required_time = required_time * 1000 * 60 * 60;
        this.days = days;
        this.auto_scheduled = auto_scheduled;
        this.specified_time = specified_time;  // そのままの配列でもらう
        this.unit_time = unit_time * 1000 * 60 * 60;  // 時単位
        this.repeat_unit = repeat_unit;
        this.importance = importance;
        this.place = place;
        this.color = color;
        this.valid = valid;

        // 子タスクの配列
        this.task_children = [];
        this.start = new Date();  // 各分割タスクを行う日時の午前0時

        // 指定時間がnullでないときの処理
        if (this.specified_time != null) {
            // 時間が指定されていて推定所要時間が合計の指定時間より超えてしまうとき
            var restTime = this.required_time;
            console.log(this.specified_time.length);
            for (var i = 0; i < this.specified_time.length; i++) {
                restTime = restTime - (this.specified_time[i][1] - this.specified_time[i][0]);
            }
            if (restTime > 0) {
                throw new Error("この予定は指定時間が所要時間を満たさないため追加できません。");
            }

            this.auto_scheduled = false;  // 変な入力があった時用
            this.days = 1;

            // specified_timeが複数あるとき
            if (this.specified_time.length > 1) {
                if (this.unit_time < 0) {  // 子の増加防止
                    console.log("Invalid!");
                    return;
                }
                for (var i = 0; i < this.specified_time.length; i++) {
                    var tmp = [this.specified_time[i][0], this.specified_time[i][1]];
                    var child = new Task(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, required_time, 1, false, tmp, -1, repeat_unit, importance, place, color, valid);
                    child.name = child.name + "(" + (i + 1) + "/" + this.specified_time.length + ")";  // 線形代数(1/5)みたいな名前にする
                    this.task_children.push(child);
                }
            } else {
                // specified_timeが1つであるとき
                // 指定時間が中途半端な時間であれば単位時間の倍数に変える(必要性は要相談)
                // var remain_time = this.required_time;
                // var count = 0;
                // while (remain_time > 0) {
                //     remain_time -= this.unit_time;
                //     count++;
                // }
                // this.specified_time = [this.specified_time[0][0], this.specified_time[0][0] + count * this.unit_time];  // 時間オーバーは許す
                this.specified_time = [this.specified_time[0][0], this.specified_time[0][1]];  // 時間オーバーは許す (1次元に直す)
            }
        } else { // 指定時間がnullのときの処理
            this.specified_time = [(new Date()).getTime() + 600000, (new Date()).getTime() + this.required_time + 600000];
            // invalidなら強制終了 (子供はinvalidにする.) 
            if (this.unit_time < 0) {
                console.log("Invalid!");
                return;
            }
            var remain_time = this.required_time;  // 分割しきれていない時間
            // (実行例)
            // required_time = 10
            // unit_time = 0.5
            // days = 5
            // 日割りするときの処理
            if (this.days > 1) {
                // daysが指定されたときは最大daysの分のchildを作成
                for (var i = 0; i < this.days; i++) {
                    var child = new Task(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, Math.min(unit_time, remain_time / (60 * 60 * 1000)), 1, auto_scheduled, null, -1, repeat_unit, importance, place, color, valid);
                    child.name = child.name + "(" + (i + 1) + "日目)";  // 線形代数(1日目)みたいな名前にする
                    this.task_children.push(child);
                    remain_time -= this.unit_time;
                    if (remain_time <= 0)
                        break;
                }
                // (上の実行例に対応)
                // 各子どものrequired_time = 0.5, remain_time = 7.5
                var day = 0;
                while (remain_time > 0) {  // 開始時刻の早いタスクから順に残りの所要時間を均等に上乗せ
                    this.task_children[day].required_time += this.unit_time;
                    remain_time -= this.unit_time;
                    day++;
                    if (day == this.days) {  // 繰り返すため
                        day = 0;
                    }
                }
            }
            // 日割りしないときは単位時間ごとにタスクを分ける
            else {  // タスクを単位時間ごとに区切る
                var count = 0;
                while (remain_time > 0) {  // 分割出来るだけ分割
                    var child = new Task(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, Math.min(unit_time, remain_time / (60 * 60 * 1000)), 1, auto_scheduled, null, -1, repeat_unit, importance, place, color, false);
                    child.name = child.name + "(" + (count + 1) + "個目)";  // 個数を指定
                    this.task_children.push(child);
                    remain_time -= this.unit_time;
                    count++;
                }
            }
        }
    }

    // 2次元配列 → 1次元配列 (データベースから取り出す時の補助関数) 
    TwoArrayToOneArray() {
        this.specified_time = [this.specified_time[0][0], this.specified_time[0][1]];
    }

    // 1次元配列 → 2次元配列 (データベースに格納する時の補助関数) 
    OneArrayToTwoArray() {
        this.specified_time = [this.specified_time];
    }
}

class User {
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

class Settings {
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


class Schedule {
    constructor(auto_schedule, on_time, other) {  // データベースに元々格納してあるデータを持ってくる.
        this.auto_schedule = auto_schedule; //自動スケジューリングするTask
        this.on_time = on_time; //時間が決まっているTask,予定
        this.other = other; // 重複を許すTask
        // this.all_tasks = this.returnAllTasks();
    }

    AutoScheduling() {
        if (this.auto_schedule.length == 0) {
            return;
        }

        // 動くかわからんので、とりあえず確認用
        // 締め切り順でソート
        this.auto_schedule.sort(function (a, b) {
            if (a.deadline === null) {
                return 1;
            }

            if (b.deadline === null) {
                return -1;
            }

            if (a.deadline === b.deadline) {
                return 0;
            }

            return a.deadline < b.deadline ? -1 : 1;
        });
        var times = [];
        for (const event of this.on_time) {
            times.push(event.specified_time);
        }
        times.sort(function (a, b) {
            return a[0] < b[0] ? -1 : 1;
        });
        for (var event of this.auto_schedule) {
            if (event.finished == true) {
                continue;
            }
            if (event.days == 1) {  // 日割りしない場合
                console.log(event.name);
                // 一つ目の子タスクを追加
                event.task_children[0].specified_time[0] = (new Date()).getTime() + 10 * 60 * 1000;  // 10分余裕を持たせておく
                event.task_children[0].specified_time[1] = event.task_children[0].specified_time[0] + event.task_children[0].required_time;
                var j = 0;
                for (var i = 0; i < event.task_children.length; i++) {  // 単位時間で分割している場合には, 個々のループを実行
                    for (; j < times.length; j++) {
                        if (event.task_children[i].specified_time[1] <= times[j][0]) {
                            break;
                        }
                        if ((times[j][0] >= event.task_children[i].specified_time[0] && times[j][0] < event.task_children[i].specified_time[1]) ||  // スタートをまたいでいないか?
                            (times[j][1] > event.task_children[i].specified_time[0] && times[j][1] <= event.task_children[i].specified_time[1]) ||  // エンドまたいでいないか?
                            (times[j][0] <= event.task_children[i].specified_time[0] && times[j][1] >= event.task_children[i].specified_time[1])) { // 元からある予定の間にすっぽり埋もれていないか?
                            event.task_children[i].specified_time[0] = times[j][1] + 10 * 60 * 1000;  // 10分の休憩を持たせておく.
                            event.task_children[i].specified_time[1] = event.task_children[i].specified_time[0] + event.task_children[i].required_time;
                        }
                    }
                    if (event.task_children[i].specified_time[1] > event.task_children[i].deadline) {  // 各タスクの終了時間が締め切りを過ぎていたら
                        console.log("この予定「" + event.task_children[i].name + "」の\n終了時間:" + (new Date(event.task_children[i].specified_time[1])).toString() + "は\n締切時間:" + (new Date(event.task_children[i].deadline)).toString() + "を過ぎてしまいます.");
                        console.log("警告：この予定の追加はやめといたほうがいいよ!");
                    }
                    else {  // 締め切りの過ぎていないタスクを追加する
                        times.splice(i, 0, event.task_children[i].specified_time);
                        if ((i + 1) < event.task_children.length) {
                            event.task_children[(i + 1)].specified_time[0] = event.task_children[i].specified_time[1] + 60 * 60 * 1000;  // 60分ごとに行う
                            event.task_children[(i + 1)].specified_time[1] = event.task_children[(i + 1)].specified_time[0] + event.task_children[(i + 1)].required_time;
                        }
                    }
                    if (j > 0) {
                        j--;
                    }
                }
            }
            else {  // 日割りする場合
                // 一つ目の子タスクを追加
                event.task_children[0].specified_time[0] = (new Date()).getTime() + 600000;  // 10分余裕を持たせておく
                event.task_children[0].specified_time[1] = event.task_children[0].specified_time[0] + event.task_children[0].required_time;
                var j = 0;
                for (var i = 0; i < event.task_children.length; i++) {  // 各子タスクについて, [day == 1] の時と同様の動作を実行
                    for (; j < times.length; j++) {
                        if (event.task_children[i].specified_time[1] <= times[j][0]) {
                            break;
                        }
                        if ((times[j][0] >= event.task_children[i].specified_time[0] && times[j][0] < event.task_children[i].specified_time[1]) ||  // スタートをまたいでいないか?
                            (times[j][1] > event.task_children[i].specified_time[0] && times[j][1] <= event.task_children[i].specified_time[1]) ||  // エンドまたいでいないか?
                            (times[j][0] <= event.task_children[i].specified_time[0] && times[j][1] >= event.task_children[i].specified_time[1])) { // 元からある予定の間にすっぽり埋もれていないか?
                            event.task_children[i].specified_time[0] = times[j][1] + 10 * 60 * 1000;  // 10分の休憩を持たせておく.
                            event.task_children[i].specified_time[1] = event.task_children[i].specified_time[0] + event.task_children[i].required_time;
                        }
                    }
                    if (event.task_children[i].specified_time[1] > event.task_children[i].deadline) {  // 各タスクの終了時間が締め切りを過ぎていたら
                        console.log("この予定「" + event.task_children[i].name + "」の\n終了時間:" + (new Date(event.task_children[i].specified_time[1])).toString() + "は\n締切時間:" + (new Date(event.task_children[i].deadline)).toString() + "を過ぎてしまいます.");
                        console.log("警告：この予定の追加はやめといたほうがいいよ!");
                    }
                    else {  // 締め切りの過ぎていないタスクを追加する
                        times.splice(i, 0, event.task_children[i].specified_time);
                        if ((i + 1) < event.task_children.length) {
                            const tmp = new Date(event.task_children[i].specified_time[1]);
                            event.task_children[(i + 1)].specified_time[0] = (new Date(tmp.getFullYear(), tmp.getMonth(), (tmp.getDate() + 1), 8).getTime()); // 寝る時間等を設定できたら8時になってるところを消してもよい
                            event.task_children[(i + 1)].specified_time[1] = event.task_children[(i + 1)].specified_time[0] + event.task_children[(i + 1)].required_time;
                        }
                    }
                    if (j > 0) {
                        j--;
                    }
                }
            }
        }
    }

    // タスクをスケジュールに追加するモジュール
    /**
     * @param {Task} task 
     */
    addTask(task) {
        console.log("確認用メッセージ:「" + task.name + "」を追加します.");

        // タスクの終了時刻が締め切り時刻を過ぎている場合には, エラー
        if (task.plan_or_task && task.specified_time[1] > task.deadline) {
            console.log("締め切り過ぎてるよ！！！");
        }

        // タスクを時系列なTaskに入れる処理
        if (task.auto_scheduled) {
            // 自動スケジューリングをする処理 (task_childrenはコンストラクタで更新している → 子タスクがあればtask_childrenに要素が2個以上入っている.)
            this.auto_schedule.push(task);
            this.AutoScheduling();
        } else if (!(task.duplicate)) {
            // 自動スケジューリングをしない処理
            // 入れる予定の時間に重複していなければ入れる
            try {
                for (var i = 0; i < this.on_time.length; i++) {
                    if ((this.on_time[i].specified_time[0] >= task.specified_time[0] && this.on_time[i].specified_time[0] < task.specified_time[1]) ||  // スタートをまたいでいないか?
                        (this.on_time[i].specified_time[1] > task.specified_time[0] && this.on_time[i].specified_time[1] <= task.specified_time[1]) ||  // エンドまたいでいないか?
                        (this.on_time[i].specified_time[0] <= task.specified_time[0] && this.on_time[i].specified_time[1] >= task.specified_time[1])) {  // 元からある予定の間にすっぽり埋もれていないか?
                        throw new Error("この予定は追加できません。");
                    }
                }
                // 重複していないので入れる
                this.on_time.push(task);
                // 指定時間順でソート(指定時間が複数あるとうまく動かない)
                this.on_time.sort(function (a, b) {
                    return a.specified_time[0] - b.specified_time[0];
                });
                this.AutoScheduling();
            } catch (e) {
                console.log(e.message);
            }
        }
        else {
            // 予定を重複を許すTask入れる処理
            this.other_tasks.push(task);
        }

        // this.all_tasks = this.returnAllTasks();
    }

    // タスクの予定の変更を行う
    /**
     * @param {Task} before :変更する前のtask
     * @param {Task} after :変更した後のtask
     */
    editTask(before, after) {
        // (一つのタスクを変えた時に, 全てのタスクを動かす)

        var matchNum = 0;  // マッチした数

        // autoScheduleを確認
        for (var i = 0; i < this.auto_schedule.length; i++) {
            if (this.auto_schedule[i].id == before.id) {
                this.auto_schedule.splice(i, 1);
                matchNum = 1;
                break;  // 1個だけ変更
            }
        }

        if (matchNum <= 0) {
            // auto_scheduleの方に無ければ探す
            for (var i = 0; i < this.on_time.length; i++) {
                if (this.on_time[i].id == before.id) {
                    this.on_time.splice(i, 1);
                    matchNum = 1;
                    break;  // 1個だけ変更
                }
            }
        }

        if (matchNum <= 0) {
            // auto_schedule, on_timeの方に無ければ探す
            for (var i = 0; i < this.other.length; i++) {
                if (this.other[i].id == before.id) {
                    this.other.splice(i, 1);
                    matchNum = 1;
                    break;  // 1個だけ変更
                }
            }
        }

        this.addTask(after);  // 新たにタスクを追加する (タスクの種類を考慮する必要がないようにする.)
        // this.all_tasks = this.returnAllTasks();  // 更新
        console.log(before.name + "の内容を" + after.name + "に変更しました");

        if (matchNum <= 0) {
            this.viewAllTasks();
            console.log("エラー:変更する予定,タスクは存在しません");
        }
    }

    // タスクをスケジュールから削除するモジュール
    /**
     * @param {Task} task
     */
    removeTask(task) {
        var id = task.id;
        var tasks = [];
        if (task.auto_scheduled) {
            tasks = this.auto_schedule;
        } else if (task.duplicate) {
            tasks = this.other;
        } else {
            tasks = this.on_time;
        }
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id == id) {  // 関連するタスク (同じidのタスク) は全て消す.
                tasks.splice(i, 1);
                console.log("確認用メッセージ:「" + task.name + "」を削除しました.");
            }
        }
        this.AutoScheduling();
        // this.all_tasks = this.returnAllTasks();
    }

    // 時系列タスクの表示をするモジュール
    viewTasks() {
        console.log("確認用メッセージ:全ての時系列の予定,タスクを表示");
        for (const events of this.auto_schedule) {
            console.log(events.name + ":" + (new Date(events.specified_time[0])).toString() + " -> " + (new Date(events.specified_time[1])).toString());
        }
        for (const events of this.on_time) {
            console.log(events.name + ":" + (new Date(events.specified_time[0])).toString() + " -> " + (new Date(events.specified_time[1])).toString());
        }
    }

    // 全ての予定,タスクの表示をするモジュール
    viewAllTasks() {
        console.log(this.on_time);
        console.log("確認用メッセージ:全ての予定,タスクを表示");
        for (const events of this.returnAllTasks()) {
            console.log(events.name + ":" + (new Date(events.specified_time[0])).toString() + " -> " + (new Date(events.specified_time[1])).toString());
            //console.log(events);
        }
    }

    // all_tasksに全てのtaskを追加するモジュール (ここで, 分割した場合は統合する？) 
    // (子タスクの情報は親タスクから復元可能！ → 親タスクさえデータベースに格納しておいて, autoSchedulingで子タスクを展開すれば問題ない.)
    returnAllTasks() {
        var all_tasks = [];
        for (var task of this.on_time) {
            all_tasks.push(task);
        }
        for (var task of this.auto_schedule) {
            for (var child of task.task_children) {
                all_tasks.push(child);
            }
        }
        for (var task of this.other) {
            all_tasks.push(task);
        }

        return all_tasks;
    }
}

var myLifestyle = new Schedule([], [], []);
var mySchedule = new Schedule([], [], []);
var mySettings = new Settings();

var task0Info = {
    id: 1,
    name: "デザイン開発",
    category: "課題",
    overview: "Webページのデザインを開発せねば〜",
    favorite: false,
    plan_or_task: false,
    finished: false,
    duplicate: false,
    deadline: (new Date(2023, 1, 24, 18, 20)).getTime(),
    required_time: 5,
    days: 3,
    auto_scheduled: true,
    specified_time: null,
    unit_time: 1,
    repeat_unit: "?",
    importance: 1,
    place: "?",
    color: "black",
    valid: true
}

var task1Info = {
    id: 2,
    name: "情報線形代数レポート課題",
    category: "課題",
    overview: "早く早く終わりたい！！",
    favorite: false,
    plan_or_task: false,
    finished: false,
    duplicate: false,
    deadline: (new Date(2023, 1, 24, 19, 0)).getTime(),
    required_time: 3,
    days: 1,
    auto_scheduled: true,
    specified_time: null,
    unit_time: 0.5,
    repeat_unit: "?",
    importance: 1,
    place: "?",
    color: "black",
    valid: true
}

var task2Info = {
    id: 3,
    name: "enpit",
    category: "授業",
    overview: "enpitの授業！！！！！！！",
    favorite: false,
    plan_or_task: false,
    finished: false,
    duplicate: false,
    deadline: (new Date(2023, 11, 25, 18, 0)).getTime(),
    required_time: null,
    days: 1,
    auto_scheduled: false,
    specified_time: [[(new Date(2023, 1, 8, 12, 15)).getTime(), (new Date(2023, 1, 8, 15, 0)).getTime()]],
    unit_time: 1,
    repeat_unit: "?",
    importance: 1,
    place: "?",
    color: "black",
    valid: true
}

var task3Info = {
    id: 4,
    name: "情報英語発展",
    category: "課題",
    overview: "英語で書かれた情報の専門誌を和訳する",
    favorite: false,
    plan_or_task: false,
    finished: false,
    duplicate: false,
    deadline: (new Date(2023, 1, 5, 0, 0)).getTime(),
    required_time: 3,
    days: 1,
    auto_scheduled: true,
    specified_time: null,
    unit_time: 3,
    repeat_unit: "?",
    importance: 1,
    place: "?",
    color: "black",
    valid: true
}

var tasksInfo = [task0Info, task1Info, task2Info, task3Info];
var tasks = [];

var user1 = new User(2123, "山田太郎", "yamada.taro@gmail.com", myLifestyle, mySchedule, mySettings);
// constructor(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, required_time, days, auto_scheduled, specified_time, unit_time, repeat_unit, importance, place, color, valid)
for (var i = 0; i < tasksInfo.length; i++) {
    var task = new Task(tasksInfo[i].id, tasksInfo[i].name, tasksInfo[i].category, tasksInfo[i].overview, tasksInfo[i].favorite, tasksInfo[i].plan_or_task, tasksInfo[i].finished, tasksInfo[i].duplicate, tasksInfo[i].deadline, tasksInfo[i].required_time, tasksInfo[i].days, tasksInfo[i].auto_scheduled, tasksInfo[i].specified_time, tasksInfo[i].unit_time, tasksInfo[i].repeat_unit, tasksInfo[i].importance, tasksInfo[i].place, tasksInfo[i].color, tasksInfo[i].valid);
    tasks.push(task);
}

user1.schedule.addTask(tasks[0]);  // required_time < unit_time のケース
user1.schedule.addTask(tasks[1]);  // 指定時間が1箇所のケース
user1.schedule.addTask(tasks[2]);  // 指定時間が2箇所（例：1時限と5時限の授業を受ける）のケース
user1.schedule.addTask(tasks[3]); // (締め切り過ぎる場合, 上手くいかない...(分割しても, 開始時間が全て同じになってしまう.)) 
// user1.schedule.addTask(tasks[4]);  // 単位時間ごとに区切る
// user1.schedule.addTask(tasks[5]);  // 日割り

// // user1.schedule.editTask(tasks[1], tasks[3]);  // 変更 (締め切り時間が過ぎるタスクを入れた場合)
// user1.schedule.editTask(tasks[5], tasks[6]);  // 変更 (締め切り時間が過ぎないタスクを入れた場合)

// カテゴリに毎年/毎月/毎週/平日/週末/毎日を設定する？
// var plan1 = new Task(199, "睡眠時間", "生活", "いい夢みたい!!!!", true, true, false, false, null, 8, 1, false, [[(new Date(2023, 11, 24, 0, 0)).getTime(), (new Date(2023, 11, 24, 8, 0)).getTime()]], 20, 1, 1, "?", "dark", true);

//user1.lifestyle.addTask(plan1);

user1.schedule.viewAllTasks();

