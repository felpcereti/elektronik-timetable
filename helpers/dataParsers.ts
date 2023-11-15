import { ListItem, List } from "@wulkanowy/timetable-parser"
import { ParsedClass, ParsedInfo, ParsedRoom, ParsedTeacher, PeopleData } from "types/parsedDataTypes";
import { load } from "cheerio";
import { ElementType } from "domelementtype";

function parseClasses(classes: ListItem[]): ParsedClass[] { // { name: '1a 1automatyk', value: '1' }, // It's not a mistake 1automatyk
    return classes.map(({ value: planId, name: originalValue }) => {
        const match = /((\d+)(\S+))\s+\d*(\S+)/.exec(originalValue);
        if (!match) throw new Error(`Couldn't parse class name "${originalValue}" from plan id "${planId}".`);
        const [, id, gradeStr, gradeIdentifier, fieldOfStudy] = match;
        const grade = parseInt(gradeStr, 10);

        return {
            planId,
            originalValue,
            id,  // identyfikator, 1a, 3a
            grade, // 12345
            gradeIdentifier, // a, k
            fieldOfStudy, // informatyk, elektronik, automatyk
        }
    })
}

function parseTeachers(teachers: ListItem[]): ParsedTeacher[] { // { name: 'I.Nazwisko (IN)', value: '1' } // inicjał jest kompletnie losowy może być dwoma literami nazwiska
    return teachers.map(({ value: planId, name: originalValue }) => {
        const match = /(\S)\.(\S+)\s+\((\S+)\)/.exec(originalValue);
        if (!match) throw new Error(`Couldn't parse teacher name "${originalValue}" from plan id "${planId}".`);
        const [, firstLetterOfFirstName, lastName, initial] = match;
        const shortName = `${firstLetterOfFirstName}.${lastName}`;

        return {
            planId,
            originalValue,
            shortName,
            firstLetterOfFirstName, // I
            lastName, // Nazwisko
            initial // IN
        }
    })
}

export function parseOfficialsNamesAndSchoolFunctions(siteHTML: string) {
    const $ = load(siteHTML);
    // const tables = $("table");
    // $("table thead tr th")
    
    const people = $("table tbody tr");
    
    const peopleData: PeopleData = {}; 

    people.each((i, el) => {
        if(el.type === ElementType.Tag) {
            let fullName = "";

            el.childNodes.forEach(node => {
                if(node.type === ElementType.Tag && node.firstChild?.type === ElementType.Text) {

                    if(!fullName) {
                        fullName = node.firstChild.data;
                    } else {
                        const personfunctions = node.firstChild.data.split(", "); // /,\s*/
                        const split = fullName.split(" ");
                        if(split[0] === "ks.") { // ks. Imię Nazwisko 
                            personfunctions.push("ksiądz" /* xionc */); // i'm too lazy to add another object variable called "title"
                            split.shift();
                            split.pop(); // "MS" idk what's that
                            split.reverse(); // Imię Nazwisko -> Nazwisko Imię - read next line
                        }
                        const [lastName, firstName] = split;
                        peopleData[`${firstName[0]}.${lastName}`.toLowerCase()] = {
                            firstName,
                            lastName,
                            personfunctions
                        };
                    }

                }
            })

        } 
    })
    return peopleData;
}
export function completeTeachersData(teachers: ParsedTeacher[], peopleData: PeopleData) {
    teachers.forEach(teacher => {
        const personData = peopleData[teacher.shortName.toLowerCase()];
        if(personData) {
            teacher.teacherFunctions = personData.personfunctions;
            teacher.firstName = personData.firstName;
            teacher.fullName = `${teacher.firstName} ${teacher.lastName}`;
        } else {
            console.log(`couldn't find ${teacher.shortName}`);
        }
    })
}

function parseRooms(teachers: ListItem[]): ParsedRoom[] { // { name: '4a Pracownia oprogramowania', value: '1' },
    return teachers.map(({ value: planId, name: originalValue }) => {
        const match = /(\S+)\s+(.+)/.exec(originalValue);
        if (!match) throw new Error(`Couldn't parse room name "${originalValue}" from plan id "${planId}".`);
        const [, id, roomName] = match;

        return {
            planId,
            originalValue,
            id, // 4a
            roomName // Pracownia oprogramowania
        }
    })
}

export function parseList({ classes, teachers, rooms }: List): ParsedInfo {
    if (!teachers || !rooms) throw new Error("There is no teachers or rooms list");

    return {
        classes: parseClasses(classes),
        teachers: parseTeachers(teachers),
        rooms: parseRooms(rooms)
    }
}

