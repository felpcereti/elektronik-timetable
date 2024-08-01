import { Table, TableLesson, TimetableList } from "@wulkanowy/timetable-parser";
import { AllTimetables, Lesson, ParsedListsInfo, ParsedTeacher, PeopleData } from "types/parsedDataTypes.js";
import { completeTeachersData, parseList, parseOfficialsNamesAndSchoolFunctions } from "./dataParsers.js";


function loadSite(url: string) {
    return fetch(url).then(response=>response.text());
}


const url = "https://zse.rzeszow.pl/plan-lekcji";

const listURL = `${url}/lista.html`;
const tablesUrl = `${url}/plany`;






async function getAllLessons({classes, teachers, rooms}: ParsedListsInfo) {
    const lessons: Lesson[] = [];


    const cachedTimeTables: {[key: string]: TableLesson[][][]} = {}

    

    // get all lessons

    // eslint-disable-next-line no-restricted-syntax
    for(const {planId, id} of classes) {
        // eslint-disable-next-line no-await-in-loop
        const planHTML = await loadSite(`${tablesUrl}/o${planId}.html`);
        const days = new Table(planHTML).getDays();
        for(let dayIndex = 0; dayIndex < days.length; dayIndex++) {
            const day = days[dayIndex];
            for(let hourIndex = 0; hourIndex < day.length; hourIndex++) {
                const lessonHour = day[hourIndex];
                for(let subjectIndex = 0; subjectIndex < lessonHour.length; subjectIndex++) {
                    let {
                        // eslint-disable-next-line prefer-const
                        subject,
                        // eslint-disable-next-line prefer-const
                        room,
                        roomId,
                        // eslint-disable-next-line prefer-const
                        groupName,
                        teacher,
                        teacherId,
                        className,
                        classId
                    } = lessonHour[subjectIndex];

                    
                    if(!room) {
                        throw new Error(`Timetables can't be generated without full data (room name, teacher initial). Check class ${id} (${planId}), day ${dayIndex}, hour: ${hourIndex}, index: ${subjectIndex}.`);
                    }
                    
                    // there is no data about class in class plan because it is useless normally
                    className = id;
                    classId = planId;

                    roomId ??= rooms.find(x => x.roomName === room)?.planId ?? room;

                    if(!teacher) {
                        // there is a case when girls have PE and the teacher is not in class plan but it is in room plan
                        const key = `s${roomId}`;
                        if(!(key in cachedTimeTables)) {
                            // eslint-disable-next-line no-await-in-loop
                            const timetableHTML = await loadSite(`${tablesUrl}/s${roomId}.html`);
                            cachedTimeTables[key] = new Table(timetableHTML).getDays();
                        }
                        // search the same
                        teacher = cachedTimeTables[key][dayIndex][hourIndex]?.find(x => x.className === className)?.teacher;

                        if(!teacher) {
                            throw new Error(`Timetables can't be generated without full data (teacher initial). Check class ${id} (${planId}), day ${dayIndex}, hour: ${hourIndex}, index: ${subjectIndex}.`);
                        }

                    }

                    // teacher is just an initial
                    teacherId ??= teachers.find(x => x.initial === teacher)?.planId ?? teacher;
                    
                    
                    let group;
                    let groupMax;

                    if(groupName) {
                        [group, groupMax] = groupName.split("/");
                    }
                    
                    lessons.push({
                        dayIndex,
                        hourIndex,
                        // subjectIndex, // no point in having that as it will change anyways when rearanging timetable
                        subject,
                        group,
                        groupMax,
                        // room,
                        roomId,
                        // teacher,
                        teacherId,
                        // className,
                        classId
                    });
                }
            }
        }
    }
    return lessons;
}



function rearangeTimetables(lessons: Lesson[]) {
    const timetables: AllTimetables = {
        classes: {
            name: "Oddziały",
            timetables: {}
        },
        teachers: {
            name: "Nauczyciele",
            timetables: {}
        },
        rooms: {
            name: "Sale",
            timetables: {}
        },
        lessons: {
            name: "Lekcje",
            timetables: {}
        },
        mega: {
            name: "Mega",
            timetables: {}
        },
    };
    
    function pushLessonToTimeTable(timetableCategory: string, timetableId: string, timetableNameGetter: () => string, lesson: Lesson, lessonIndex: number) {
        if(!(timetableId in timetables[timetableCategory].timetables)) {
            timetables[timetableCategory].timetables[timetableId] = {
                name: timetableNameGetter(),
                days: []
            }
        }
        const timetableDays = timetables[timetableCategory].timetables[timetableId].days;
        let i = lesson.dayIndex + 1 - timetableDays.length;
        // eslint-disable-next-line no-plusplus
        while(i-- > 0) {
            timetableDays.push([]);
        }
        const dayHours = timetableDays[lesson.dayIndex];
        i = lesson.hourIndex + 1 - dayHours.length;
        // eslint-disable-next-line no-plusplus
        while(i-- > 0) {
            dayHours.push([]);
        }
        dayHours[lesson.hourIndex].push(lesson);
        // console.log(day, timetableDays, lesson);
        // process.exit()
    }


    lessons.forEach((lesson, index) => {
        pushLessonToTimeTable("classes", lesson.classId, () => {
            const classInfo = classes.find(x => x.planId === lesson.classId);
            return classInfo ? `${classInfo.id} ${classInfo.fieldOfStudy}` : lesson.classId;
        }, lesson, index);
        pushLessonToTimeTable("teachers", lesson.teacherId, () => {
            const teacherInfo = teachers?.find(x => x.planId === lesson.teacherId);
            return teacherInfo ? `${teacherInfo.fullName || teacherInfo.shortName}` : lesson.teacherId;
        }, lesson, index);
        // pushLessonToTimeTable("rooms", lesson.roomId, lesson, index);
        // pushLessonToTimeTable("lessons", lesson.subject, lesson, index);
        pushLessonToTimeTable("mega", "mega", () => "mega", lesson, index);
    });

    return timetables;
}

export default async function generateTimetables() {
    const teachersPageHTML = await loadSite("https://www.elektronik.rzeszow.pl/page?name=grono-pedagogiczne");

    const peopleData = parseOfficialsNamesAndSchoolFunctions(teachersPageHTML);

    // load lists and parse them
    const listHTML = await loadSite(listURL);
    const parsedListsInfo = parseList(new TimetableList(listHTML).getList());
    if(parsedListsInfo.teachers) completeTeachersData(parsedListsInfo.teachers, peopleData);

    const lessons = getAllLessons(parsedListsInfo);

} 

await writeFile("./fdd.json", JSON.stringify({lessons, timetables: rearangeTimetables(lessons)}, null, 2), "utf-8")
