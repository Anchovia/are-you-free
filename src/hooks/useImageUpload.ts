import { useRef, useState } from "react";

interface UseImageUploadProps {
    schedules: string[];
    onImport: (file: File, scheduleName: string) => void;
    onSuccess?: () => void;
}

export function useImageUpload({
    schedules,
    onImport,
    onSuccess,
}: UseImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("이미지 파일만 업로드 가능합니다.");
            return;
        }

        const scheduleName = file.name.split(".")[0];

        if (schedules.includes(scheduleName)) {
            alert(
                "이미 존재하는 이름입니다. 파일명을 변경한 후 다시 시도해주세요!"
            );
            return;
        }

        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(imageUrl);
            onImport(file, scheduleName);
            if (onSuccess) onSuccess();
        };

        img.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            alert("이미지 파일을 읽는 중 오류가 발생했습니다.");
        };

        img.src = imageUrl;

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    return {
        isDragging,
        fileInputRef,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
