import { forwardRef, useState } from "react";

interface EverytimeHtmlImportModalProps {
    onImport: (text: string) => void;
}

const EverytimeHtmlImportModal = forwardRef<
    HTMLDialogElement,
    EverytimeHtmlImportModalProps
>(({ onImport }, ref) => {
    const [rawText, setRawText] = useState("");

    const handleImportClick = () => {
        onImport(rawText);
        setRawText(""); // 전달 후 입력창 비우기
    };

    const handleCloseClick = () => {
        setRawText(""); // 취소할 때도 입력창 비우기
        if (ref && "current" in ref) {
            ref.current?.close();
        }
    };

    return (
        <dialog
            ref={ref}
            className="bg-white m-auto rounded-2xl w-full max-w-2xl p-6 backdrop:bg-black/50 shadow-xl open:animate-in open:fade-in open:zoom-in-95"
        >
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">
                    에브리타임 데이터 붙여넣기
                </h2>
                <p className="text-sm text-gray-500">
                    에타 웹 - 개발자 도구 -{" "}
                    <code>&lt;div class="wrap"&gt;</code> 우클릭 -{" "}
                    <b>Copy element</b> 후 붙여넣으세요.
                </p>
                <textarea
                    className="w-full h-80 p-4 border rounded-xl text-xs font-mono bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="<div class='wrap'>... 내용을 여기에 붙여넣으세요"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                />
                <div className="flex gap-2">
                    <button
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-bold"
                        onClick={handleCloseClick}
                    >
                        취소
                    </button>
                    <button
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
                        onClick={handleImportClick}
                    >
                        분석 및 추가
                    </button>
                </div>
            </div>
        </dialog>
    );
});

export default EverytimeHtmlImportModal;
