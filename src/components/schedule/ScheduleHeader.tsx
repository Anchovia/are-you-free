import { useRef, useState } from "react";
import { FaEdit, FaTimes } from "react-icons/fa";
import {
    FiChevronDown,
    FiChevronUp,
    FiImage,
    FiUpload,
    FiUsers,
} from "react-icons/fi";
import { useImageUpload } from "../../hooks/useImageUpload";
import Button from "../common/Button";
import ChangeNameModal from "../modal/ChangeNameModal";

interface ScheduleHeaderProps {
    schedules: string[];
    onRemoveSchedule: (name: string) => void;
    showFreeTime: boolean;
    onToggleFreeTime: () => void;
    onImport: (file: File, scheduleName: string) => void;
    onRenameSchedule: (oldName: string, newName: string) => void;
}

const colors = ["border-l-purple-200", "border-l-red-100", "border-l-blue-100"];

export default function ScheduleHeader({
    schedules,
    onRemoveSchedule,
    showFreeTime,
    onToggleFreeTime,
    onImport,
    onRenameSchedule,
}: ScheduleHeaderProps) {
    const [openUpload, setOpenUpload] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    const handleCloseModal = () => {
        if (dialogRef && "current" in dialogRef) {
            dialogRef.current?.close();
        }
    };

    const [editingName, setEditingName] = useState(""); // 현재 수정 중인 기존 이름

    // 훅 적용
    const {
        isDragging,
        fileInputRef,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    } = useImageUpload({
        schedules,
        onImport,
        onSuccess: () => setOpenUpload(false), // 성공 시 업로드 창 닫기
    });

    return (
        <section className="flex flex-col w-full gap-4 lg:gap-6">
            <div className="flex w-full items-center justify-between">
                {/* 인원수 표시 및 드롭다운 토글 버튼 */}
                <button
                    onClick={() => setIsListOpen(!isListOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <span className="text-xs lg:text-sm flex items-center gap-1.5 text-gray-700 font-medium">
                        <FiUsers className="text-gray-500" />
                        {`${schedules.length} 명`}
                    </span>
                    {/* 열림/닫힘 상태에 따라 화살표 방향 변경 */}
                    {isListOpen ? (
                        <FiChevronUp className="text-sm lg:text-base text-gray-400" />
                    ) : (
                        <FiChevronDown className="text-sm lg:text-base text-gray-400" />
                    )}
                </button>

                {/* 버튼들 (우측 정렬) */}
                <nav className="flex gap-2 lg:gap-3">
                    {schedules.length > 0 && (
                        <Button
                            text="시간표 추가"
                            buttonColor="gray"
                            buttonType="add"
                            onClick={() => setOpenUpload(!openUpload)}
                        />
                    )}

                    <Button
                        text={showFreeTime ? "공강 숨기기" : "공강 보기"}
                        buttonColor={showFreeTime ? "red" : "green"}
                        buttonType="vision"
                        onClick={onToggleFreeTime}
                    />
                </nav>
            </div>
            {isListOpen && schedules.length > 0 && (
                <ul className="flex gap-2 flex-wrap">
                    {schedules.map((name, i) => (
                        <li
                            key={i}
                            className={`flex items-center px-3 py-1.5 rounded-full font-medium gap-1 border-l-4 ${
                                colors[i % colors.length]
                            } border border-gray-200 bg-white  transition-colors`}
                        >
                            <FaEdit
                                onClick={() => {
                                    setEditingName(name);
                                    dialogRef.current?.showModal();
                                }}
                                className="text-gray-500 text-xs cursor-pointer hover:text-blue-500"
                            />
                            <span className="text-gray-600 text-xs">
                                {name}
                            </span>
                            <button
                                className="text-gray-400 hover:text-red-500 text-xs cursor-pointer ml-1 p-1"
                                onClick={() => onRemoveSchedule(name)}
                            >
                                <FaTimes />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <ChangeNameModal
                dialogRef={dialogRef}
                editingName={editingName}
                schedules={schedules}
                onClose={handleCloseModal}
                onRename={onRenameSchedule}
            />
            {/* 드래그 앤 드롭 / 클릭 업로드 영역 */}
            {openUpload && schedules.length > 0 && (
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    htmlFor="file-upload"
                    className={`flex flex-col gap-3 lg:gap-4 items-center justify-center w-full h-48 lg:h-60 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                        isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                >
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <FiUpload
                        className={`size-12 lg:size-16 p-2 lg:p-3 rounded-2xl ${
                            isDragging
                                ? "text-blue-500 bg-blue-100"
                                : "text-gray-500 bg-gray-200"
                        }`}
                    />
                    <div className="text-center">
                        <p className="text-base lg:text-lg font-bold text-gray-800">
                            시간표 이미지를 드래그하세요
                        </p>
                        <p className="text-sm lg:text-base text-gray-400 mt-1 lg:mt-0">
                            또는 클릭하여 파일 선택
                        </p>
                    </div>
                    <span className="flex gap-2 items-center text-gray-400 mt-1 lg:mt-0">
                        <FiImage />
                        <p className="text-xs lg:text-sm">PNG, JPG 지원</p>
                    </span>
                </label>
            )}
        </section>
    );
}
