import { app } from "./firebase_config.js";
import {
  doc,
  getDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { Task } from "../js/class_Task.js";

const user_id = localStorage.getItem("uid");
const db = getFirestore(app);

let uid = "testuid_getData";
const userRef = doc(db, "userData", user_id);
const docsnap = await getDoc(userRef);

// console.log(docsnap.data()[Object.keys(docsnap.data())[1]]);
// console.log([Object.keys(docsnap.data())[1]]);

export let all_tasks = [];

if (docsnap.data() != null) {
  for (let i = 0; i < Object.keys(docsnap.data()).length; i++) {
    let data = docsnap.data()[Object.keys(docsnap.data())[i]];
    let task;

    //コンストラクターのspecified_timeを除いた引数の数
    //統合後変えるよ！！！
    const number_of_parameter = 18;
    let for_times = (data.length - number_of_parameter) / 2;
    let arr_specified_time = [];
    for (let i = 0; i < for_times; i++) {
      arr_specified_time.push([
        data[number_of_parameter + i * 2],
        data[number_of_parameter + i * 2 + 1],
      ]);
    }
    task = new Task(
      data[0],
      data[1],
      data[2],
      data[3],
      data[4],
      data[5],
      data[6],
      data[7],
      data[8],
      data[9],
      data[10],
      data[11],
      arr_specified_time,
      data[12],
      data[13],
      data[14],
      data[15],
      data[16],
      data[17]
    );
    if (task.valid == true) {
      all_tasks.push(task);
    }
    // console.log(docsnap.data()[Object.keys(docsnap.data())[i]]);
  }
}

//data[8]가 널이 되는거 수정
