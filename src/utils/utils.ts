// src/utils.ts

// App.tsx에 있던 인터페이스를 이쪽으로 옮겨서 export 해줍니다.
export interface ClassInfo {
    fId: string;
    title: string;
    day: number;
    start: number;
    end: number;
    room: string;
}

// 💡 HTML 전용 파서 함수 (scheduleIndex 매개변수 추가)
export const parseEverytimeHTML = (
    htmlString: string,
    scheduleIndex: number
): ClassInfo[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const results: ClassInfo[] = [];

    // 에브리타임 요일별 열(.cols)을 찾습니다.
    const columns = doc.querySelectorAll(".cols");

    columns.forEach((col, dayIndex) => {
        if (dayIndex > 4) return; // 월~금만 처리

        const subjects = col.querySelectorAll(".subject");
        subjects.forEach((subject) => {
            const title = subject.querySelector("h3")?.textContent || "수업";
            const room = subject.querySelector("p span")?.textContent || "";

            // style 속성에서 위치(top)와 높이(height) 추출
            const style = subject.getAttribute("style") || "";
            const topMatch = style.match(/top:\s*(\d+)px/);
            const heightMatch = style.match(/height:\s*(\d+)px/);

            if (topMatch && heightMatch) {
                const top = parseInt(topMatch[1]);
                const height = parseInt(heightMatch[1]);

                // 에타 기준: 50px = 1시간 (오전 0시부터 시작)
                const start = top / 50;
                const end = (top + height) / 50;

                results.push({
                    fId: `User ${scheduleIndex}`, // 매개변수로 받은 값을 사용합니다.
                    title: title.trim(),
                    room: room.trim(),
                    day: dayIndex,
                    start: start,
                    end: end,
                });
            }
        });
    });
    return results;
};
