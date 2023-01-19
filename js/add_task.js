import { Task } from "../js/class_Task.js";
import { User } from "../js/class_User.js";
import { Schedule } from "../js/class_Schedule.js";
import { Settings } from "../js/class_Settings.js";
import { firebase_send } from "./data_send.js";
import { all_tasks } from "./get_tasks.js";
import { uuidv4 } from "./create_uuid.js";
import { taskToArray } from "../js/common.js";

//(KIM)ユーザー情報を取得
//////////////////////////////////////////////////////////////////////
//(仮)ローカルにユーザー情報を作成
var mySchedule = new Schedule([], [], []);
var user = new User(null, null, null, null, mySchedule, null);
//////////////////////////////////////////////////////////////////////

//遷移元がdetail.htmlかどうか
const ref = document.referrer;
const edit_page = ref.endsWith("detail.html");

//遷移元がdetail.htmlだった場合
if (edit_page == true) {
  //タイトル変更
  document.getElementById("title_new").style.display = "none";
  document.getElementById("title_edit").style.display = "";
  // 選択されたタスクを取得
  var selected_task_id = window.sessionStorage.getItem(["selected_task_id"]);
  var selected_task = "";
  for (const task of all_tasks) {
    if (task.id == selected_task_id) {
      var selected_task = task;
    }
  }

  // Taskを配列に変換
  let a = taskToArray(selected_task);
  console.log(a);

  if (selected_task) {
    // フォームを自動入力する
    document.getElementById("plan_or_task").value = a.plan_or_task;
    Plan_or_Task();
    document.getElementById("title").value = a.title;
    // 予定かタスクか
    if (a.plan_or_task == "Task") {
      document.getElementById("deadline_date").value = a.deadline_date;
      document.getElementById("deadline_hour").value = a.deadline_hour;
      document.getElementById("deadline_minute").value = a.deadline_minute;
      document.getElementById("len_hour").value = a.len_hour;
      document.getElementById("len_minute").value = a.len_minute;
    }
    document.getElementById("auto_scheduling").checked = a.auto_scheduling;
    document.getElementById("number_of_imp_days").value = a.number_of_children;
    AutoScheduling();
    // 自動スケジューリングするか
    if (a.auto_scheduling == false) {
      for (var i = 1; i < a.number_of_children + 1; i++) {
        document.getElementById("imp_date_" + i).value = a["imp_date_" + i];
        document.getElementById("imp_start_hour_" + i).value =
          a["imp_start_hour_" + i];
        document.getElementById("imp_start_minute_" + i).value =
          a["imp_start_minute_" + i];
        document.getElementById("imp_end_hour_" + i).value =
          a["imp_end_hour_" + i];
        document.getElementById("imp_end_minute_" + i).value =
          a["imp_end_minute_" + i];
      }
    } else {
      document.getElementById("importance").value = a.importance;
      document.getElementById("unit_time").value = a.unit_time;
    }
    document.getElementById("task_duplication").checked = a.task_duplication;
    document.getElementById("overview").value = a.overview;
    document.getElementById("category").value = a.category;
    document.getElementById("place").value = a.place;
    document.getElementById("color").value = a.color;
    document.getElementById("favorite").checked = a.favorite;
  } else {
    console.log("selected_taskがないエラーが発生しました");
    window.location.href = "../constructor/index.html";
  }
}

//main関数
//確定ボタンが押されたときの処理
document.getElementById("submit__btn").addEventListener("click", function () {
  //all_tasksをaddTaskする
  all_tasks.forEach((e) => {
    if (edit_page == true) {
      if (selected_task) {
        if (e.id != selected_task.id) {
          user.schedule.addTask(e);
        }
      }
    } else {
      user.schedule.addTask(e);
    }
  });
  //新しいタスクのデータをフォームから取得し、Taskクラスに変換
  var new_task = get_new_task();
  console.log(new_task);
  //タスクの入力内容の妥当性を判断
  if (form_check(new_task) == false) {
    console.log("フォームエラー");
    return;
  }
  //Scheduleクラスに格納
  user.schedule.addTask(new_task);

  //(KIM)Scheduleクラスのall_tasksのタスクをデータベースに格納
  let updated_tasks = user.schedule.returnAllTasks();
  console.log("update_task", updated_tasks);
  firebase_send(updated_tasks, edit_page);
  // 同期処理がダメだ
  // if(edit_page==true){
  //     window.location.href = '../constructor/detail.html';
  // }else{
  //     window.location.href = '../constructor/index.html';
  // }
});

