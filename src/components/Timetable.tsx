import { useMemo } from "react";
import type { ClassInfo } from "../types/schedule";

interface TimetableProps {
    classes: ClassInfo[];
    showFreeTime: boolean;
}

// 사람(fId)별로 적용할 파스텔 톤 색상 배열
const FRIEND_COLORS = [
    "bg-blue-100 border-blue-400 text-blue-900",
    "bg-rose-100 border-rose-400 text-rose-900",
    "bg-emerald-100 border-emerald-400 text-emerald-900",
    "bg-amber-100 border-amber-400 text-amber-900",
    "bg-purple-100 border-purple-400 text-purple-900",
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

    // 친구(인원) 기준 고유 목록 (가로 배치용)
    const uniqueFriends = useMemo(() => {
        return Array.from(new Set(classes.map((c) => c.fId)));
    }, [classes]);

    // fId를 기준으로 고유한 색상을 반환하는 함수!
    const getFriendColor = (fId: string) => {
        const index = uniqueFriends.indexOf(fId);
        return FRIEND_COLORS[index % FRIEND_COLORS.length];
    };

    // 시간(소수점)을 "00시 00분" 텍스트로 예쁘게 바꿔주는 헬퍼 함수
    const formatTimeText = (time: number) => {
        const h = Math.floor(time);
        const m = Math.round((time - h) * 60);
        return m === 0 ? `${h}시` : `${h}시 ${m}분`;
    };

    const renderFreeTimeOverlays = (dayIdx: number) => {
        if (!showFreeTime || uniqueFriends.length === 0) return null;

        // 1. 해당 요일의 수업들을 시작 시간 기준으로 오름차순 정렬합니다.
        const dayClasses = classes
            .filter((c) => c.day === dayIdx)
            .sort((a, b) => a.start - b.start);

        const freeBlocks: { start: number; end: number }[] = [];
        let currentTime = startHour;

        // 2. 수업들을 순회하며 빈 시간을 찾아 덩어리(Block)로 묶습니다.
        for (const c of dayClasses) {
            if (currentTime < c.start) {
                // 현재 시간부터 다음 수업 시작 전까지가 공강!
                freeBlocks.push({ start: currentTime, end: c.start });
            }
            // 겹치는 수업이 있을 수 있으므로 제일 늦게 끝나는 시간으로 업데이트
            currentTime = Math.max(currentTime, c.end);
        }

        // 3. 마지막 수업이 끝난 후부터 자정(endHour) 전까지의 공강 추가
        if (currentTime < endHour) {
            freeBlocks.push({ start: currentTime, end: endHour });
        }

        // 4. 합쳐진 공강 덩어리들을 화면에 그립니다.
        return freeBlocks.map((block, idx) => {
            // 너무 짧은 공강(예: 30분 미만)은 글씨를 숨기거나 안 그릴 수도 있습니다.
            // 여기서는 일단 다 그립니다!
            return (
                <div
                    key={`free-${idx}`}
                    className="absolute w-full bg-green-200/50 pointer-events-none z-10 flex flex-col items-center justify-center border-2 border-green-400 box-border rounded-md shadow-sm"
                    style={{
                        top: `${(block.start - startHour) * hourHeight}px`,
                        height: `${(block.end - block.start) * hourHeight}px`,
                    }}
                >
                    {/* 공강 시간 텍스트 뱃지 */}
                    <div className="bg-white/80 px-3 py-1.5 rounded-lg text-center shadow-sm backdrop-blur-sm">
                        <span className="block text-green-800 font-extrabold text-sm border-b border-green-200 pb-0.5 mb-0.5">
                            {days[dayIdx]}
                        </span>
                        <span className="block text-green-700 font-bold text-xs">
                            {formatTimeText(block.start)} ~{" "}
                            {formatTimeText(block.end)}
                        </span>
                    </div>
                </div>
            );
        });
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
                                                className={`absolute border-l-4 rounded-sm p-1.5 overflow-hidden transition-all duration-300 hover:z-20 hover:shadow-md cursor-default z-10 ${getFriendColor(c.fId)}`}
                                                style={{
                                                    top: `${(c.start - startHour) * hourHeight}px`,
                                                    height: `${(c.end - c.start) * hourHeight}px`,
                                                    left: `${fIndex * widthPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    boxShadow:
                                                        "inset 0 0 0 1px rgba(0,0,0,0.05)",
                                                }}
                                                title={`[${c.fId}]`}
                                            >
                                                {/* 유저 이름 */}
                                                <div className="font-bold text-[10px] sm:text-[11px] leading-tight break-all line-clamp-2">
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
