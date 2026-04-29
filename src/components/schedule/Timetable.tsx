import { useMemo, useState } from "react";
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

    const [selectedFreeTime, setSelectedFreeTime] = useState<{
        day: number;
        start: number;
        end: number;
    } | null>(null);

    const [hoveredFreeTime, setHoveredFreeTime] = useState<{
        day: number;
        start: number;
        end: number;
    } | null>(null);

    const activeFreeTime = hoveredFreeTime || selectedFreeTime;

    const maxDay = useMemo(() => {
        return classes.reduce((max, c) => Math.max(max, c.day), 4);
    }, [classes]);

    const displayDays = ALL_DAYS.slice(0, Math.min(maxDay + 1, 7));
    const numCols = displayDays.length;

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

    const mergedClasses = useMemo(() => {
        const result: ClassInfo[] = [];

        for (const fId of uniqueFriends) {
            const personClasses = classes.filter((c) => c.fId === fId);

            for (let day = 0; day <= maxDay; day++) {
                const dayClasses = personClasses
                    .filter((c) => c.day === day)
                    .sort((a, b) => a.start - b.start);

                if (dayClasses.length === 0) continue;

                let currentBlock = { ...dayClasses[0] };

                for (let i = 1; i < dayClasses.length; i++) {
                    const nextBlock = dayClasses[i];

                    if (nextBlock.start <= currentBlock.end) {
                        currentBlock.end = Math.max(
                            currentBlock.end,
                            nextBlock.end
                        );
                    } else {
                        result.push(currentBlock);
                        currentBlock = { ...nextBlock };
                    }
                }
                result.push(currentBlock);
            }
        }
        return result;
    }, [classes, maxDay, uniqueFriends]);

    const renderFreeTimeOverlays = (dayIdx: number) => {
        if (!showFreeTime || uniqueFriends.length === 0) return null;

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
            .map((block, idx) => {
                const isClicked =
                    selectedFreeTime?.day === dayIdx &&
                    selectedFreeTime?.start === block.start &&
                    selectedFreeTime?.end === block.end;

                const isActive =
                    activeFreeTime?.day === dayIdx &&
                    activeFreeTime?.start === block.start &&
                    activeFreeTime?.end === block.end;

                const isOtherActive = activeFreeTime !== null && !isActive;

                return (
                    <div
                        key={`free-${idx}`}
                        onMouseEnter={() =>
                            setHoveredFreeTime({
                                day: dayIdx,
                                start: block.start,
                                end: block.end,
                            })
                        }
                        onMouseLeave={() => setHoveredFreeTime(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            // isClicked를 기준으로 선택 해제/지정
                            if (isClicked) {
                                setSelectedFreeTime(null);
                            } else {
                                setSelectedFreeTime({
                                    day: dayIdx,
                                    start: block.start,
                                    end: block.end,
                                });
                            }
                        }}
                        className={`absolute z-10 bg-[#a1f3be] shadow-md border border-emerald-200 flex flex-col items-center justify-center cursor-pointer transition-all rounded-lg duration-200 ${
                            isActive
                                ? "shadow-md opacity-100 z-20 scale-[1.01]"
                                : isOtherActive
                                  ? " opacity-30 hover:opacity-60"
                                  : " opacity-80 hover:opacity-100 hover:border-green-500"
                        }`}
                        style={{
                            top: `${(block.start - startHour) * hourHeight - (isActive ? 1 : 0)}px`,
                            height: `${(block.end - block.start) * hourHeight + (isActive ? 1 : 0)}px`,
                            left: "2px",
                            right: "2px",
                        }}
                    />
                );
            });
    };

    const isHourInActiveFreeTime = (hour: number) => {
        if (!activeFreeTime) return false;
        return hour >= activeFreeTime.start && hour < activeFreeTime.end;
    };

    return (
        <div
            id="timetable-capture-area"
            className="flex-1 overflow-auto p-2 lg:p-4"
            onClick={() => setSelectedFreeTime(null)}
        >
            <div className="bg-card rounded-xl border border-gray-200 shadow-sm w-full lg:min-w-full">
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
                <div
                    className="grid relative"
                    style={{
                        gridTemplateColumns: `60px repeat(${numCols}, minmax(0, 1fr))`,
                    }}
                >
                    <div className="left-0 z-30 border-r border-gray-200 bg-card shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)] relative">
                        {activeFreeTime && (
                            <div
                                className="absolute left-0 right-0 border border-gray-300 shadow-md pointer-events-none transition-all duration-300 z-20"
                                style={{
                                    top: `${(activeFreeTime.start - startHour) * hourHeight - 1}px`,
                                    height: `${(activeFreeTime.end - activeFreeTime.start) * hourHeight + 1}px`,
                                }}
                            />
                        )}

                        {hours.slice(0, -1).map((h) => {
                            const isHighlighted = isHourInActiveFreeTime(h);
                            const isAnyActive = activeFreeTime !== null;
                            return (
                                <div
                                    key={h}
                                    className={`h-15 flex items-start justify-center pt-1 text-[10px] lg:text-xs border-b border-gray-200 last:border-b-0 transition-all duration-300 ${
                                        isHighlighted
                                            ? "font-bold text-black opacity-100"
                                            : isAnyActive
                                              ? "text-muted-foreground opacity-30"
                                              : "text-muted-foreground opacity-100"
                                    }`}
                                >
                                    {h}시
                                </div>
                            );
                        })}
                    </div>

                    {displayDays.map((_, dIdx) => (
                        <div
                            key={`col-${dIdx}`}
                            className="relative border-l border-gray-200 border-r-0 z-10"
                        >
                            {hours.slice(0, -1).map((_, i) => (
                                <div
                                    key={`grid-${i}`}
                                    className="h-15 border-b border-gray-200"
                                ></div>
                            ))}
                            {renderFreeTimeOverlays(dIdx)}
                            {mergedClasses
                                .filter((c) => c.day === dIdx)
                                .map((c, i) => {
                                    const opacityClass = showFreeTime
                                        ? activeFreeTime
                                            ? "opacity-10"
                                            : "opacity-30"
                                        : "opacity-100";

                                    return (
                                        <div
                                            key={`${c.fId}-${i}`}
                                            className={`absolute rounded-lg px-1.5 lg:px-2 py-1 lg:py-1.5 overflow-hidden shadow-sm border border-transparent hover:border-primary/30 transition-all duration-300 cursor-default group z-20 hover:z-30 hover:shadow-lg ${opacityClass}`}
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