//フォームチェック：入力内容に問題があればfalseを出力、メッセージを表示
var error_number = 0;
function form_check(task) {
  var error_messages_container = document.getElementById(
    "error_messages_container"
  );
  error_messages_container.innerHTML = "";
  error_number = 0;
  var present_time = new Date().getTime();

  //nameが入力されているか
  if (task.name == "") {
    error_message(`※タスク名を入力してください。`);
  }

  //Taskのときのみ
  if (task.plan_or_task == 1) {
    //deadlineが入力されているか、入力されている場合、現在時刻を越えていないか
    console.log(task.deadline);
    if (Number.isNaN(task.deadline)) {
      error_message(`※締切日を入力してください。`);
    } else {
      if (task.deadline < present_time) {
        error_message(`※締切日を過ぎています。`);
      }

      //required_timeが入力されているか
      if (task.required_time == 0) {
        error_message(`※推定予定時間を入力してください。`);
      }
    }
  }

  //auto_scheduledがfalseのとき
  //ワンちゃんダメ
  if (task.auto_scheduled == false) {
    var error_number_2 = 0;

    if (task.days > 1) {
      for (const times of task.specified_time) {
        //実施時間が入力されているか、現在時刻を越えていないか
        var error_number_3 = 0;
        for (const time of times) {
          console.log(time);
          if (Number.isNaN(time)) {
            error_number_2 += 1;
            error_number_3 += 1;
          } else {
            if (time < present_time) {
              error_number_2 += 1;
              error_number_3 += 1;
            }
          }
        }

        if (error_number_3 == 0) {
          if (times[0] > times[1]) {
            //実施時間の順序は正しいか
            error_number_2 += 1;
          } else if (task.plan_or_task == 1 && times[1] > task.deadline) {
            //実施時間は締切日を超えていないか
            error_number_2 += 1;
          }
        }
      }
    } else {
      var error_number_3 = 0;
      for (const time of task.specified_time) {
        if (Number.isNaN(time)) {
          error_number_2 += 1;
          error_number_3 += 1;
        } else {
          if (time < present_time) {
            error_number_2 += 1;
            error_number_3 += 1;
          }
        }
      }
      if (error_number_3 == 0) {
        if (task.specified_time[0] > task.specified_time[1]) {
          //実施時間の順序は正しいか
          error_number_2 += 1;
        } else if (task.plan_or_task == 1 && task.specified_time[1] > task.deadline) {
          //実施時間は締切日を超えていないか
          error_number_2 += 1;
        }
      }

    }

    //実施時間がすべて入力されている場合、それらに重複は無いか
    if (error_number_2 == 0) {
      task.task_children.sort(function (a, b) {
        return a.specified_time[0] > b.specified_time[0] ? 1 : -1;
      });

      var time_list = [];
      for (let child of task.task_children) {
        time_list.push(child.specified_time[0]);
        time_list.push(child.specified_time[1]);
      }
      var time_list_sorted = time_list.map((x) => x);
      time_list_sorted.sort(function (a, b) {
        return a > b ? 1 : -1;
      });

      if (time_list.toString() != time_list_sorted.toString()) {
        error_number_2 = -1;
      }
    }

    if (error_number_2 > 0) {
      error_message(`※実施時間を正しく入力してください。`);
    } else if (error_number_2 < 0) {
      error_message(`※実施時間が重複しています。`);
    }
  }

  if (error_number == 0) {
    console.log(true);
    return true;
  } else {
    console.log(false);
    return false;
  }
}

//フォームチェックでエラーメッセージを表示する関数
function error_message(message) {
  error_number += 1;
  var message_container = document.createElement("p");
  message_container.innerHTML = message;
  error_messages_container.appendChild(message_container);
}

//フォームの動的化：タスクか予定か
document.getElementById("plan_or_task").onchange = Plan_or_Task;
function Plan_or_Task() {
  if (document.getElementById("plan_or_task")) {
    var Plan_or_Task = document.getElementById("plan_or_task").value;
    if (Plan_or_Task == "Plan") {
      document.getElementById("deadline_form").style.display = "none";
      document.getElementById("len_form").style.display = "none";
      document.getElementById("auto_scheduling_form").style.display = "none";
      document.getElementById("repeat_unit_form").style.display = "";
      document.getElementById("auto_scheduling").checked = false;
      AutoScheduling();
    } else if (Plan_or_Task == "Task") {
      document.getElementById("deadline_form").style.display = "";
      document.getElementById("len_form").style.display = "";
      document.getElementById("auto_scheduling_form").style.display = "";
      document.getElementById("repeat_unit_form").style.display = "none";
      document.getElementById("auto_scheduling").checked = true;
      AutoScheduling();
    }
  }
}

