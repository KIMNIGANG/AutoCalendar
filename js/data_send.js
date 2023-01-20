import { app } from "./firebase_config.js";
import { all_tasks } from "./get_tasks.js";
import { uuidv4 } from "./create_uuid.js";

import {
  collection,
  getDocs,
  getDoc,
  getDocFromCache,
  setDoc,
  doc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const user_id = localStorage.getItem("uid");
const db = getFirestore(app);
const userRef = doc(db, "userData", user_id);
const docsnap = await getDoc(userRef);

const test_add_btn = document.getElementById("test_add");

// let e = all_tasks[0];

// document.getElementById("time").innerHTML = docsnap.data().予定;
// document.getElementById("schedule").innerHTML = docs nap.data().時間;

let promiseCount = 0;

export function firebase_send(AllTask, edit_page) {
  let docData = {};
  AllTask.forEach((e) => {
    console.log(AllTask);
    let plan_or_task;
    if (e.plan_or_task == 0) {
      plan_or_task = "Plan";
    } else {
      plan_or_task = "Task";
    }
    docData[e.id] = [
      e.id,
      e.name,
      e.category,
      e.overview,
      e.favorite,
      plan_or_task,
      e.finished,
      e.duplicate,
      e.deadline,
      e.required_time / (1000 * 60 * 60),
      e.days,
      e.auto_scheduled,
      e.unit_time / (1000 * 60 * 60),
      e.repeat_unit,
      e.importance,
      e.place,
      e.color,
      e.valid,
    ];
    e.task_children.forEach((e) => {
      docData[e.id].push(e.specified_time[0]);
      docData[e.id].push(e.specified_time[1]);
    });
    setDoc(doc(db, "userData", user_id), docData)
      .then(() => {
        promiseCount++;
        if (promiseCount == AllTask.length) {
          if (edit_page == true) {
            window.location.href = "../constructor/detail.html";
          } else {
            window.location.href = "../constructor/index.html";
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
    console.log(e);
  });
}
