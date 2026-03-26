import { useState } from "react";
import Button from "./components/Button";
import Timetable from "./components/Timetable";

interface ClassInfo {
    fId: string;
    title: string;
    day: number;
    start: number;
    end: number;
    room: string;
}

function App() {
    const [schedules, setSchedules] = useState<string[]>([]);
    const [parsedClasses, setParsedClasses] = useState<ClassInfo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rawText, setRawText] = useState("");

    // 💡 HTML 전용 파서 함수
    const parseEverytimeHTML = (htmlString: string): ClassInfo[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        const results: ClassInfo[] = [];

        // 에브리타임 요일별 열(.cols)을 찾습니다.
        const columns = doc.querySelectorAll(".cols");

        columns.forEach((col, dayIndex) => {
            if (dayIndex > 4) return; // 월~금만 처리

            const subjects = col.querySelectorAll(".subject");
            subjects.forEach((subject) => {
                const title =
                    subject.querySelector("h3")?.textContent || "수업";
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
                        fId: `User ${schedules.length + 1}`,
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

    const handleImport = () => {
        if (!rawText.trim()) return;

        // HTML 태그가 포함되어 있는지 확인
        if (rawText.includes("<div") && rawText.includes("subject")) {
            const newClasses = parseEverytimeHTML(rawText);
            if (newClasses.length > 0) {
                setParsedClasses((prev) => [...prev, ...newClasses]);
                setSchedules((prev) => [
                    ...prev,
                    `시간표 ${schedules.length + 1}`,
                ]);
                setRawText("");
                setIsModalOpen(false);
            } else {
                alert("HTML 구조에서 수업 정보를 찾을 수 없습니다.");
            }
        } else {
            alert(
                "에브리타임 '요소 복사(Copy Element)'를 통해 얻은 HTML 코드를 넣어주세요!"
            );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold text-blue-600">너 시간 돼?</h1>
                <div className="flex gap-2">
                    <Button
                        text="HTML 데이터 넣기"
                        onClick={() => setIsModalOpen(true)}
                    />
                </div>
            </header>

            <main className="p-6 flex-1 max-w-6xl mx-auto w-full">
                <div className="bg-white rounded-3xl shadow-lg min-h-[700px] p-6">
                    <ul className="flex gap-2 mb-4">
                        {schedules.map((name, i) => (
                            <li
                                key={i}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"
                            >
                                {name}
                            </li>
                        ))}
                    </ul>
                    {parsedClasses.length > 0 ? (
                        <Timetable
                            classes={parsedClasses}
                            showFreeTime={false}
                        />
                    ) : (
                        <div className="h-[600px] flex items-center justify-center text-gray-400">
                            에타 웹에서 'Copy Element' 한 HTML 코드를
                            붙여넣으세요.
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 flex flex-col gap-4">
                        <h2 className="text-lg font-bold">
                            에브리타임 데이터 붙여넣기
                        </h2>
                        <p className="text-sm text-gray-500">
                            에타 웹 - 개발자 도구 -{" "}
                            <code>&lt;div class="wrap"&gt;</code> 우클릭 -{" "}
                            <b>Copy element</b> 후 붙여넣으세요.
                        </p>
                        <textarea
                            className="w-full h-80 p-4 border rounded-xl text-xs font-mono bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="<div class='wrap'>... 내용을 여기에 붙여넣으세요"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold"
                                onClick={() => setIsModalOpen(false)}
                            >
                                취소
                            </button>
                            <button
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
                                onClick={handleImport}
                            >
                                분석 및 추가
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
