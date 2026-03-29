import { useMemo } from "react";
import type { ClassInfo } from "../../types/schedule";

interface TimetableProps {
    classes: ClassInfo[];
    showFreeTime: boolean;
    selectedSchedule: string | null;
}

const FRIEND_COLORS_HEX = [
    "#d3e5fd", // blue ~110
    "#fdddf0", // pink ~110
    "#d4fbe3", // green ~110
    "#fef1bb", // yellow ~110
    "#f0e1ff", // purple ~110
];

const FRIEND_COLORS_HEX_DARK = [
    "#c2d7fa", // blue ~170
    "#fbc7de", // pink ~170
    "#bdf3d2", // green ~170
    "#fde28f", // yellow ~170
    "#e6d2ff", // purple ~170
];

const ALL_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function Timetable({
    classes,
    showFreeTime,
    selectedSchedule,
}: TimetableProps) {
    const startHour = 7;
    const endHour = 23;
    const hours = Array.from(
        { length: endHour - startHour + 1 },
        (_, i) => i + startHour
    );
    const hourHeight = 60;

    // 1. 최대 요일(day) 값을 찾아 표시할 요일의 개수를 결정합니다.
    const maxDay = useMemo(() => {
        return classes.reduce((max, c) => Math.max(max, c.day), 4);
    }, [classes]);

    const displayDays = ALL_DAYS.slice(0, Math.min(maxDay + 1, 7));
    const numCols = displayDays.length;

    // 친구(인원) 기준 고유 목록
    const uniqueFriends = useMemo(() => {
        return Array.from(new Set(classes.map((c) => c.fId)));
    }, [classes]);

    const getFriendColorHex = (fId: string) => {
        const index = uniqueFriends.indexOf(fId);
        const isSelected = selectedSchedule === fId;
        return isSelected
            ? FRIEND_COLORS_HEX_DARK[index % FRIEND_COLORS_HEX_DARK.length]
            : FRIEND_COLORS_HEX[index % FRIEND_COLORS_HEX.length];
    };

    // ★ 추가된 로직: 같은 사람(fId), 같은 요일(day)의 연속/겹치는 시간을 하나의 블록으로 병합
    const mergedClasses = useMemo(() => {
        // 병합된 결과를 담을 배열
        const result: ClassInfo[] = [];

        // 사람별로 그룹화
        for (const fId of uniqueFriends) {
            const personClasses = classes.filter((c) => c.fId === fId);

            // 사람별로 요일 순회
            for (let day = 0; day <= maxDay; day++) {
                // 해당 사람의 특정 요일 수업들을 시작 시간 기준으로 정렬
                const dayClasses = personClasses
                    .filter((c) => c.day === day)
                    .sort((a, b) => a.start - b.start);

                if (dayClasses.length === 0) continue;

                // 병합 로직
                let currentBlock = { ...dayClasses[0] };

                for (let i = 1; i < dayClasses.length; i++) {
                    const nextBlock = dayClasses[i];

                    // 다음 블록의 시작 시간이 현재 블록의 끝 시간보다 작거나 같으면 (겹치거나 연속됨)
                    if (nextBlock.start <= currentBlock.end) {
                        // 끝 시간을 더 큰 값으로 갱신하여 병합
                        currentBlock.end = Math.max(
                            currentBlock.end,
                            nextBlock.end
                        );
                    } else {
                        // 이어지지 않는다면 현재 블록을 결과에 넣고, 새로운 블록을 시작
                        result.push(currentBlock);
                        currentBlock = { ...nextBlock };
                    }
                }
                // 마지막 남은 블록을 결과에 추가
                result.push(currentBlock);
            }
        }
        return result;
    }, [classes, maxDay, uniqueFriends]);

    const renderFreeTimeOverlays = (dayIdx: number) => {
        if (!showFreeTime || uniqueFriends.length === 0) return null;

        // 공강 계산은 원본 classes 혹은 mergedClasses 둘 다 상관없지만,
        // 전체 수업을 기준으로 빈 시간을 찾는 것이므로 mergedClasses를 사용해 조금 더 최적화
        const dayClasses = mergedClasses
            .filter((c) => c.day === dayIdx)
            .sort((a, b) => a.start - b.start);

        const freeBlocks: { start: number; end: number }[] = [];
        let currentTime = startHour;

        for (const c of dayClasses) {
            if (currentTime < c.start) {
                freeBlocks.push({ start: currentTime, end: c.start });
            }
            currentTime = Math.max(currentTime, c.end);
        }

        if (currentTime < endHour) {
            freeBlocks.push({ start: currentTime, end: endHour });
        }

        return freeBlocks
            .filter((block) => block.end - block.start >= 1)
            .map((block, idx) => (
                <div
                    key={`free-${idx}`}
                    className="absolute z-10 rounded-lg  bg-gray-300/70 flex flex-col items-center justify-center pointer-events-none"
                    style={{
                        top: `${(block.start - startHour) * hourHeight}px`,
                        height: `${(block.end - block.start) * hourHeight}px`,
                        left: "4px",
                        right: "4px",
                    }}
                />
            ));
    };

    return (
        <div
            id="timetable-capture-area"
            className="flex-1 overflow-auto p-2 lg:p-4"
        >
            <div className="bg-card rounded-xl border border-gray-200 shadow-sm w-full lg:min-w-full">
                {/* 헤더 행 (시간 + 요일) */}
                <div
                    className="grid border-b border-gray-200 bg-gray-50"
                    style={{
                        gridTemplateColumns: `60px repeat(${numCols}, minmax(0, 1fr))`,
                    }}
                >
                    <div className="sticky left-0 z-40 bg-gray-50 p-2 lg:p-3 text-center text-xs font-medium text-muted-foreground border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">
                        시간
                    </div>
                    {displayDays.map((day) => (
                        <div
                            key={day}
                            className="p-2 lg:p-3 text-center text-xs lg:text-sm font-semibold text-foreground border-l border-gray-200 first:border-l-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 본문 행 */}
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `60px repeat(${numCols}, minmax(0, 1fr))`,
                    }}
                >
                    {/* Y축 (시간) */}
                    <div className="sticky left-0 z-30 border-r border-gray-200 bg-card shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">
                        {hours.slice(0, -1).map((h) => (
                            <div
                                key={h}
                                className="h-15 flex items-start justify-center pt-1 text-[10px] lg:text-xs text-muted-foreground border-b border-gray-200 last:border-b-0"
                            >
                                {h}시
                            </div>
                        ))}
                    </div>

                    {/* X축 (요일별 컬럼) */}
                    {displayDays.map((_, dIdx) => (
                        <div
                            key={`col-${dIdx}`}
                            className="relative border-l border-gray-200 border-r-0"
                        >
                            {/* 배경 그리드 선 */}
                            {hours.slice(0, -1).map((_, i) => (
                                <div
                                    key={`grid-${i}`}
                                    className="h-15 border-b border-gray-200"
                                ></div>
                            ))}

                            {/* 공강 시간 렌더링 */}
                            {renderFreeTimeOverlays(dIdx)}

                            {/* 수업 블록 렌더링 (★원본 classes 대신 mergedClasses 사용) */}
                            {mergedClasses
                                .filter((c) => c.day === dIdx)
                                .map((c, i) => {
                                    return (
                                        <div
                                            key={`${c.fId}-${i}`}
                                            className="absolute rounded-lg px-1.5 lg:px-2 py-1 lg:py-1.5 overflow-hidden shadow-sm border border-transparent hover:border-primary/30 transition-all cursor-default group z-10 hover:z-20 hover:shadow-lg"
                                            style={{
                                                top: `${(c.start - startHour) * hourHeight}px`,
                                                height: `${(c.end - c.start) * hourHeight}px`,
                                                left: "2px",
                                                right: "2px",
                                                backgroundColor:
                                                    getFriendColorHex(c.fId),
                                            }}
                                            title={`[${c.fId}]`}
                                        ></div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
