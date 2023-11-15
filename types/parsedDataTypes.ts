
export interface PersonData {
    firstName: string;
    lastName: string;
    personfunctions: string[];

}
export interface PeopleData {
    [shortName: string]: PersonData;
}

interface Info {
    /**
     * Plan id.
     */
    planId: string;

    /**
     * original value from list
     * ? - parser will still parse the input even without the member [grade?]
     * Examples:
     * class: `[grade][gradeIdentifier] [grade?][fieldOfStudy]` 1a 1informatyk 
     * teacher: I.Nazwisko (IN)
     * room: 4a Pracownia oprogramowania
     */
    originalValue: string;
}

export interface ParsedClass extends Info {
    /**
     * Unique class identificator.
     * 
     * chodzę do 1a
     * 
     * 1a, 3a, 5as
     */
    id: string;
    /**
     * grade
     * 
     * Chodzę do pierwszej klasy
     * 
     * 1, 3, 5
     */
    grade: number;
    /**
     * The grade identifier
     * 
     * A: Chodzę do pierwszej klasy.
     * 
     * B: Której?
     * 
     * A: a
     * 
     * a, a, as
     */
    gradeIdentifier: string;

    /**
     * informatyk, elektronik, automatyk
     */
    fieldOfStudy: string;
}

export interface ParsedTeacher extends Info {

    /**
     * I.Nazwisko
     */
    shortName: string;
    /**
     * Imię Nazwisko
     */
    fullName?: string;

    /**
     * I.Nazwisko (IN)
     * 
     * I
     */
    firstLetterOfFirstName: string;

    /**
     * if the data unifier finds matching teacher short name (without the initial) between school teachers page and school timetable
     * it will output full name in teacher data
     * Imię
     */
    firstName?: string;
    
    /**
     * I.Nazwisko (IN)
     * 
     * Nazwisko
     */
    lastName: string;
    /**
     * I.Nazwisko (IN)
     * 
     * IN
     */
    initial: string;

    
    /**
     * język angielski,
     * kierownik internatu,
     * wychowawca,
     * pedagog szkolny
     */
    teacherFunctions?: string[];
}


export interface ParsedRoom extends Info {
    /**
     * 4a Pracownia oprogramowania
     * 
     * 4a
     */
    id: string;
    /**
     * 4a Pracownia oprogramowania
     * 
     * Pracownia oprogramowania
     */
    roomName: string;
}

export interface ParsedInfo {
    classes: ParsedClass[];
    teachers: ParsedTeacher[];
    rooms: ParsedRoom[];
}

export interface Lesson {
    dayIndex: number;
    hourIndex: number;

    subject: string;

    /**
     * Group isn't just a number!
     * Well mostly it is but sometimes in replacements
     * there is a group called `rel_u`.
     * `rel_u` group is for people who don't attend religion classes or vice versa.
     */ 
    group?: string;
    groupMax?: string;

    // room: string;
    roomId: string;
    
    

    // teacher: string;
    teacherId: string;
    // className: string;
    classId: string;
}

export interface Timetable {
    name: string;
    days: Lesson[][][];
}

export interface Timetables {
    [id: string]: Timetable
}

export interface TimeTableGroup {
    name: string;
    timetables: Timetables;
}

export interface AllTimetables {
    [category: string]: TimeTableGroup
}