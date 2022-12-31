import {Task} from '../js/class_Task.js';

export class Schedule{
    constructor(auto_schedule, on_time, other){  // データベースに元々格納してあるデータを持ってくる.
        this.auto_schedule = auto_schedule; //自動スケジューリングするTask
        this.on_time = on_time; //時間が決まっているTask,予定
        this.other = other; // 重複を許すTask
    }

    AutoScheduling() {
        if (this.auto_schedule.length == 0) {
            return;
        }

        // 動くかわからんので、とりあえず確認用
        //締め切り順でソート
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
            if (event.days == 1) {
                event.specified_time[0] = (new Date()).getTime() + 600000;  // 10分余裕を持たせておく
                event.specified_time[1] = event.specified_time[0] + event.required_time;
                var i = 0;
                for (; i < times.length; i++) {
                    if (event.specified_time[1] <= times[i][0]) {  // 各タスクの終了時間が固定時間の開始時間より速いなら
                        break;
                    }
                    if ((times[i][0] >= event.specified_time[0] && times[i][0] < event.specified_time[1]) ||  // スタートをまたいでいないか?
                        (times[i][1] > event.specified_time[0] && times[i][1] <= event.specified_time[1]) ||  // エンドまたいでいないか?
                        (times[i][0] <= event.specified_time[0] && times[i][1] >= event.specified_time[1])){ // 元からある予定の間にすっぽり埋もれていないか?
                        event.specified_time[0] = times[i][1] + 10 * 60 * 1000;  // 10分の休憩を持たせておく.
                        event.specified_time[1] = event.specified_time[0] + event.required_time;
                    }
                }
                if (event.specified_time[1] > event.deadline) {  // 各タスクの終了時間が締め切りを過ぎていたら
                    console.log("この予定「" + event.name + "」の\n終了時間:" + (new Date(event.specified_time[1])).toString() + "は\n締切時間:" + (new Date(event.deadline)).toString() + "を過ぎてしまいます.");
                    console.log("この予定の追加はやめといたほうがいいよ!");
                    this.removeTask(event);
                }
                else {  // 締め切りの過ぎていないタスクを追加する
                    times.splice(i, 0, event.specified_time);
                }
            }
            else {
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
                        console.log("この予定の追加はやめといたほうがいいよ!");
                        // this.removeTask(event.task_children[i]);
                    }
                    else {  // 締め切りの過ぎていないタスクを追加する
                        times.splice(i, 0, event.task_children[i].specified_time);
                        if ((i + 1) < event.task_children.length) {
                            const tmp = new Date(event.task_children[i].specified_time[1]);
                            event.task_children[(i + 1)].specified_time[0] = (new Date(tmp.getFullYear(), tmp.getMonth(), (tmp.getDate() + 1)).getTime());
                            event.task_children[(i + 1)].specified_time[1] = event.task_children[(i + 1)].specified_time[0] + event.task_children[(i + 1)].required_time;
                        }
                    }
                    if(j > 0){
                        j--;
                    }
                    console.log((i+1) + "個目の子タスクの\n開始時間:" + (new Date(event.task_children[i].specified_time[0])).toString() + "\n終了時間:" + (new Date(event.task_children[i].specified_time[1])).toString());
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
            // 自動スケジューリングをする処理
            this.auto_schedule.push(task);
            this.AutoScheduling();
        } else if (!(task.duplicate)) {
            // 自動スケジューリングをしない処理
            // 入れる予定の時間に重複していなければ入れる
            try {
                for(var i=0;i<this.on_time.length;i++) {
                    if((this.on_time[i].specified_time[0] >= task.specified_time[0] && this.on_time[i].specified_time[0] < task.specified_time[1]) ||  // スタートをまたいでいないか?
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
    }

    // 時系列タスクの表示をするモジュール
    viewTasks() {
        for (const events of this.auto_schedule) {
            console.log(events.name + ":" + (new Date(events.specified_time[0])).toString() + " -> " + (new Date(events.specified_time[1])).toString());
        }
        for (const events of this.on_time) {
            console.log(events.name + ":" + (new Date(events.specified_time[0])).toString() + " -> " + (new Date(events.specified_time[1])).toString());
        }
    }

    // all_tasksに全てのtaskを追加するモジュール (ここで, 分割した場合は統合する？) 
    returnAllTasks(){
        var i = 0;
        var j = 0;
        var all_tasks = [];
        while (i < this.on_time.length || j < this.auto_schedule.length) {
            if (i >= this.on_time.length) {
                all_tasks.push(this.auto_schedule[j]);
                j++;
            }
            else if (j >= this.auto_schedule.length) {
                all_tasks.push(this.on_time[i]);
                i++;
            }
            else {
                if (this.on_time[i].specified_time[0] > this.auto_schedule[j].specified_time[0]) {
                    all_tasks.push(this.auto_schedule[j]);
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
        console.log("確認用メッセージ:全ての予定を表示");
        for (const events of all_tasks) {
            console.log("タスク名:" + events.name + "\n開始時間:" + (new Date(events.specified_time[0])).toString() + "\n終了時間:" + (new Date(events.specified_time[1])).toString() + "\n締切時間:" + (new Date(events.deadline)).toString());
        }
        return all_tasks;
    }
}


// var myLifestyle = new Schedule([], [], []);
// var mySchedule = new Schedule([], [], []);
// var mySettings = new Settings();

// var user1 = new User("山田太郎", myLifestyle, mySchedule, mySettings);

// constructor(id, name, category, overview, favorite, plan_or_task, finished, duplicate, deadline, required_time, days, auto_scheduled, specified_time)
// var task1 = new Task(123, "デザイン開発", "課題", "Webページのデザインを開発せねば〜", false, false, false, false, (new Date(2022, 11, 14, 18, 20)).getTime(), 3, 1, true, [[0, 0]]);
// var task2 = new Task(101, "情報線形代数レポート課題", "課題", "早く早く終わりたい！！", false, false, false, false, (new Date(2022, 11, 14, 19, 0)).getTime(), 1, 1, true, [[0, 0]]);
// var task3 = new Task(100, "デザイン課題", "課題", "デザインの授業の課題！！！！！！！", false, false, false, false, (new Date(2023, 11, 14, 18, 0)).getTime(), null, 1, false, [[(new Date(2022, 11, 14, 5, 25)).getTime(), (new Date(2022, 11, 14, 6, 0)).getTime()]]);
// var task4 = new Task(142, "情報英語発展", "課題", "英語で書かれた情報の専門誌を和訳する", false, false, false, false, (new Date(2022, 11, 14, 18, 30)).getTime(), 3, 1, true, [[0, 0]]);
// var task5 = new Task(182, "ドイツ語基礎", "課題", "ドイツ語で会話をしてみよう", false, false, false, false, (new Date(2022, 11, 14, 18, 30)).getTime(), 3, 1, true, [[0, 0]]);

// user1.schedule.addTask(task1);
// user1.schedule.addTask(task2);
// user1.schedule.addTask(task3);
// user1.schedule.addTask(task4);
// user1.schedule.addTask(task5);

// user1.schedule.viewTasks();

// console.log(user1.schedule.returnAllTasks());

// user1.schedule.removeTask(task2);

// //user1.schedule.viewTasks();

// console.log(user1.schedule.returnAllTasks());
