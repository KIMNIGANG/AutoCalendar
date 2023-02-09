// import {Task} from '../js/class_Task.js';

class Schedule{
    constructor(auto_schedule, on_time, other){  // データベースに元々格納してあるデータを持ってくる.
        this.auto_schedule = auto_schedule; //自動スケジューリングするTask
        this.on_time = on_time; //時間が決まっているTask,予定
        this.other = other; // 重複を許すTask
        this.all_tasks = this.returnAllTasks();
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
            if (event.days == 1) {  // 子タスクがない場合
                event.specified_time[0] = (new Date()).getTime() + 600000;  // 10分余裕を持たせておく
                event.specified_time[1] = event.specified_time[0] + event.required_time;
                var i = 0;
                for (; i < times.length; i++) {
                    if (event.specified_time[1] <= times[i][0]) {  // 各タスクの終了時間が固定時間の開始時間より速いなら
                        break;
                    }
                    if ((times[i][0] >= event.specified_time[0] && times[i][0] < event.specified_time[1]) ||  // スタートをまたいでいないか?
                        (times[i][1] > event.specified_time[0] && times[i][1] <= event.specified_time[1]) ||  // エンドまたいでいないか?
                        (times[i][0] <= event.specified_time[0] && times[i][1] >= event.specified_time[1])) { // 元からある予定の間にすっぽり埋もれていないか?
                        event.specified_time[0] = times[i][1] + 10 * 60 * 1000;  // 10分の休憩を持たせておく.
                        event.specified_time[1] = event.specified_time[0] + event.required_time;
                    }
                }
                if (event.specified_time[1] > event.deadline) {  // 各タスクの終了時間が締め切りを過ぎていたら
                    console.log("この予定「" + event.name + "」の\n終了時間:" + (new Date(event.specified_time[1])).toString() + "は\n締切時間:" + (new Date(event.deadline)).toString() + "を過ぎてしまいます.");
                    console.log("警告:この予定の追加はやめといたほうがいいよ!");
                    // this.removeTask(event);
                }
                else {  // 締め切りの過ぎていないタスクを追加する
                    times.splice(i, 0, event.specified_time);
                }
            }
            else {  // 子タスクがある場合
                // 一つ目の子タスクを追加
                event.task_children[0].specified_time[0] = (new Date()).getTime() + 600000;  // 10分余裕を持たせておく
                event.task_children[0].specified_time[1] = event.task_children[0].specified_time[0] + event.task_children[0].required_time;
                var j = 0;
                for (var i = 0; i < event.task_children.length; i++){  // 各子タスクについて, [day == 1] の時と同様の動作を実行
                    for (; j < times.length; j++) {
                        if (event.task_children[i].specified_time[1] <= times[j][0]) {
                            break;
                        }
                        if ((times[j][0] >= event.task_children[i].specified_time[0] && times[j][0] < event.task_children[i].specified_time[1]) ||  // スタートをまたいでいないか?
                            (times[j][1] > event.task_children[i].specified_time[0] && times[j][1] <= event.task_children[i].specified_time[1]) ||  // エンドまたいでいないか?
                            (times[j][0] <= event.task_children[i].specified_time[0] && times[j][1] >= event.task_children[i].specified_time[1])){ // 元からある予定の間にすっぽり埋もれていないか?
                            event.task_children[i].specified_time[0] = times[j][1] + 10 * 60 * 1000;  // 10分の休憩を持たせておく.
                            event.task_children[i].specified_time[1] = event.task_children[i].specified_time[0] + event.task_children[i].required_time;
                        }
                    }
                    if (event.task_children[i].specified_time[1] > event.task_children[i].deadline) {  // 各タスクの終了時間が締め切りを過ぎていたら
                        console.log("この予定「" + event.task_children[i].name + "」の\n終了時間:" + (new Date(event.task_children[i].specified_time[1])).toString() + "は\n締切時間:" + (new Date(event.task_children[i].deadline)).toString() + "を過ぎてしまいます.");
                        console.log("警告：この予定の追加はやめといたほうがいいよ!");
                        // this.removeTask(event.task_children[i]);
                    }
                    else {  // 締め切りの過ぎていないタスクを追加する
                        times.splice(i, 0, event.task_children[i].specified_time);
                        if ((i + 1) < event.task_children.length) {
                            const tmp = new Date(event.task_children[i].specified_time[1]);
                            event.task_children[(i + 1)].specified_time[0] = (new Date(tmp.getFullYear(), tmp.getMonth(), (tmp.getDate() + 1), 8).getTime()); //寝る時間等を設定できたら8時になってるところを消してもよい
                            event.task_children[(i + 1)].specified_time[1] = event.task_children[(i + 1)].specified_time[0] + event.task_children[(i + 1)].required_time;
                        }
                    }
                    if(j > 0){
                        j--;
                    }
                    // console.log(event.task_children[i].name + "\n開始時間:" + (new Date(event.task_children[i].specified_time[0])).toString() + "\n終了時間:" + (new Date(event.task_children[i].specified_time[1])).toString());
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
        if(task.auto_scheduled) {
            // 自動スケジューリングをする処理 (task_childrenはコンストラクタで更新している → 子タスクがあればtask_childrenに要素が2個以上入っている.)
            this.auto_schedule.push(task);
            this.AutoScheduling();
        } else if (!(task.duplicate)) {
            // 自動スケジューリングをしない処理
            // 入れる予定の時間に重複していなければ入れる
            try {
                for(var i=0;i<this.on_time.length;i++) {
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

        this.all_tasks = this.returnAllTasks();
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
        this.all_tasks = this.returnAllTasks();  // 更新
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
        if(task.auto_scheduled) {
            tasks = this.auto_schedule;
        } else if(task.duplicate){
            tasks = this.other;
        } else {
            tasks = this.on_time;
        }
        for(var i=0; i < tasks.length;i++) {
            if(tasks[i].id == id) {
                tasks.splice(i,1);
                console.log("確認用メッセージ:「" + task.name + "」を削除しました.");
            }
        }
        this.AutoScheduling();
        this.all_tasks = this.returnAllTasks();
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
        console.log("確認用メッセージ:全ての予定,タスクを表示");
        for (const events of this.all_tasks) {
            console.log(events.name + ":" + (new Date(events.specified_time[0])).toString() + " -> " + (new Date(events.specified_time[1])).toString());
        }
    }

    // all_tasksに全てのtaskを追加するモジュール (ここで, 分割した場合は統合する？) 
    // (子タスクの情報は親タスクから復元可能！ → 親タスクさえデータベースに格納しておいて, autoSchedulingで子タスクを展開すれば問題ない.)
    returnAllTasks(){
        var i = 0;
        var j = 0;
        var all_tasks = [];
        while (i < this.on_time.length || j < this.auto_schedule.length) {
            if (i >= this.on_time.length) {
                var n = this.auto_schedule[j].task_children.length;
                if (n > 1) {
                    for (var k = 0; k < n; k++) {
                        all_tasks.push(this.auto_schedule[j].task_children[k]);
                    }
                }
                else {
                    all_tasks.push(this.auto_schedule[j]);
                }
                j++;
            }
            else if (j >= this.auto_schedule.length) {
                all_tasks.push(this.on_time[i]);
                i++;
            }
            else {
                if (this.on_time[i].specified_time[0] > this.auto_schedule[j].specified_time[0]) {
                    var n = this.auto_schedule[j].task_children.length;
                    if (n > 1) {
                        for (var k = 0; k < n; k++) {
                            all_tasks.push(this.auto_schedule[j].task_children[k]);
                        }
                    }
                    else {
                        all_tasks.push(this.auto_schedule[j]);
                    }
                    j++;
                } else {
                    all_tasks.push(this.on_time[i]);
                    i++;
                }
            }
        }
        for (i = 0; i < this.other.length; i++){
            all_tasks.push(this.other[i]);
        }
        // console.log("確認用メッセージ:全ての予定を表示");
        // for (const events of all_tasks) {
        //     console.log("タスク名:" + events.name + "\n開始時間:" + (new Date(events.specified_time[0])).toString() + "\n終了時間:" + (new Date(events.specified_time[1])).toString() + "\n締切時間:" + (new Date(events.deadline)).toString());
        // }
        return all_tasks;
    }
}

var myLifestyle = new Schedule([], [], []);
var mySchedule = new Schedule([], [], []);
var mySettings = new Settings();

var user1 = new User(2123, "山田太郎", "yamada.taro@gmail.com", myLifestyle, mySchedule, mySettings);
// constructor(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, required_time, days, auto_scheduled, specified_time)
var task1 = new Task(123, "実験Bレポート", "課題", "Webページのデザインを開発せねば〜", false, false, false, false, (new Date(2023, 1, 10, 17, 0)).getTime(), 5, 2, true, null);
var task2 = new Task(101, "情報理論課題", "課題", "早く早く終わりたい！！", false, false, false, false, (new Date(2023, 1, 10, 12, 0)).getTime(), 3, 1, true, null);
var task3 = new Task(100, "情報理論", "授業", "情報理論の授業！！！！！！！", false, false, false, false, (new Date(2023, 1, 10, 23, 55)).getTime(), null, 1, false, [[(new Date(2023, 1, 10, 12, 15)).getTime(), (new Date(2023, 1, 10, 15, 0)).getTime()]]);
var task4 = new Task(142, "情報英語発展", "課題", "英語で書かれた情報の専門誌を和訳する", false, false, false, false, (new Date(2023, 1, 9, 0, 0)).getTime(), 1, 1, true, null);
var task5 = new Task(142, "情報英語発展", "課題", "英語で書かれた情報の専門誌を和訳する", false, false, false, false, (new Date(2023, 1, 16, 0, 0)).getTime(), 1, 1, true, null);

user1.schedule.addTask(task1);
user1.schedule.addTask(task2);
user1.schedule.addTask(task3);
user1.schedule.addTask(task4);

user1.schedule.viewAllTasks();

user1.schedule.editTask(task4,task5);

// // カテゴリに毎年/毎月/毎週/平日/週末/毎日を設定する？
// var plan1 = new Task(199, "睡眠時間", "生活", "いい夢みたい!!!!", true, true, false, false, null, 8, 1, false, [[(new Date(2022, 11, 24, 0, 0)).getTime(), (new Date(2022, 11, 24, 8, 0)).getTime()]]);

// user1.lifestyle.addTask(plan1);

user1.schedule.viewAllTasks();
