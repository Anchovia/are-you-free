export interface ClassInfo {
    fId: string;
    day: number;
    start: number;
    end: number;
}

export interface ImageClassInfo {
    day: number;
    startTime: string; // "HH:MM" 형식
    endTime: string; // "HH:MM" 형식
    color: string; // "rgb(R,G,B)" 형식
}