//フォームの動的化：AutoSchedulingがオンのときにフォームを消す
document.getElementById("auto_scheduling").onchange = AutoScheduling;
function AutoScheduling() {
  if (document.getElementById("auto_scheduling").checked === true) {
    document.getElementById("auto_scheduling_true").style.display = "";
    document.getElementById("number_of_imp_days").onchange = "";
    document.getElementById("imp_date__form--container").innerHTML = "";
  } else {
    document.getElementById("auto_scheduling_true").style.display = "none";
    document.getElementById("number_of_imp_days").onchange = CreatingForm;
    CreatingForm();
  }
}

//フォームの動的化：number_of_imp_days分だけフォームを作成
document.getElementById("number_of_imp_days").onchange = CreatingForm;
function CreatingForm() {
  var n = Number(document.getElementById("number_of_imp_days").value);
  document.getElementById("imp_date__form--container").innerHTML = "";
  for (var i = 1; i < n + 1; i++) {
    var imp_date__form = document.createElement("div");
    imp_date__form.setAttribute("name", "imp_date__form_" + String(i));
    imp_date__form.innerHTML = `
        <h5>実施時間${i}</h5>
        <input name="imp_date_${i}" id="imp_date_${i}" type="date"></input>
        <br />
        開始：
        <select name="imp_start_hour_${i}" id="imp_start_hour_${i}">
            <option value="00">00</option>
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
            <option value="04">04</option>
            <option value="05">05</option>
            <option value="06">06</option>
            <option value="07">07</option>
            <option value="08">08</option>
            <option value="09">09</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="13">13</option>
            <option value="14">14</option>
            <option value="15">15</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>
            <option value="19">19</option>
            <option value="20">20</option>
            <option value="21">21</option>
            <option value="22">22</option>
            <option value="23">23</option>
        </select>時
        <select name="imp_start_minute_${i}" id="imp_start_minute_${i}">
            <option value="00">00</option>
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
            <option value="04">04</option>
            <option value="05">05</option>
            <option value="06">06</option>
            <option value="07">07</option>
            <option value="08">08</option>
            <option value="09">09</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="13">13</option>
            <option value="14">14</option>
            <option value="15">15</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>
            <option value="19">19</option>
            <option value="20">20</option>
            <option value="21">21</option>
            <option value="22">22</option>
            <option value="23">23</option>
            <option value="24">24</option>
            <option value="25">25</option>
            <option value="26">26</option>
            <option value="27">27</option>
            <option value="28">28</option>
            <option value="29">29</option>
            <option value="30">30</option>
            <option value="31">31</option>
            <option value="32">32</option>
            <option value="33">33</option>
            <option value="34">34</option>
            <option value="35">35</option>
            <option value="36">36</option>
            <option value="37">37</option>
            <option value="38">38</option>
            <option value="39">39</option>
            <option value="40">40</option>
            <option value="41">41</option>
            <option value="42">42</option>
            <option value="43">43</option>
            <option value="44">44</option>
            <option value="45">45</option>
            <option value="46">46</option>
            <option value="47">47</option>
            <option value="48">48</option>
            <option value="49">49</option>
            <option value="50">50</option>
            <option value="51">51</option>
            <option value="52">52</option>
            <option value="53">53</option>
            <option value="54">54</option>
            <option value="55">55</option>
            <option value="56">56</option>
            <option value="57">57</option>
            <option value="58">58</option>
            <option value="59">59</option>
        </select>分
        <br />
        終了：
        <select name="imp_end_hour_${i}" id="imp_end_hour_${i}">
            <option value="00">00</option>
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
            <option value="04">04</option>
            <option value="05">05</option>
            <option value="06">06</option>
            <option value="07">07</option>
            <option value="08">08</option>
            <option value="09">09</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="13">13</option>
            <option value="14">14</option>
            <option value="15">15</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>
            <option value="19">19</option>
            <option value="20">20</option>
            <option value="21">21</option>
            <option value="22">22</option>
            <option value="23">23</option>
        </select>時
        <select name="imp_end_minute_${i}" id="imp_end_minute_${i}">
            <option value="00">00</option>
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
            <option value="04">04</option>
            <option value="05">05</option>
            <option value="06">06</option>
            <option value="07">07</option>
            <option value="08">08</option>
            <option value="09">09</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="13">13</option>
            <option value="14">14</option>
            <option value="15">15</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>
            <option value="19">19</option>
            <option value="20">20</option>
            <option value="21">21</option>
            <option value="22">22</option>
            <option value="23">23</option>
            <option value="24">24</option>
            <option value="25">25</option>
            <option value="26">26</option>
            <option value="27">27</option>
            <option value="28">28</option>
            <option value="29">29</option>
            <option value="30">30</option>
            <option value="31">31</option>
            <option value="32">32</option>
            <option value="33">33</option>
            <option value="34">34</option>
            <option value="35">35</option>
            <option value="36">36</option>
            <option value="37">37</option>
            <option value="38">38</option>
            <option value="39">39</option>
            <option value="40">40</option>
            <option value="41">41</option>
            <option value="42">42</option>
            <option value="43">43</option>
            <option value="44">44</option>
            <option value="45">45</option>
            <option value="46">46</option>
            <option value="47">47</option>
            <option value="48">48</option>
            <option value="49">49</option>
            <option value="50">50</option>
            <option value="51">51</option>
            <option value="52">52</option>
            <option value="53">53</option>
            <option value="54">54</option>
            <option value="55">55</option>
            <option value="56">56</option>
            <option value="57">57</option>
            <option value="58">58</option>
            <option value="59">59</option>
        </select>分<br />
            `;
    document
      .getElementById("imp_date__form--container")
      .appendChild(imp_date__form);
  }
}

