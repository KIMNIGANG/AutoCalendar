import { Task } from "../js/class_Task.js";
import { User } from "../js/class_User.js";
import { Schedule } from "../js/class_Schedule.js";
import { Settings } from "../js/class_Settings.js";
import { firebase_send } from "./data_send.js";
import { all_tasks } from "./get_tasks.js";
import { timestampToDisplay } from "../js/common.js";

//(KIM)ユーザー情報を取得
//////////////////////////////////////////////////////////////////////
//(仮)ローカルにユーザー情報を作成
var mySchedule = new Schedule([], [], []);
var user = new User(null, null, null, null, mySchedule, null);
//////////////////////////////////////////////////////////////////////

//(KIM)データベースから他のタスクを取得し、Taskクラスの変換してScheduleクラスに格納
//////////////////////////////////////////////////////////////////////
//(仮)ローカルに最初から入っているタスクを作成しScheduleクラスに格納
// var task1 = new Task(123, "デザイン開発", "課題", "Webページのデザインを開発せねば〜", false, false, false, false, (new Date(2022, 11, 14, 18, 20)).getTime(), 3, 1, true, [[0, 0]]);
// var task2 = new Task(101, "情報線形代数レポート課題", "課題", "早く早く終わりたい！！", false, false, false, false, (new Date(2022, 11, 14, 19, 0)).getTime(), 1, 1, true, [[0, 0]]);
// var task3 = new Task(100, "デザイン課題", "課題", "デザインの授業の課題！！！！！！！", false, false, false, false, (new Date(2023, 11, 14, 18, 0)).getTime(), null, 1, false, [[(new Date(2022, 11, 14, 5, 25)).getTime(), (new Date(2022, 11, 14, 6, 0)).getTime()]]);
// var task4 = new Task(142, "情報英語発展", "課題", "英語で書かれた情報の専門誌を和訳する", false, false, false, false, (new Date(2022, 11, 14, 18, 30)).getTime(), 3, 1, true, [[0, 0]]);
// var task5 = new Task(182, "ドイツ語基礎", "課題", "ドイツ語で会話をしてみよう", false, false, false, false, (new Date(2022, 11, 14, 18, 30)).getTime(), 3, 1, true, [[0, 0]]);
// var all_tasks = [task1, task2, task3, task4, task5];
//////////////////////////////////////////////////////////////////////

//選択されたタスクの情報を取得
var selected_task_id = window.sessionStorage.getItem(["selected_task_id"]);
var selected_task = "";
for (const task of all_tasks) {
  if (task.id == selected_task_id) {
    var selected_task = task;
  }
}


//選択されたタスクの詳細を表示
var detail_container = document.getElementById("detail_container")
if (selected_task) {
  let plan_or_task;
  if (selected_task.plan_or_task == 0) {
    plan_or_task = "予定";
  } else {
    plan_or_task = "タスク";
  }

  let auto_scheduled = "";
  if (selected_task.plan_or_task == 1) {
    if (selected_task.auto_scheduled == true) {
      auto_scheduled = "自動でスケジューリングする<br>";
    } else {
      auto_scheduled = "自動でスケジューリングしない<br>";
    }
  }


  let finished = "";
  if (selected_task.finished == true) {
    finished = "完了済み";
  }

  let specified_times = ``;
  let number_of_child = 0;
  for (let child of selected_task.task_children) {
    ++number_of_child;
    specified_times += `
    実施日${number_of_child}：${timestampToDisplay(child.specified_time[0])}~${timestampToDisplay(child.specified_time[1])}
    <br>
    `
  }

  let duplicate;
  if (selected_task.duplicate == true) {
    duplicate = "タスクの重複を許す";
  } else {
    duplicate = "タスクの重複を許さない";
  }

  let importance = "";
  let unit_time = "";
  if (selected_task.auto_scheduled == true) {
    importance = "重要度：" + selected_task.importance;
    unit_time = "<br>分割する時間の単位:";
    if (selected_task.unit_time >= 24 * 60 * 60 * 1000) {  // (分割しない場合)
      unit_time += "指定なし";
    }
    else {
      let hour = 0;
      let tmp = selected_task.unit_time;
      while (tmp >= 60 * 60 * 1000) {
        hour += 1;
        tmp -= 60 * 60 * 1000;
      }
      if (hour > 0) {
        unit_time += hour + "時間";
      }
      console.log("残り時間 = " + (tmp / (1000 * 60)));
      if (tmp >= 30 * 60 * 1000) {
        unit_time += "半";
      }
      else if (tmp > 0) {
        unit_time += (tmp / (1000 * 60)) + "分";
      }
    }
    // unit_time = "<br>分割する時間の単位:" + (selected_task.unit_time / (1000 * 60)) + "分";
  }

  let favorite;
  if (selected_task.favorite == true) {
    favorite = "お気に入り登録する";
  } else {
    favorite = "お気に入り登録しない";
  }

  detail_container.innerHTML = `
    <div class="add_task__item">
    ${finished}
    </div>

    <div class="add_task__item">
    <p>種類</p>
    ${plan_or_task}
    </div>

    <div class="add_task__item">
    <p>タスク名</p>
    ${selected_task.name}
    </div>
  `;

  if (selected_task.plan_or_task == 1) {
    detail_container.innerHTML += `
    <div class="add_task__item">
    <p>締切日</p>
    ${timestampToDisplay(selected_task.deadline)}
    </div>

    <div class="add_task__item">
    <p>推定予定時間</p>
    ${selected_task.required_time / (1000 * 60 * 60)}時間
    </div>
  `;
  }


  detail_container.innerHTML += `
    <div class="add_task__item">
    <p>実施時間</p>
    ${auto_scheduled}
    実施日数：${selected_task.days}日
    <br>
    ${specified_times}
    </div>

    <div class="add_task__item">
    <p>スケジューリング設定</p>
    ${duplicate}
    <br>
    ${importance}
    ${unit_time}
    </div>

    <div class="add_task__item">
    <p>概要</p>
    ${selected_task.overview}
    </div>

    <div class="add_task__item">
    <p>カテゴリ</p>
    ${selected_task.category}
    </div>

    <div class="add_task__item">
    <p>場所</p>
    ${selected_task.place}
    </div>

    <div class="add_task__item">
    <p>色</p>
    ${selected_task.color}
    </div>

    <div class="add_task__item">
    <p>お気に入り</p>
    ${favorite}
    </div>

    <button type="button" id="remove__btn">削除</button>
    <button type="button" id="edit__btn">編集</button>
            `;

  //削除処理
  //validをfalseにする
  document.getElementById("remove__btn").addEventListener("click", function () {
    if (window.confirm("本当に削除しますか？")) {
      selected_task.valid = false;
      firebase_send(all_tasks);
    }
  });

  document.getElementById("edit__btn").addEventListener("click", function () {
    window.location.href = '../constructor/add_task.html';
  });

} else {
  // selected_taskがなぜか無いとき
  detail_container.innerHTML = `
    予期せぬエラーが発生しました。
            `;
}

document.getElementById("cancel__btn").addEventListener("click", function () {
  window.location.href = '../constructor/index.html';
});

