import { useRef, useState } from "react";
import Button from "./components/common/Button";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import Modal from "./components/modal/EverytimeHtmlImportModal";
import Timetable from "./components/Timetable";
import { parseEverytimeHTML, type ClassInfo } from "./utils/utils";

function App() {
    // 목록에 보여줄 시간표의 이름들을 저장하는 배열 (예: ["시간표 1", "시간표 2"])
    const [schedules, setSchedules] = useState<string[]>([]);
    // HTML에서 parse한 실제 수업 정보 객체들을 모아두는 배열 (<Timetable>에 전달)
    const [parsedClasses, setParsedClasses] = useState<ClassInfo[]>([]);
    // <dialog> 태그 Ref
    const dialogRef = useRef<HTMLDialogElement>(null!);

    // HTML parse 요청 함수
    const handleImport = (text: string) => {
        if (!text.trim()) return;

        if (text.includes("<div") && text.includes("subject")) {
            const newClasses = parseEverytimeHTML(text, schedules.length + 1);
            if (newClasses.length > 0) {
                setParsedClasses((prev) => [...prev, ...newClasses]);
                setSchedules((prev) => [
                    ...prev,
                    `시간표 ${schedules.length + 1}`,
                ]);

                dialogRef.current?.close();
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
        <div className="flex flex-col bg-stroke min-h-screen">
            {/* 헤더 */}
            <Header dialogRef={dialogRef} />
            {/* 메인 */}
            <main className="p-10 flex-1 mx-auto w-full">
                <section className="flex flex-col gap-4 bg-white rounded-3xl shadow-lg min-h-175 p-6">
                    {/* 메인 헤더 */}
                    <article className="flex w-full">
                        {/* 시간표 목록 (예: 시간표 1, 시간표 2)*/}
                        <ul className="flex gap-2 flex-1">
                            {schedules.map((name, i) => (
                                <li
                                    key={i}
                                    className="flex items-center px-3 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"
                                >
                                    {name}
                                </li>
                            ))}
                        </ul>
                        {/* 버튼 */}
                        <nav className="flex">
                            <Button text="공강 확인" buttonColor="green" />
                        </nav>
                    </article>

                    {/* 시간표 표시 부분 */}
                    {parsedClasses.length > 0 ? (
                        <Timetable
                            classes={parsedClasses}
                            showFreeTime={false}
                        />
                    ) : (
                        <article className="h-150 flex flex-col items-center justify-center">
                            <h2>
                                에타 웹에서 공유받은 HTML 코드를 붙여주세요 !
                            </h2>
                        </article>
                    )}
                </section>
            </main>
            {/* 푸터 */}
            <Footer />
            {/* 모달 */}
            <Modal ref={dialogRef} onImport={handleImport} />
        </div>
    );
}

export default App;
