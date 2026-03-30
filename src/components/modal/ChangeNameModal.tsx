import { useEffect, useState } from "react";

interface ChangeNameModalProps {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    editingName: string;
    schedules: string[];
    onClose: () => void;
    onRename: (oldName: string, newName: string) => void;
}

export default function ChangeNameModal({
    dialogRef,
    editingName,
    schedules,
    onClose,
    onRename,
}: ChangeNameModalProps) {
    const [newName, setNewName] = useState("");

    useEffect(() => {
        setNewName(editingName);
    }, [editingName]);

    const isRenameDisabled =
        !newName.trim() ||
        newName === editingName ||
        schedules.includes(newName.trim());

    const handleSubmit = () => {
        if (!isRenameDisabled) {
            onRename(editingName, newName.trim());
            onClose();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            onClose();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            className="w-[90%] lg:w-full max-w-lg p-5 lg:p-6 m-auto bg-white shadow-xl rounded-2xl backdrop:bg-black/50 open:animate-in open:fade-in open:zoom-in-95"
        >
            <div className="flex flex-col gap-5 lg:gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">
                        시간표 이름 변경 (친구 이름)
                    </label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !isRenameDisabled) {
                                handleSubmit();
                            }
                        }}
                        placeholder="예) 홍길동"
                        className="w-full p-2.5 lg:p-3 text-sm border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 mt-1 lg:mt-2">
                    <button
                        className="flex-1 py-2.5 lg:py-3 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isRenameDisabled}
                        className="flex-1 py-2.5 lg:py-3 font-bold text-white bg-blue-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        변경
                    </button>
                </div>
            </div>
        </dialog>
    );
}
