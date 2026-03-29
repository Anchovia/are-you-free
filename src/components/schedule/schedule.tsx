import { FiImage, FiUpload } from "react-icons/fi";
import { useImageUpload } from "../../hooks/useImageUpload";
import type { ClassInfo } from "../../types/schedule";
import Timetable from "./Timetable";

interface ScheduleProps {
    parsedClasses: ClassInfo[];
    showFreeTime: boolean;
    schedules: string[];
    onImport: (file: File, scheduleName: string) => void;
    selectedSchedule: string | null;
}

export default function Schedule({
    parsedClasses,
    showFreeTime,
    schedules,
    onImport,
    selectedSchedule,
}: ScheduleProps) {
    const {
        isDragging,
        fileInputRef,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    } = useImageUpload({ schedules, onImport });

    return (
        <section className="flex flex-col bg-white rounded-2xl lg:rounded-3xl shadow-lg p-4 lg:p-6">
            {/* 시간표 표시 부분 */}
            {parsedClasses.length > 0 ? (
                <Timetable
                    classes={parsedClasses}
                    showFreeTime={showFreeTime}
                    selectedSchedule={selectedSchedule}
                />
            ) : (
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    htmlFor="schedule-empty-upload"
                    className={`h-120 lg:h-140 flex flex-col gap-4 items-center rounded-2xl justify-center border-2 border-dashed cursor-pointer transition-colors ${
                        isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    <input
                        id="schedule-empty-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <FiUpload className="size-12 lg:size-16 p-2.5 lg:p-3.5 text-gray-500 bg-gray-200 rounded-2xl" />
                    <div className="text-center">
                        <p className="text-base lg:text-lg font-bold">
                            시간표 이미지를 드래그하세요
                        </p>
                        <p className="text-sm lg:text-base text-gray-400">
                            또는 클릭하여 파일 선택
                        </p>
                    </div>
                    <span className="flex gap-2 items-center text-gray-400">
                        <FiImage />
                        <p className="text-xs lg:text-sm">PNG, JPG 지원</p>
                    </span>
                </label>
            )}
        </section>
    );
}
