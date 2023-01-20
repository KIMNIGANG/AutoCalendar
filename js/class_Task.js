export class Task {
    /** (引数の数：19個)
     * @param {Number} id :Taskのid
     * @param {String} name :Task名
     * @param {String} category :カテゴリー
     * @param {String} overview :メモ
     * @param {Boolean} favorite :お気に入り
     * @param {String} plan_or_task :予定かタスクか(内部では0,1で表す)
     * @param {Boolean} finished :終了済みか
     * @param {Boolean} duplicate :重複を許すか
     * @param {Timestamp} deadline :Taskの締め切り時間
     * @param {Number} required_time :Taskの推定所要時間(時間)
     * @param {Number} days :何日に分けるか
     * @param {Boolean} auto_scheduled :自動スケジューリングするか
     * @param {List} specified_time :開始時間, 終了時間(入力は二次元配列で受け取り,内部では一次元配列で表す)
     * @param {Number} unit_time :単位時間 (時間) (childでは-1であるとする)
     * @param {String} repeat_unit :繰り返し単位（year/month/week/day/null (定例スケジュール用)）
     * @param {Number} importance :重要度(1~5)
     * @param {String} place :場所
     * @param {String} color :色(red,orange,yellow,green,blue,purple)
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
        this.specified_time = specified_time; // そのままの配列でもらう
        this.unit_time = unit_time * 1000 * 60 * 60; // 時単位
        this.repeat_unit = repeat_unit;
        this.importance = importance;
        this.place = place;
        this.color = color;
        this.valid = valid;

        // 子タスクの配列
        this.task_children = [];
        this.start = new Date(); // 各分割タスクを行う日時の午前0時

        // 指定時間がnullでないときの処理
        if (this.specified_time != null) {
            // 時間が指定されていて推定所要時間が合計の指定時間より超えてしまうとき
            var restTime = this.required_time;
            console.log(this.specified_time.length);
            for (var i = 0; i < this.specified_time.length; i++) {
                restTime = restTime - (this.specified_time[i][1] - this.specified_time[i][0]);
            }
            if (restTime > 0) {
                // これは無くてもプログラム上問題ない？
                // throw new Error("この予定は指定時間が所要時間を満たさないため追加できません。");
            }

            //これなんだ（石井）
            //this.auto_scheduled = false;  // 変な入力があった時用
            //this.days = 1;

            // specified_timeが複数あるとき
            if (this.specified_time.length > 1) {
                if (this.unit_time < 0) {
                    // 子の増加防止
                    console.log("Invalid!");
                    return;
                }
                for (var i = 0; i < this.specified_time.length; i++) {
                    var tmp = [this.specified_time[i][0], this.specified_time[i][1]];
                    var child = new Task(
                        id,
                        name,
                        category,
                        overview,
                        favorite,
                        plan_or_task,
                        finished,
                        duplicate,
                        deadline,
                        required_time / (this.specified_time.length),
                        1,
                        false,
                        tmp,
                        -1,
                        repeat_unit,
                        importance,
                        place,
                        color,
                        valid
                    );
                    child.name =
                        child.name + "(" + (i + 1) + "/" + this.specified_time.length + ")"; // 線形代数(1/5)みたいな名前にする
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
                
                if (this.specified_time.length <= 0) {
                    // 子の増加防止
                    console.log("何故かInvalid!");
                    this.specified_time.push([new Date(), new Date()]);  // 応急措置
                }
                
                this.specified_time = [
                    this.specified_time[0][0],
                    this.specified_time[0][1],
                ]; // 時間オーバーは許す (1次元に直す)

                // 石井追加
                // specified_timeが１つのときも子タスクを作る。
                var child = new Task(
                    id,
                    name,
                    category,
                    overview,
                    favorite,
                    plan_or_task,
                    finished,
                    duplicate,
                    deadline,
                    required_time,
                    1,
                    false,
                    this.specified_time,
                    -1,
                    repeat_unit,
                    importance,
                    place,
                    color,
                    valid
                );
                child.name = child.name + "(1/1)"; // 線形代数(1/5)みたいな名前にする
                this.task_children.push(child);
            }
        } else {
            // 指定時間がnullのときの処理
            this.specified_time = [
                new Date().getTime() + 600000,
                new Date().getTime() + this.required_time + 600000,
            ];
            // invalidなら強制終了 (子供はinvalidにする.)
            if (this.unit_time < 0) {
                console.log("Invalid!");
                return;
            }
            var remain_time = this.required_time; // 分割しきれていない時間
            // (実行例)
            // required_time = 10
            // unit_time = 0.5
            // days = 5
            // 日割りするときの処理
            var unit = 0.5;  // (30分, 固定時間)
            if (this.days > 1) {
                // daysが指定されたときは最大daysの分のchildを作成
                for (var i = 0; i < this.days; i++) {
                    var child = new Task(
                        id,
                        name,
                        category,
                        overview,
                        favorite,
                        plan_or_task,
                        finished,
                        duplicate,
                        deadline,
                        Math.min(unit, remain_time / (60 * 60 * 1000)),
                        // Math.min(unit_time, remain_time / (60 * 60 * 1000)),
                        1,
                        auto_scheduled,
                        null,
                        -1,
                        repeat_unit,
                        importance,
                        place,
                        color,
                        valid
                    );
                    child.name = child.name + "(" + (i + 1) + "日目)"; // 線形代数(1日目)みたいな名前にする
                    this.task_children.push(child);
                    remain_time -= unit * 60 * 60 * 1000;
                    // remain_time -= this.unit_time;
                    if (remain_time <= 0) break;
                }
                // (上の実行例に対応)
                // 各子どものrequired_time = 0.5, remain_time = 7.5
                var day = 0;
                while (remain_time > 0) {
                    // 開始時刻の早いタスクから順に残りの所要時間を均等に上乗せ
                    this.task_children[day].required_time += unit * 60 * 60 * 1000;
                    remain_time -= unit * 60 * 60 * 1000;
                    // this.task_children[day].required_time += this.unit_time;
                    // remain_time -= this.unit_time;
                    day++;
                    if (day == this.days) {
                        // 繰り返すため
                        day = 0;
                    }
                }
            }
            // 日割りしないときは単位時間ごとにタスクを分ける
            else {
                // タスクを単位時間ごとに区切る
                var count = 0;
                while (remain_time > 0) {
                    // 分割出来るだけ分割
                    console.log("required_time = " + Math.min(unit_time, remain_time / (60 * 60 * 1000)));
                    var child = new Task(
                        id,
                        name,
                        category,
                        overview,
                        favorite,
                        plan_or_task,
                        finished,
                        duplicate,
                        deadline,
                        Math.min(unit_time, remain_time / (60 * 60 * 1000)),
                        1,
                        auto_scheduled,
                        null,
                        -1,
                        repeat_unit,
                        importance,
                        place,
                        color,
                        false
                    );
                    child.name = child.name + "(" + (count + 1) + "個目)"; // 個数を指定
                    this.task_children.push(child);
                    remain_time -= this.unit_time;
                    count++;
                }
                // (以下は分割しない場合)
                // var child = new Task(
                //     id,
                //     name,
                //     category,
                //     overview,
                //     favorite,
                //     plan_or_task,
                //     finished,
                //     duplicate,
                //     deadline,
                //     remain_time,
                //     1,
                //     auto_scheduled,
                //     null,
                //     -1,
                //     repeat_unit,
                //     importance,
                //     place,
                //     color,
                //     false
                // );
                // this.task_children.push(child);
            }
        }
    }

    // 2次元配列 → 1次元配列 (データベースから取り出す時の補助関数) 
    // TwoArrayToOneArray() {
    //     this.specified_time = [this.specified_time[0][0], this.specified_time[0][1]];
    // }

    // // 1次元配列 → 2次元配列 (データベースに格納する時の補助関数) 
    // OneArrayToTwoArray() {
    //     this.specified_time = [this.specified_time];
    // }

}
