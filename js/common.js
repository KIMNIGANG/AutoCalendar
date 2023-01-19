import { Task } from "../js/class_Task.js";

//timestampを表示の形にする
//1:文字列,2:配列 
export function timestampToDisplay(ts, op = 1) {
    var time_d = new Date(ts);
    var year_d = time_d.getFullYear();
    var month_d = time_d.getMonth() + 1;
    var date_d = time_d.getDate();
    var hour_d = time_d.getHours();
    var minute_d = time_d.getMinutes();

    //なんでfor使えないんじゃ？
    if (month_d < 10) {
        month_d = "0" + month_d;
    }

    if (date_d < 10) {
        date_d = "0" + date_d;
    }

    if (hour_d < 10) {
        hour_d = "0" + hour_d;
    }

    if (minute_d < 10) {
        minute_d = "0" + minute_d;
    }

    if (op == 1) {
        return year_d + "/" + month_d + "/" + date_d + "/" + hour_d + ":" + minute_d;
    } else if (op == 2) {
        return { "year": year_d, "month": month_d, "date": date_d, "hour": hour_d, "minute": minute_d };
    }
}

// Taskクラスを配列に戻す
export function taskToArray(task) {
    let a = {};

    a.auto_scheduling = task.auto_scheduled;
    a.category = task.category;
    a.color = task.color;
    a.importance = task.importance;
    a.favorite = task.favorite;
    a.overview = task.overview;
    a.place = task.place;
    a.task_duplication = task.duplicate;
    a.title = task.name;

    a.number_of_imp_days = task.task_children.length;
    a.unit_time = task.unit_time / (1000 * 60);

    if (task.plan_or_task == 0) {
        a.plan_or_task = "Plan";
    } else {
        a.plan_or_task = "Task";
    }

    if (task.deadline) {
        var time = timestampToDisplay(task.deadline, 2);
        a.deadline_date = time.year + "-" + time.month + "-" + time.date;
        a.deadline_hour = time.hour;
        a.deadline_minute = time.minute;
    }

    let count = 0;
    for (let child of task.task_children) {
        ++count;
        var time_0 = timestampToDisplay(child.specified_time[0], 2);
        var time_1 = timestampToDisplay(child.specified_time[1], 2);

        a["imp_date_" + count] = time_0.year + "-" + time_0.month + "-" + time_0.date;
        a["imp_start_hour_" + count] = time_0.hour;
        a["imp_start_minute_" + count] = time_0.minute;
        a["imp_end_hour_" + count] = time_1.hour;
        a["imp_end_minute_" + count] = time_1.minute;
    }

    if (task.required_time) {
        a.len_minute = (task.required_time / (1000 * 60)) % 60;
        a.len_hour = ((task.required_time / (1000 * 60)) - a.len_minute) / 60;

        if (a.len_hour < 10) {
            a.len_hour = "0" + a.len_hour;
        }

        if (a.len_minute < 10) {
            a.len_minute = "0" + a.len_minute;
        }
    }

    a.number_of_children = task.task_children.length;

    return a;
}

//色変換
export function colorChange(color) {
    switch (color) {
        case "red":
            return "#EBCFD1";
        case "orange":
            return "#F5E3CE";
        case "yellow":
            return "#FDF9D8";
        case "green":
            return "#E2E8CD";
        case "blue":
            return "#E0EDFF";
        case "purple":
            return "#D0DFF9";
        default:
            return "#777777";  // 真っ黒
    }
}