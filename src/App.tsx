import { useEffect, useRef, useState } from "react";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import Schedule from "./components/schedule/schedule";
import ScheduleHeader from "./components/schedule/ScheduleHeader";
import type { ClassInfo } from "./types/schedule";
import { analyzeEverytimeImage } from "./utils/analyze";
import { timeStringToNumber } from "./utils/utils";

function App() {
    const [schedules, setSchedules] = useState<string[]>(() => {
        const savedSchedules = localStorage.getItem("mySchedules");
        return savedSchedules ? JSON.parse(savedSchedules) : [];
    });
    const [parsedClasses, setParsedClasses] = useState<ClassInfo[]>(() => {
        const savedClasses = localStorage.getItem("myTimetables");
        return savedClasses ? JSON.parse(savedClasses) : [];
    });
    const [showFreeTime, setShowFreeTime] = useState<boolean>(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [selectedSchedule, setSelectedSchedule] = useState<string | null>(
        null
    );

    const handleImageImport = (file: File, scheduleName: string) => {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = async () => {
            const results = await analyzeEverytimeImage(img);

            if (results && results.length > 0) {
                const convertedClasses: ClassInfo[] = results.map((result) => ({
                    fId: scheduleName,
                    day: result.day,
                    start: timeStringToNumber(result.startTime),
                    end: timeStringToNumber(result.endTime),
                }));

                setParsedClasses((prev) => [...prev, ...convertedClasses]);
                setSchedules((prev) => [...prev, scheduleName]);

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

    const handleRemoveSchedule = (nameToRemove: string) => {
        if (window.confirm(`'${nameToRemove}' 시간표를 제외하시겠습니까?`)) {
            setSchedules((prev) =>
                prev.filter((name) => name !== nameToRemove)
            );
            setParsedClasses((prev) =>
                prev.filter((c) => c.fId !== nameToRemove)
            );
        }
    };

    const handleRenameSchedule = (oldName: string, newName: string) => {
        setSchedules((prev) =>
            prev.map((name) => (name === oldName ? newName : name))
        );
        setParsedClasses((prev) =>
            prev.map((c) => (c.fId === oldName ? { ...c, fId: newName } : c))
        );
    };

    useEffect(() => {
        localStorage.setItem("myTimetables", JSON.stringify(parsedClasses));
        localStorage.setItem("mySchedules", JSON.stringify(schedules));
    }, [parsedClasses, schedules]);

    return (
        <div className="flex flex-col bg-gray-50 min-h-screen">
            <Header dialogRef={dialogRef} onReset={handleResetAll} />
            <main className="px-4 py-4 lg:py-6 flex-1 w-full">
                <div className="mx-auto w-full lg:max-w-2/3 flex flex-col gap-4 lg:gap-6">
                    <ScheduleHeader
                        schedules={schedules}
                        onRemoveSchedule={handleRemoveSchedule}
                        showFreeTime={showFreeTime}
                        onToggleFreeTime={() =>
                            setShowFreeTime((prev) => !prev)
                        }
                        onImport={handleImageImport}
                        onRenameSchedule={handleRenameSchedule}
                        selectedSchedule={selectedSchedule}
                        onSelectSchedule={setSelectedSchedule}
                    />
                    <Schedule
                        parsedClasses={parsedClasses}
                        showFreeTime={showFreeTime}
                        schedules={schedules}
                        onImport={handleImageImport}
                        selectedSchedule={selectedSchedule}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default App;
