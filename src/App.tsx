import { useEffect, useRef, useState } from "react";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import EverytimeImageImportModal from "./components/modal/EverytimeImageImportModal";
import Schedule from "./components/schedule/schedule";
import type { ClassInfo } from "./types/schedule";
import { analyzeEverytimeImage } from "./utils/analyze";
import { timeStringToNumber } from "./utils/utils";

function App() {
    // 목록에 보여줄 시간표의 이름들을 저장하는 배열 (예: ["시간표 1", "시간표 2"])
    const [schedules, setSchedules] = useState<string[]>(() => {
        const savedSchedules = localStorage.getItem("mySchedules");
        return savedSchedules ? JSON.parse(savedSchedules) : [];
    });
    // HTML에서 parse한 실제 수업 정보 객체들을 모아두는 배열 (<Timetable>에 전달)
    const [parsedClasses, setParsedClasses] = useState<ClassInfo[]>(() => {
        const savedClasses = localStorage.getItem("myTimetables");
        return savedClasses ? JSON.parse(savedClasses) : [];
    });
    const [showFreeTime, setShowFreeTime] = useState<boolean>(false);
    // <dialog> 태그 Ref
    const dialogRef = useRef<HTMLDialogElement>(null);

    // 이미지 업로드 핸들러
    const handleImageImport = (file: File, scheduleName: string) => {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = async () => {
            const results = await analyzeEverytimeImage(img);

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

    const handleResetAll = () => {
        if (window.confirm("저장된 모든 시간표 데이터를 지우시겠습니까?")) {
            localStorage.clear();
            setSchedules([]);
            setParsedClasses([]);
        }
    };

    // 특정 시간표만 삭제하는 함수
    const handleRemoveSchedule = (nameToRemove: string) => {
        if (window.confirm(`'${nameToRemove}' 시간표를 제외하시겠습니까?`)) {
            // 1. 상단 뱃지 목록에서 제거
            setSchedules((prev) =>
                prev.filter((name) => name !== nameToRemove)
            );
            // 2. 시간표 렌더링 목록에서 해당 친구(fId)의 수업 싹 다 제거
            setParsedClasses((prev) =>
                prev.filter((c) => c.fId !== nameToRemove)
            );
        }
    };

    useEffect(() => {
        localStorage.setItem("myTimetables", JSON.stringify(parsedClasses));
        localStorage.setItem("mySchedules", JSON.stringify(schedules));
    }, [parsedClasses, schedules]);

    return (
        <div className="flex flex-col bg-stroke min-h-screen">
            <Header dialogRef={dialogRef} onReset={handleResetAll} />
            <main className="p-10 flex-1 mx-auto w-full">
                <Schedule
                    schedules={schedules}
                    parsedClasses={parsedClasses}
                    showFreeTime={showFreeTime}
                    setShowFreeTime={setShowFreeTime}
                    onRemoveSchedule={handleRemoveSchedule}
                />
            </main>
            <Footer />
            <EverytimeImageImportModal
                ref={dialogRef}
                existingSchedules={schedules}
                onImport={handleImageImport}
            />
        </div>
    );
}

export default App;
