import { useMemo } from "react";

interface ClassInfo {
    fId: string;
    title: string;
    day: number;
    start: number;
    end: number;
    room: string;
}

interface TimetableProps {
    classes: ClassInfo[];
    showFreeTime: boolean;
}

// 🎨 과목별로 적용할 10가지 파스텔 톤 색상
const SUBJECT_COLORS = [
    "bg-blue-100 border-blue-400 text-blue-900",
    "bg-rose-100 border-rose-400 text-rose-900",
    "bg-emerald-100 border-emerald-400 text-emerald-900",
    "bg-amber-100 border-amber-400 text-amber-900",
    "bg-purple-100 border-purple-400 text-purple-900",
    "bg-indigo-100 border-indigo-400 text-indigo-900",
    "bg-cyan-100 border-cyan-400 text-cyan-900",
    "bg-orange-100 border-orange-400 text-orange-900",
    "bg-lime-100 border-lime-400 text-lime-900",
    "bg-pink-100 border-pink-400 text-pink-900",
];

export default function Timetable({ classes, showFreeTime }: TimetableProps) {
    const days = ["월요일", "화요일", "수요일", "목요일", "금요일"];
    const startHour = 7;
    const endHour = 23;
    const hours = Array.from(
        { length: endHour - startHour + 1 },
        (_, i) => i + startHour
    );
    const hourHeight = 60;

    // 1. 과목명 기준 고유 목록 (색상 배정용)
    const uniqueTitles = useMemo(() => {
        return Array.from(new Set(classes.map((c) => c.title)));
    }, [classes]);

    // 2. 친구(인원) 기준 고유 목록 (가로 배치용)
    const uniqueFriends = useMemo(() => {
        return Array.from(new Set(classes.map((c) => c.fId)));
    }, [classes]);

    // 💡 과목명에 따라 고정된 색상을 반환
    const getSubjectColor = (title: string) => {
        const index = uniqueTitles.indexOf(title);
        return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
    };

    const renderFreeTimeOverlays = (dayIdx: number) => {
        if (!showFreeTime || uniqueFriends.length === 0) return null;

        const dayClasses = classes.filter((c) => c.day === dayIdx);
        const freeBlocks = [];

        for (let time = startHour; time < endHour; time += 0.5) {
            const isBusy = dayClasses.some(
                (c) => time >= c.start && time < c.end
            );
            if (!isBusy) freeBlocks.push(time);
        }

        return freeBlocks.map((time, idx) => (
            <div
                key={`free-${idx}`}
                className="absolute w-full bg-green-300 opacity-40 pointer-events-none z-0"
                style={{
                    top: `${(time - startHour) * hourHeight}px`,
                    height: `${hourHeight / 2}px`,
                }}
            />
        ));
    };

    return (
        <div
            id="timetable-capture-area"
            className="flex-1 overflow-auto bg-white rounded-xl relative"
        >
            <div className="flex border border-gray-200">
                {/* Y축 (시간) */}
                <div className="w-16 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col sticky left-0 z-20">
                    <div className="h-12 border-b border-gray-200 bg-gray-50/90 backdrop-blur sticky top-0 z-30"></div>
                    {hours.slice(0, -1).map((h) => (
                        <div
                            key={h}
                            className="flex border-b border-gray-200"
                            style={{ height: `${hourHeight}px` }}
                        >
                            <span className="w-full flex justify-center items-center text-xs font-semibold text-gray-500">
                                {String(h).padStart(2, "0")}시
                            </span>
                        </div>
                    ))}
                </div>

                {/* X축 (요일) 및 수업 블록 */}
                <div className="flex-1 flex">
                    {days.map((day, dIdx) => (
                        <div
                            key={day}
                            className="flex-1 flex flex-col min-w-[140px] border-r border-gray-100 relative group"
                        >
                            <div className="h-12 border-b border-gray-200 bg-white/90 backdrop-blur flex items-center justify-center font-bold text-gray-700 sticky top-0 z-30 shadow-sm">
                                {day}
                            </div>

                            <div
                                className="relative flex-1"
                                style={{
                                    height: `${(endHour - startHour) * hourHeight}px`,
                                }}
                            >
                                {hours.slice(0, -1).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-full border-b border-gray-100 border-dashed"
                                        style={{
                                            top: `${(i + 1) * hourHeight}px`,
                                            height: "1px",
                                        }}
                                    />
                                ))}

                                {renderFreeTimeOverlays(dIdx)}

                                {classes
                                    .filter((c) => c.day === dIdx)
                                    .map((c, i) => {
                                        const fIndex = uniqueFriends.indexOf(
                                            c.fId
                                        );
                                        const widthPercent =
                                            100 / uniqueFriends.length;

                                        return (
                                            <div
                                                key={`${c.fId}-${i}`}
                                                className={`absolute border-l-4 rounded-sm p-1.5 overflow-hidden transition-all duration-300 hover:z-20 hover:shadow-md cursor-default z-10 ${getSubjectColor(c.title)}`}
                                                style={{
                                                    top: `${(c.start - startHour) * hourHeight}px`,
                                                    height: `${(c.end - c.start) * hourHeight}px`,
                                                    left: `${fIndex * widthPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    boxShadow:
                                                        "inset 0 0 0 1px rgba(0,0,0,0.05)",
                                                }}
                                                title={`[${c.fId}]\n과목: ${c.title}\n장소: ${c.room || "미정"}`}
                                            >
                                                {/* 과목명 */}
                                                <div className="font-bold text-[10px] sm:text-[11px] leading-tight break-all line-clamp-2">
                                                    {c.title}
                                                </div>
                                                {/* 누가 듣는 수업인지 이름 표시 */}
                                                <div className="text-[9px] mt-1 font-medium opacity-60 truncate">
                                                    {c.fId}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-30 pointer-events-none z-0 transition-opacity"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
