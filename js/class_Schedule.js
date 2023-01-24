import { Task } from "../js/class_Task.js";

export class Schedule {
    constructor(auto_schedule, on_time, other) {
        // データベースに元々格納してあるデータを持ってくる.
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

        // 元々のtask_childrenを格納
        var regularSchedules = [];
        var MaxDeadline;  // 締切日の最大値
        if (this.auto_schedule.length > 0) {
            MaxDeadline = new Date(this.auto_schedule[this.auto_schedule.length - 1].deadline);  // 締め切りの一番遅いタスクは一番後ろにあるはず.
            MaxDeadline.setDate(MaxDeadline.getDate() + 2);
        }
        else {
            MaxDeadline = new Date();
            MaxDeadline.setDate(MaxDeadline.getDate() + 30);
        }
        console.log("締め切りが一番遅いタスク：" + MaxDeadline);
        // 定例スケジュールの格納
        for (var i = 0; i < this.on_time.length; i++) {
            regularSchedules.push(this.on_time[i].task_children);
            var children = [];
            for (const child of this.on_time[i].task_children) {
                switch(child.repeat_unit) {
                    case "day":
                        var tmp = new Date();
                        tmp.setDate(tmp.getDate() - 7);  // 1週間分余計に取る
                        var StartDate = new Date(child.specified_time[0]);
                        var EndDate = new Date(child.specified_time[1]);
                        // 繰り返し予定の開始時刻
                        var Start = new Date(
                            tmp.getFullYear(),
                            tmp.getMonth(),
                            tmp.getDate(),
                            StartDate.getHours(),
                            StartDate.getMinutes(),
                            StartDate.getSeconds(),
                            StartDate.getMilliseconds()
                        );
                        var End;  // 繰り返し予定の終了時刻
                        if (StartDate.getDate() != EndDate.getDate()) {
                            // 日にちをまたいでいたら, 日にちを調整
                            End = new Date(
                                tmp.getFullYear(),
                                tmp.getMonth(),
                                tmp.getDate() + 1,
                                EndDate.getHours(),
                                EndDate.getMinutes(),
                                EndDate.getSeconds(),
                                EndDate.getMilliseconds()
                            );
                        }
                        else {
                            End = new Date(
                                tmp.getFullYear(),
                                tmp.getMonth(),
                                tmp.getDate(),
                                EndDate.getHours(),
                                EndDate.getMinutes(),
                                EndDate.getSeconds(),
                                EndDate.getMilliseconds()
                            );  
                        }
                        // 30日後
                        var ThirtyDaysAfter = new Date(
                            tmp.getFullYear(),
                            tmp.getMonth(),
                            tmp.getDate() + 30,
                            StartDate.getHours(),
                            StartDate.getMinutes(),
                            StartDate.getSeconds(),
                            StartDate.getMilliseconds()
                        );
                        while (tmp.getTime() <= ThirtyDaysAfter.getTime() || tmp.getTime() < MaxDeadline.getTime()) {  
                            // 締め切り前の定例予定を全て入れる (ただし, 30日後までは最低限入れておく.) 
                            var new_task = new Task(
                                child.id,
                                child.name,
                                child.category,
                                child.overview,
                                child.favorite,
                                child.plan_or_task,
                                child.finished,
                                child.duplicate,
                                child.deadline,
                                child.required_time,
                                child.days,
                                child.auto_scheduled,
                                [Start.getTime(), End.getTime()],
                                -1,
                                child.repeat_unit,
                                child.importance,
                                child.place,
                                child.color,
                                child.valid
                            );
                            children.push(new_task);
                            Start.setDate(Start.getDate() + 1);
                            End.setDate(End.getDate() + 1);
                            tmp.setDate(tmp.getDate() + 1);
                        }
                        break;
                    case "week":
                        var tmp = new Date();
                        tmp.setDate(tmp.getDate() - 7);  // 1週間分余計に取る
                        var StartDate = new Date(child.specified_time[0]);
                        var EndDate = new Date(child.specified_time[1]);
                        // 繰り返す曜日を取得
                        while (tmp.getDay() != StartDate.getDay()) {
                            tmp.setDate(tmp.getDate() + 1);
                        } 
                        // 繰り返し予定の開始時刻
                        var Start = new Date(
                            tmp.getFullYear(),
                            tmp.getMonth(),
                            tmp.getDate(),
                            StartDate.getHours(),
                            StartDate.getMinutes(),
                            StartDate.getSeconds(),
                            StartDate.getMilliseconds()
                        );
                        var End;  // 繰り返し予定の終了時刻
                        if (StartDate.getDate() != EndDate.getDate()) {
                            // 日にちをまたいでいたら, 日にちを調整
                            End = new Date(
                                tmp.getFullYear(),
                                tmp.getMonth(),
                                tmp.getDate() + 1,
                                EndDate.getHours(),
                                EndDate.getMinutes(),
                                EndDate.getSeconds(),
                                EndDate.getMilliseconds()
                            );
                        }
                        else {
                            End = new Date(
                                tmp.getFullYear(),
                                tmp.getMonth(),
                                tmp.getDate(),
                                EndDate.getHours(),
                                EndDate.getMinutes(),
                                EndDate.getSeconds(),
                                EndDate.getMilliseconds()
                            );  
                        }
                        // 2ヶ月後 
                        var MonthAfter = new Date(
                            tmp.getFullYear(),
                            tmp.getMonth() + 3,
                            tmp.getDate(),
                            StartDate.getHours(),
                            StartDate.getMinutes(),
                            StartDate.getSeconds(),
                            StartDate.getMilliseconds()
                        );
                        while (tmp.getTime() <= MonthAfter.getTime() || tmp.getTime() < MaxDeadline.getTime()) {  
                            // 締め切り前の定例予定を全て入れる (ただし, 1ヶ月後までは最低限入れておく.) 
                            var new_task = new Task(
                                child.id,
                                child.name,
                                child.category,
                                child.overview,
                                child.favorite,
                                child.plan_or_task,
                                child.finished,
                                child.duplicate,
                                child.deadline,
                                child.required_time,
                                child.days,
                                child.auto_scheduled,
                                [Start.getTime(), End.getTime()],
                                -1,
                                child.repeat_unit,
                                child.importance,
                                child.place,
                                child.color,
                                child.valid
                            );
                            children.push(new_task);
                            Start.setDate(Start.getDate() + 7);
                            End.setDate(End.getDate() + 7);
                            tmp.setDate(tmp.getDate() + 7);
                        }
                        break;
                    case "month":
                        children.push(child);
                        break;
                    case "year":
                        children.push(child);
                        break;
                    default:
                        children.push(child);
                        break;
                }
            }
            this.on_time[i].task_children = children;  // 子タスクの更新
        }

        var times = [];
        // for (const event of this.on_time) {
        //     times.push(event.specified_time);
        // }
        for (var i = 0; i < this.on_time.length; i++) {
            for (const child of this.on_time[i].task_children) {
                times.push(child.specified_time);
            }
        }
        times.sort(function (a, b) {
            return a[0] < b[0] ? -1 : 1;
        });

        for (var event of this.auto_schedule) {
            if (event.finished == true) {
                continue;
            }
            if (event.days == 1) {
                // 日割りしない場合
                console.log(event.name);
                // 一つ目の子タスクを追加
                event.task_children[0].specified_time[0] =
                    new Date().getTime() + 10 * 60 * 1000; // 10分余裕を持たせておく
                event.task_children[0].specified_time[1] =
                    event.task_children[0].specified_time[0] +
                    event.task_children[0].required_time;
                var j = 0;
                for (var i = 0; i < event.task_children.length; i++) {
                    // 単位時間で分割している場合には, 個々のループを実行
                    for (; j < times.length; j++) {
                        // if (event.task_children[i].specified_time[1] <= times[j][0]) {
                        //     break;
                        // }
                        if (
                            (times[j][0] >= event.task_children[i].specified_time[0] &&
                                times[j][0] < event.task_children[i].specified_time[1]) || // スタートをまたいでいないか?
                            (times[j][1] > event.task_children[i].specified_time[0] &&
                                times[j][1] <= event.task_children[i].specified_time[1]) || // エンドまたいでいないか?
                            (times[j][0] <= event.task_children[i].specified_time[0] &&
                                times[j][1] >= event.task_children[i].specified_time[1])
                        ) {
                            // 元からある予定の間にすっぽり埋もれていないか?
                            event.task_children[i].specified_time[0] =
                                times[j][1] + 10 * 60 * 1000; // 10分の休憩を持たせておく.
                            event.task_children[i].specified_time[1] =
                                event.task_children[i].specified_time[0] +
                                event.task_children[i].required_time;
                        }
                    }
                    if (
                        event.task_children[i].specified_time[1] >
                        event.task_children[i].deadline
                    ) {
                        // 各タスクの終了時間が締め切りを過ぎていたら
                        console.log(
                            "この予定「" +
                            event.task_children[i].name +
                            "」の\n終了時間:" +
                            new Date(event.task_children[i].specified_time[1]).toString() +
                            "は\n締切時間:" +
                            new Date(event.task_children[i].deadline).toString() +
                            "を過ぎてしまいます."
                        );
                        console.log("警告：この予定の追加はやめといたほうがいいよ!");
                    }
                    // 締め切りの過ぎていないタスクを追加する
                    times.splice(j, 0, event.task_children[i].specified_time);
                    if (i + 1 < event.task_children.length) {
                        event.task_children[i + 1].specified_time[0] =
                            event.task_children[i].specified_time[1] + 60 * 60 * 1000; // 60分ごとに行う
                        event.task_children[i + 1].specified_time[1] =
                            event.task_children[i + 1].specified_time[0] +
                            event.task_children[i + 1].required_time;
                    }
                    // if (j > 0) {
                    //     j--;
                    // }
                    j = 0;
                }
            } else {
                // 日割りする場合
                // 一つ目の子タスクを追加
                event.task_children[0].specified_time[0] =
                    new Date().getTime() + 600000; // 10分余裕を持たせておく
                event.task_children[0].specified_time[1] =
                    event.task_children[0].specified_time[0] +
                    event.task_children[0].required_time;
                var j = 0;
                for (var i = 0; i < event.task_children.length; i++) {
                    // 各子タスクについて, [day == 1] の時と同様の動作を実行
                    for (; j < times.length; j++) {
                        // if (event.task_children[i].specified_time[1] <= times[j][0]) {
                        //     break;
                        // }
                        if (
                            (times[j][0] >= event.task_children[i].specified_time[0] &&
                                times[j][0] < event.task_children[i].specified_time[1]) || // スタートをまたいでいないか?
                            (times[j][1] > event.task_children[i].specified_time[0] &&
                                times[j][1] <= event.task_children[i].specified_time[1]) || // エンドまたいでいないか?
                            (times[j][0] <= event.task_children[i].specified_time[0] &&
                                times[j][1] >= event.task_children[i].specified_time[1])
                        ) {
                            // 元からある予定の間にすっぽり埋もれていないか?
                            event.task_children[i].specified_time[0] =
                                times[j][1] + 10 * 60 * 1000; // 10分の休憩を持たせておく.
                            event.task_children[i].specified_time[1] =
                                event.task_children[i].specified_time[0] +
                                event.task_children[i].required_time;
                        }
                    }
                    if (
                        event.task_children[i].specified_time[1] >
                        event.task_children[i].deadline
                    ) {
                        // 各タスクの終了時間が締め切りを過ぎていたら
                        console.log(
                            "この予定「" +
                            event.task_children[i].name +
                            "」の\n終了時間:" +
                            new Date(event.task_children[i].specified_time[1]).toString() +
                            "は\n締切時間:" +
                            new Date(event.task_children[i].deadline).toString() +
                            "を過ぎてしまいます."
                        );
                        console.log("警告：この予定の追加はやめといたほうがいいよ!");
                    }
                    // 締め切りの過ぎていないタスクを追加する
                    times.splice(j, 0, event.task_children[i].specified_time);
                    if (i + 1 < event.task_children.length) {
                        const tmp = new Date(event.task_children[i].specified_time[1]);
                        event.task_children[i + 1].specified_time[0] = new Date(
                            tmp.getFullYear(),
                            tmp.getMonth(),
                            tmp.getDate() + 1,
                            0
                        ).getTime(); // 寝る時間等を設定できたら8時になってるところを消してもよい (← 消した)
                        event.task_children[i + 1].specified_time[1] =
                            event.task_children[i + 1].specified_time[0] +
                            event.task_children[i + 1].required_time;
                    }
                    // if (j > 0) {
                    //     j--;
                    // }
                    j = 0;
                }
            }
        }

        // 格納した定例スケジュールを全てなかったことにする.
        for (var i = 0; i < regularSchedules.length; i++) {
            console.log(regularSchedules[i]);
            this.on_time[i].task_children = regularSchedules[i];
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
        } else if (!task.duplicate) {
            // 自動スケジューリングをしない処理
            // 入れる予定の時間に重複していなければ入れる
            try {
                for (var i = 0; i < this.on_time.length; i++) {
                    if (
                        (this.on_time[i].specified_time[0] >= task.specified_time[0] &&
                            this.on_time[i].specified_time[0] < task.specified_time[1]) || // スタートをまたいでいないか?
                        (this.on_time[i].specified_time[1] > task.specified_time[0] &&
                            this.on_time[i].specified_time[1] <= task.specified_time[1]) || // エンドまたいでいないか?
                        (this.on_time[i].specified_time[0] <= task.specified_time[0] &&
                            this.on_time[i].specified_time[1] >= task.specified_time[1])
                    ) {
                        // 元からある予定の間にすっぽり埋もれていないか?
                        //throw new Error("この予定は追加できません。");
                        //石井追加
                        console.log("「"+task.name+"」は追加出来ませんでした。");
                        return;
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
        } else {
            // 予定を重複を許すTask入れる処理
            this.other.push(task);
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

        var matchNum = 0; // マッチした数

        // autoScheduleを確認
        for (var i = 0; i < this.auto_schedule.length; i++) {
            if (this.auto_schedule[i].id == before.id) {
                this.auto_schedule.splice(i, 1);
                matchNum = 1;
                break; // 1個だけ変更
            }
        }

        if (matchNum <= 0) {
            // auto_scheduleの方に無ければ探す
            for (var i = 0; i < this.on_time.length; i++) {
                if (this.on_time[i].id == before.id) {
                    this.on_time.splice(i, 1);
                    matchNum = 1;
                    break; // 1個だけ変更
                }
            }
        }

        if (matchNum <= 0) {
            // auto_schedule, on_timeの方に無ければ探す
            for (var i = 0; i < this.other.length; i++) {
                if (this.other[i].id == before.id) {
                    this.other.splice(i, 1);
                    matchNum = 1;
                    break; // 1個だけ変更
                }
            }
        }

        this.addTask(after); // 新たにタスクを追加する (タスクの種類を考慮する必要がないようにする.)
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
            if (tasks[i].id == id) {
                // 関連するタスク (同じidのタスク) は全て消す.
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
            console.log(
                events.name +
                ":" +
                new Date(events.specified_time[0]).toString() +
                " -> " +
                new Date(events.specified_time[1]).toString()
            );
        }
        for (const events of this.on_time) {
            console.log(
                events.name +
                ":" +
                new Date(events.specified_time[0]).toString() +
                " -> " +
                new Date(events.specified_time[1]).toString()
            );
        }
    }

    // 全ての予定,タスクの表示をするモジュール
    viewAllTasks() {
        console.log(this.on_time);
        console.log("確認用メッセージ:全ての予定,タスクを表示");
        for (const events of this.returnAllTasks()) {
            console.log(
                events.name +
                ":" +
                new Date(events.specified_time[0]).toString() +
                " -> " +
                new Date(events.specified_time[1]).toString()
            );
            //console.log(events);
        }
    }

    // all_tasksに全てのtaskを追加するモジュール (ここで, 分割した場合は統合する？) 
    // (子タスクの情報は親タスクから復元可能！ → 親タスクさえデータベースに格納しておいて, autoSchedulingで子タスクを展開すれば問題ない.)
    returnAllTasks() {
        var all_tasks = [];
        for (var task of this.on_time) {
            // let task_copy = Object.assign({}, task);
            // task_copy.required_time /= (1000 * 60 * 60);
            // task_copy.unit_time /= (1000 * 60 * 60);
            // if (task_copy.plan_or_task == 0) {
            //     task_copy.plan_or_task = "Plan";
            // }
            // else {
            //     task_copy.plan_or_task = "Task";
            // }
            // if (task_copy.task_children.length > 0) {
            //     task_copy.specified_time = [];
            //     for (var child of task_copy.task_children) {
            //         task_copy.specified_time.push(child.specified_time);
            //     }
            // }
            // else {
            //     task_copy.specified_time = [task_copy.specified_time];
            // }
            // all_tasks.push(task_copy);
            all_tasks.push(task);
        }
        for (var task of this.auto_schedule) {
            // let task_copy = Object.assign({}, task);
            // task_copy.required_time /= (1000 * 60 * 60);
            // task_copy.unit_time /= (1000 * 60 * 60);
            // if (task_copy.plan_or_task == 0) {
            //     task_copy.plan_or_task = "Plan";
            // }
            // else {
            //     task_copy.plan_or_task = "Task";
            // }
            // if (task_copy.task_children.length > 0) {
            //     task_copy.specified_time = [];
            //     for (var child of task_copy.task_children) {
            //         task_copy.specified_time.push(child.specified_time);
            //     }
            // }
            // else {
            //     task_copy.specified_time = [task_copy.specified_time];
            // }
            // all_tasks.push(task_copy);
            all_tasks.push(task);
        }
        for (var task of this.other) {
            // let task_copy = Object.assign({}, task);
            // task_copy.required_time /= (1000 * 60 * 60);
            // task_copy.unit_time /= (1000 * 60 * 60);
            // if (task_copy.plan_or_task == 0) {
            //     task_copy.plan_or_task = "Plan";
            // }
            // else {
            //     task_copy.plan_or_task = "Task";
            // }
            // if (task_copy.task_children.length > 0) {
            //     task_copy.specified_time = [];
            //     for (var child of task_copy.task_children) {
            //         task_copy.specified_time.push(child.specified_time);
            //     }
            // }
            // else {
            //     task_copy.specified_time = [task_copy.specified_time];
            // }
            // all_tasks.push(task_copy);
            all_tasks.push(task);
        }

        return all_tasks;
    }
}

// var myLifestyle = new Schedule([], [], []);
// var mySchedule = new Schedule([], [], []);
// var mySettings = new Settings();

// var task0Info = {
//     id: 1,
//     name: "デザイン開発",
//     category: "課題",
//     overview: "Webページのデザインを開発せねば〜",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2023, 11, 24, 18, 20)).getTime(),
//     required_time: 5,
//     days: 1,
//     auto_scheduled: true,
//     specified_time: null,
//     unit_time: 10,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var task1Info = {
//     id: 2,
//     name: "情報線形代数レポート課題",
//     category: "課題",
//     overview: "早く早く終わりたい！！",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2023, 11, 24, 19, 0)).getTime(),
//     required_time: null,
//     days: 1,
//     auto_scheduled: false,
//     specified_time: [[(new Date(2022, 11, 17, 0, 0)).getTime(), (new Date(2022, 11, 17, 3, 0)).getTime()]],
//     unit_time: 0.5,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var task2Info = {
//     id: 3,
//     name: "デザイン課題",
//     category: "課題",
//     overview: "デザインの授業の課題！！！！！！！",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2023, 11, 25, 18, 0)).getTime(),
//     required_time: null,
//     days: 1,
//     auto_scheduled: false,
//     specified_time: [[(new Date(2022, 11, 24, 8, 40)).getTime(), (new Date(2022, 11, 24, 9, 55)).getTime()], [(new Date(2022, 11, 24, 15, 00)).getTime(), (new Date(2022, 11, 24, 16, 30)).getTime()]],
//     unit_time: 1,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var task3Info = {
//     id: 4,
//     name: "情報英語発展",
//     category: "課題",
//     overview: "英語で書かれた情報の専門誌を和訳する",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2022, 11, 16, 18, 30)).getTime(),
//     required_time: 3,
//     days: 1,
//     auto_scheduled: true,
//     specified_time: null,
//     unit_time: 0.5,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var task4Info = {
//     id: 5,
//     name: "情報英語発展",
//     category: "課題",
//     overview: "英語で書かれた情報の専門誌を和訳する",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2023, 11, 16, 18, 30)).getTime(),
//     required_time: 3,
//     days: 1,
//     auto_scheduled: true,
//     specified_time: null,
//     unit_time: 0.5,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var task5Info = {
//     id: 6,
//     name: "ドイツ語基礎",
//     category: "課題",
//     overview: "ドイツ語で会話をしてみよう",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2023, 11, 14, 18, 30)).getTime(),
//     required_time: 3,
//     days: 3,
//     auto_scheduled: true,
//     specified_time: null,
//     unit_time: 1 / 3,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var task6Info = {
//     id: 6,
//     name: "ドイツ語発展",
//     category: "課題",
//     overview: "ドイツ語で文章を書いてみましょう",
//     favorite: false,
//     plan_or_task: false,
//     finished: false,
//     duplicate: false,
//     deadline: (new Date(2023, 11, 14, 18, 30)).getTime(),
//     required_time: 5,
//     days: 3,
//     auto_scheduled: true,
//     specified_time: null,
//     unit_time: 1 / 3,
//     repeat_unit: "?",
//     importance: 1,
//     place: "?",
//     color: "black",
//     valid: true
// }

// var tasksInfo = [task0Info, task1Info, task2Info, task3Info, task4Info, task5Info, task6Info];
// var tasks = [];

// var user1 = new User(2123, "山田太郎", "yamada.taro@gmail.com", myLifestyle, mySchedule, mySettings);
// // constructor(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, required_time, days, auto_scheduled, specified_time, unit_time, repeat_unit, importance, place, color, valid)
// for (var i = 0; i < tasksInfo.length; i++) {
//     var task = new Task(tasksInfo[i].id, tasksInfo[i].name, tasksInfo[i].category, tasksInfo[i].overview, tasksInfo[i].favorite, tasksInfo[i].plan_or_task, tasksInfo[i].finished, tasksInfo[i].duplicate, tasksInfo[i].deadline, tasksInfo[i].required_time, tasksInfo[i].days, tasksInfo[i].auto_scheduled, tasksInfo[i].specified_time, tasksInfo[i].unit_time, tasksInfo[i].repeat_unit, tasksInfo[i].importance, tasksInfo[i].place, tasksInfo[i].color, tasksInfo[i].valid);
//     tasks.push(task);
// }

// user1.schedule.addTask(tasks[0]);  // required_time < unit_time のケース
// user1.schedule.addTask(tasks[1]);  // 指定時間が1箇所のケース
// user1.schedule.addTask(tasks[2]);  // 指定時間が2箇所（例：1時限と5時限の授業を受ける）のケース

// // user1.schedule.addTask(tasks[3]); // (締め切り過ぎる場合, 上手くいかない...(分割しても, 開始時間が全て同じになってしまう.))
// user1.schedule.addTask(tasks[4]);  // 単位時間ごとに区切る
// user1.schedule.addTask(tasks[5]);  // 日割り

// // user1.schedule.editTask(tasks[1], tasks[3]);  // 変更 (締め切り時間が過ぎるタスクを入れた場合)
// user1.schedule.editTask(tasks[5], tasks[6]);  // 変更 (締め切り時間が過ぎないタスクを入れた場合)

// // カテゴリに毎年/毎月/毎週/平日/週末/毎日を設定する？
// // var plan1 = new Task(199, "睡眠時間", "生活", "いい夢みたい!!!!", true, true, false, false, null, 8, 1, false, [[(new Date(2023, 11, 24, 0, 0)).getTime(), (new Date(2023, 11, 24, 8, 0)).getTime()]], 20, 1, 1, "?", "dark", true);

// //user1.lifestyle.addTask(plan1);

// user1.schedule.viewAllTasks();
