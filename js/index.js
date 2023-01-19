import { all_tasks } from "./get_tasks.js";
import { Task } from "../js/class_Task.js";
import { User } from "../js/class_User.js";
import { Schedule } from "../js/class_Schedule.js";
import { Settings } from "../js/class_Settings.js";
import { timestampToDisplay, colorChange } from "../js/common.js";
import { firebase_send } from "./data_send.js";

//(KIM)ユーザー情報を取得
//////////////////////////////////////////////////////////////////////
//(仮)ローカルにユーザー情報を作成
var mySchedule = new Schedule([], [], []);
var user = new User(null, null, null, null, mySchedule, null);
//////////////////////////////////////////////////////////////////////

// 締め切り過ぎたタスクがあるかどうか
var deadlineOver = false;

//未完了タスクの一覧表示
//Taskの配列から表示
document.getElementById("task_list_container").innerHTML = "";
//実施日順にソート
all_tasks.sort(function (a, b) {
  return a.task_children[0].specified_time[0] > b.task_children[0].specified_time[0] ? 1 : -1;
});
for (const task of all_tasks) {
  if (task.valid == true) {
    var task_container_container = document.createElement("div");
    var task_container = document.createElement("div");
    var checkbox_container = document.createElement("div");
    task_container.setAttribute("id", task.id.toString());
    task_container_container.classList.add("task_container_container");
    task_container.classList.add("task_container");
    checkbox_container.classList.add("checkbox_container");
    task_container.innerHTML = `
        <h5>${task.name}</h5>
            `;

    console.log(task.task_children[task.task_children.length - 1]);
    
    // 締め切りを過ぎたタスクがどれかを分かるようにする.
    if (task.deadline != null) {
      if (task.task_children[task.task_children.length - 1].specified_time[1] > task.deadline) {
        task_container.innerHTML += `
            <h5> (締め切り過ぎたタスク) </h5>
                `;
        deadlineOver = true;
      }
    }
    

    console.log(task.name + " " + task.color);

    //お気に入り
    if (task.favorite == true) {
      task_container.innerHTML += `
    <img class="star" src="../img/star.png" />
                      `;
    }

    let number_of_child = 0;

    if (task.repeat_unit != "null") {  // 繰り返しの予定の場合には簡潔な文章にする.
      for (const child of task.task_children) {
        switch (child.repeat_unit) {
          case "day":
            let time_0_day = timestampToDisplay(child.specified_time[0], 2);
            let time_1_day = timestampToDisplay(child.specified_time[1], 2);
            let time_0_day_String = time_0_day["hour"] + ":" + time_0_day["minute"];
            let time_1_day_String = time_1_day["hour"] + ":" + time_1_day["minute"];
            task_container.innerHTML += `
            <p>実施日：毎日 ${time_0_day_String}~${time_1_day_String}</p>
                `;
            break;
          case "week":
            let time_0_week = timestampToDisplay(child.specified_time[0], 2);
            let time_1_week = timestampToDisplay(child.specified_time[1], 2);
            let time_0_week_String = time_0_week["hour"] + ":" + time_0_week["minute"];
            let time_1_week_String = time_1_week["hour"] + ":" + time_1_week["minute"];
            let day = "";
            switch ((new Date(child.specified_time[0])).getDay()) {
              case 0:
                day = "日曜";
                break;
              case 1:
                day = "月曜";
                break;
              case 2:
                day = "火曜";
                break;
              case 3:
                day = "水曜";
                break;
              case 4:
                day = "木曜";
                break;
              case 5:
                day = "金曜";
                break;
              case 6:
                day = "土曜";
                break;
              default:
                break;
            }
            task_container.innerHTML += `
            <p>実施日：毎週${day} ${time_0_week_String}~${time_1_week_String}</p>
                `;
            break;
          case "month":
            break;
          case "year":
              break;
          default:
              break;
        }
      }
    }
    else {
      for (const child of task.task_children) {
        ++number_of_child;
        let time_0 = timestampToDisplay(child.specified_time[0]);
        let time_1 = timestampToDisplay(child.specified_time[1]);
  
        task_container.innerHTML += `
        <p>実施日${number_of_child}：${time_0}~${time_1}</p>
              `;
      }
      if (task.deadline != null) {
        let time_d = timestampToDisplay(task.deadline);
        task_container.innerHTML += `
         <p>締切日：${time_d}</p>
         `;
      }
    }

    task_container_container.style.backgroundColor = colorChange(task.color);
    task_container_container.appendChild(task_container);

    //完了
    if (task.finished == false) {
      checkbox_container.innerHTML += `
    <input type="checkbox" class="checkbox_finished" id="${task.id}_finished"/>
                      `;
    } else {
      checkbox_container.innerHTML += `
    <input type="checkbox" class="checkbox_finished" id="${task.id}_finished" checked/>
                      `;
    }
    task_container_container.appendChild(checkbox_container);

    if (task.finished == false) {
      document.getElementById("task_list_container").appendChild(task_container_container);
    } else {
      document.getElementById("finished_task_list_container").appendChild(task_container_container);
    }

  }

}

for (const task of all_tasks) {
  if (task.valid == true) {
    //詳細ボタンがクリックされたときに、セッションにそのタスクidを保存してから、detail.htmlへ移動
    document
      .getElementById(task.id.toString())
      .addEventListener("click", function () {
        window.sessionStorage.setItem(["selected_task_id"], [task.id.toString()]);
        window.location.href = "../constructor/detail.html";
      });

    //完了処理
    document
      .getElementById(task.id.toString() + "_finished")
      .addEventListener("click", function () {
        if (document.getElementById(task.id.toString() + "_finished").checked) {
          task.finished = true;
        } else {
          task.finished = false;
        }
        firebase_send(all_tasks);
      });
  }
}

// 締め切りを過ぎているタスクがある場合には, 警告メッセージを出す.
// スケジュールの変更を促す.
// (果たして, このやり方でユーザは満足するだろうか...)
if (deadlineOver) {
     alert("締め切りを過ぎたタスクがあります!!" + "\n" + "タスクの変更をしましょう!!");
}

// //完了処理
// for (const task of all_tasks) {
//   if (task.valid == true) {
//     // document
//     //   .getElementById(task.id.toString() + "_finished")
//     //   .addEventListener("mouseenter", function () {
//     //     document.getElementById(task.id.toString()).style.cursor = "none";
//     //   });

//     // document
//     //   .getElementById(task.id.toString() + "_finished")
//     //   .addEventListener("mouseleave", function () {
//     //     document.getElementById(task.id.toString()).style.cursor = "pointer";
//     //   });

//     document
//       .getElementById(task.id.toString() + "_finished")
//       .addEventListener("click", function () {
//         task.finished = document
//           .getElementById(task.id.toString() + "_finished")
//           .value;
//         firebase_send(updated_tasks);
//       });
//   }
// }