// 新しいタスクのデータをフォームから取得し、Taskクラスの形で返す関数
function get_new_task() {
  const formElements = document.forms.add_task__form;
  var a = {};

  var input_array = formElements.getElementsByTagName("input");
  var select_array = formElements.getElementsByTagName("select");
  var textarea_array = formElements.getElementsByTagName("textarea");

  for (var i = 0; i < input_array.length; i++) {
    var item = input_array.item(i);
    if (item.type == "checkbox") {
      if (item.checked === true) {
        a[item.name] = true;
      } else {
        a[item.name] = false;
      }
    } else {
      a[item.name] = item.value;
    }
  }

  for (var i = 0; i < select_array.length; i++) {
    var item = select_array.item(i);
    a[item.name] = item.value;
  }

  for (var i = 0; i < textarea_array.length; i++) {
    var item = textarea_array.item(i);
    a[item.name] = item.value;
  }

  if (a["plan_or_task"] == "Plan") {
    var deadline_date = null;
    var required_time = null;
  } else {
    var deadline_date = new Date(
      a["deadline_date"] + " " + a["deadline_hour"] + ":" + a["deadline_minute"]
    ).getTime();
    console.log("deadline_date:" + deadline_date);
    var required_time =
      new Number(a["len_hour"]) + new Number(a["len_minute"]) / 60;
  }

  let new_specified_time = null;
  if (a["auto_scheduling"] == false) {
    new_specified_time = [];
    for (var i = 1; i < Number(a["number_of_imp_days"]) + 1; i++) {
      var imp_start_date = new Date(
        a["imp_date_" + String(i)] +
        " " +
        a["imp_start_hour_" + String(i)] +
        ":" +
        a["imp_start_minute_" + String(i)]
      ).getTime();
      var imp_end_date = new Date(
        a["imp_date_" + String(i)] +
        " " +
        a["imp_end_hour_" + String(i)] +
        ":" +
        a["imp_end_minute_" + String(i)]
      ).getTime();
      new_specified_time.push([imp_start_date, imp_end_date]);
    }
  }
  console.log(new_specified_time);

  let task_id;
  if (edit_page == true) {
    task_id = selected_task.id;
  } else {
    task_id = uuidv4();
  }

  const new_task = new Task(
    task_id,
    a["title"],
    a["category"],
    a["overview"],
    a["favorite"],
    a["plan_or_task"],
    false,
    a["task_duplication"],
    deadline_date,
    required_time,
    Number(a["number_of_imp_days"]),
    a["auto_scheduling"],
    new_specified_time,
    Number(a["unit_time"]) / 60,
    a["repeat_unit"],
    Number(a["importance"]),
    a["place"],
    a["color"],
    true
  );

  console.log(a);
  return new_task;
}

//キャンセルボタン
document.getElementById("cancel__btn").addEventListener("click", function () {
  if (edit_page == true) {
    window.location.href = "../constructor/detail.html";
  } else {
    window.location.href = "../constructor/index.html";
  }
});
