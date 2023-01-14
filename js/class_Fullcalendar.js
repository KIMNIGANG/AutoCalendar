import { computeShrinkWidth } from "fullcalendar";
import { FullCalendar } from "../dist/index.global.js"
import { all_tasks } from "./get_tasks.js";

class DrawCalendar{
    constructor(all_tasks) {
        let tasks = [];
        for (const task of all_tasks) {
            for (const child of task.task_children) {
                let event = {
                    title: child.name,
                    start: child.specified_time[0],
                    end: child.specified_time[1],
                    editable: child.auto_scheduled,
                    overlap: child.duplicate,
                }
                switch (child.color) {
                    case "red":
                        event.color = "brown";
                        break;
                    case "orange":
                        event.color = "darkorange";
                        break;
                    case "yellow":
                        event.color = "khaki";
                        break;
                    case "green":
                        event.color = "darkgreen";
                        break;
                    case "blue":
                        event.color = "cornflowerblue";
                        break;
                    case "purple":
                        event.color = "slateblue";
                        break;
                    default:
                        event.color = "darkgray";
                    
                }
                switch (child.repeat_unit) {
                    case "day":
                        event.dow = [child.specified_time[0].getDay()];
                        break;
                    case "week":
                        event.dow = [child.specified_time[0].getDay()];
                        break;
                    case "month":
                        break;
                    case "year":
                          break;
                    default:
                          break;
                }

                tasks.push(event);
            }
        }

        console.log(tasks);
        

        var calendarEl = document.getElementById('calendar');
        // カレンダーのサイズ
        calendarEl.style.margin = "5%";

        var calendar = new FullCalendar.Calendar(calendarEl, {
            
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek_Today,timeGridDay,listMonth'
            },
            views: { // 今日を開始日とした1週間の表示
                timeGridWeek_Today: {
                    type: 'timeGrid',
                    duration: { days: 7 },
                    buttonText: 'Week'
                }
            },
            navLinks: true, // can click day/week names to navigate views
            editable: true,
            selectable: true,
            nowIndicator: true,
            events: tasks,
            eventTimeFormat: { hour: '2-digit', minute: '2-digit' },
        });

        calendar.render();
    }
}

//ページ更新時に実行
var calendar = new DrawCalendar(all_tasks);
