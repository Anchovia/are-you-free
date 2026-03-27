import { useRef, useState } from "react";
import Button from "./components/common/Button";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import EverytimeImageImportModal from "./components/modal/EverytimeImageImportModal";
import Timetable from "./components/Timetable";
import type { ClassInfo } from "./types/schedule";
import { analyzeEverytimeImage, timeStringToNumber } from "./utils/utils";

function App() {
    // 목록에 보여줄 시간표의 이름들을 저장하는 배열 (예: ["시간표 1", "시간표 2"])
    const [schedules, setSchedules] = useState<string[]>([]);
    // HTML에서 parse한 실제 수업 정보 객체들을 모아두는 배열 (<Timetable>에 전달)
    const [parsedClasses, setParsedClasses] = useState<ClassInfo[]>([]);
    const [showFreeTime, setShowFreeTime] = useState<boolean>(false);
    // <dialog> 태그 Ref
    const dialogRef = useRef<HTMLDialogElement>(null);

    // 이미지 업로드 핸들러
    const handleImageImport = (
        file: File,
        startHour: number,
        scheduleName: string
    ) => {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const results = analyzeEverytimeImage(img, startHour);

            if (results && results.length > 0) {
                // 받아온 이름을 그대로 사용!
                const convertedClasses: ClassInfo[] = results.map((result) => ({
                    fId: scheduleName, // 모달에서 사용자가 입력한 이름
                    day: result.day,
                    start: timeStringToNumber(result.startTime),
                    end: timeStringToNumber(result.endTime),
                }));

                setParsedClasses((prev) => [...prev, ...convertedClasses]);
                setSchedules((prev) => [...prev, scheduleName]); // 상단 뱃지용 이름 저장

                dialogRef.current?.close();
            } else {
                alert("수업 정보를 찾을 수 없습니다.");
            }
            URL.revokeObjectURL(imageUrl);
        };
        img.src = imageUrl;
    };

    return (
        <div className="flex flex-col bg-stroke min-h-screen">
            {/* 헤더 */}
            <Header dialogRef={dialogRef} />
            {/* 메인 */}
            <main className="p-10 flex-1 mx-auto w-full">
                <section className="flex flex-col gap-4 bg-white rounded-3xl shadow-lg min-h-175 p-6 max-w-10/12 mx-auto">
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
                            <Button
                                text={
                                    showFreeTime ? "공강 숨기기" : "공강 확인"
                                }
                                buttonColor={showFreeTime ? "accent" : "green"}
                                onClick={() => setShowFreeTime(!showFreeTime)}
                            />
                        </nav>
                    </article>

                    {/* 시간표 표시 부분 */}
                    {parsedClasses.length > 0 ? (
                        <Timetable
                            classes={parsedClasses}
                            showFreeTime={showFreeTime}
                        />
                    ) : (
                        <article className="h-150 flex flex-col items-center justify-center">
                            <h2>
                                에타 웹에서 공유받은 시간표 이미지를 붙여주세요!
                            </h2>
                        </article>
                    )}
                </section>
            </main>
            {/* 푸터 */}
            <Footer />
            {/* 모달 */}
            <EverytimeImageImportModal
                ref={dialogRef}
                onImport={handleImageImport}
            />
        </div>
    );
}

export default App;
