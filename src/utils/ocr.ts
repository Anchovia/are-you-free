import { createWorker, PSM } from "tesseract.js";

// 시간표 좌측 상단(첫 번째 시간) 라벨 영역만 잘라내기
export const extractStartHourImage = (
    image: HTMLImageElement,
    offsetX: number,
    offsetY: number,
    hourHeight: number,
    isDarkMode: boolean
): HTMLCanvasElement => {
    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });

    // 1. 인식률 향상을 위해 이미지 스케일 업 (3배 확대)
    const scale = 3;
    cropCanvas.width = offsetX * scale;
    cropCanvas.height = hourHeight * scale;

    if (cropCtx) {
        cropCtx.imageSmoothingEnabled = true;

        cropCtx.drawImage(
            image,
            0,
            offsetY,
            offsetX,
            hourHeight,
            0,
            0,
            offsetX * scale,
            hourHeight * scale
        );

        const imageData = cropCtx.getImageData(
            0,
            0,
            cropCanvas.width,
            cropCanvas.height
        );
        const data = imageData.data;

        // 2-2. 극단적 이진화 대신, 다크모드면 반전(Invert)만 하고 그레이스케일로 변환
        for (let i = 0; i < data.length; i += 4) {
            let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

            if (isDarkMode) {
                // 어두운 배경은 밝게(255에 가깝게), 밝은 글씨는 어둡게(0에 가깝게) 반전
                brightness = 255 - brightness;
            }

            // RGB를 동일하게 맞춰서 흑백(Grayscale) 이미지로 변환 (글씨의 부드러운 테두리는 유지됨)
            data[i] = brightness; // R
            data[i + 1] = brightness; // G
            data[i + 2] = brightness; // B
        }

        cropCtx.putImageData(imageData, 0, 0);
    }

    return cropCanvas;
};

// 잘라낸 캔버스에서 시작 시간(숫자) 추출
export const detectStartHourWithOCR = async (
    cropCanvas: HTMLCanvasElement
): Promise<number | null> => {
    try {
        const worker = await createWorker("eng");

        await worker.setParameters({
            tessedit_char_whitelist: "0123456789",
            tessedit_pageseg_mode: PSM.SINGLE_LINE,
        });

        const {
            data: { text },
        } = await worker.recognize(cropCanvas);

        await worker.terminate();

        console.log("OCR 원본 인식 결과:", text);

        const match = text.match(/\d+/);

        if (match) {
            const parsedHour = parseInt(match[0], 10);

            // 1시~24시 사이의 정상적인 시간인지 검증
            if (!isNaN(parsedHour) && parsedHour > 0 && parsedHour <= 24) {
                return parsedHour;
            }
        }

        return null; // 인식 실패 시 null
    } catch (error) {
        console.error("OCR 분석 중 에러:", error);
        return null;
    }
};
