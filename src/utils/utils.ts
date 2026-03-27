import type { ImageClassInfo } from "../types/schedule";

export const analyzeEverytimeImage = (
    image: HTMLImageElement,
    startHour: number
): ImageClassInfo[] | null => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const width = image.width;
    const height = image.height;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    // 1. 이미지 전체의 픽셀 데이터를 한 번에 가져옴 (성능 최적화)
    const imageData = ctx.getImageData(0, 0, width, height).data;

    // 2. 측정된 상수값들
    const OFFSET_X = 60; // 좌측 시간축 너비 (월요일 시작점)
    const OFFSET_Y = 40; // 상단 요일축 높이 (첫 교시 시작점)
    const DAY_WIDTH = 180; // 요일별 가로 너비
    const HOUR_HEIGHT = 80; // 1시간당 세로 높이

    const results: ImageClassInfo[] = [];

    // 월(0) ~ 금(4) 탐색
    for (let day = 0; day < 5; day++) {
        // 각 요일 칸의 정중앙 X 좌표
        const scanX = Math.floor(OFFSET_X + day * DAY_WIDTH + DAY_WIDTH / 2);

        let isClassOngoing = false;
        let classStartPixelY = 0;
        let currentColor = "";

        // Y축을 위에서 아래로 1픽셀 단위 스캔
        for (let y = OFFSET_Y; y < height; y++) {
            // 1차원 배열에서 (scanX, y) 좌표의 RGB 값 추출
            const pixelIndex = (y * width + scanX) * 4;
            const r = imageData[pixelIndex];
            const g = imageData[pixelIndex + 1];
            const b = imageData[pixelIndex + 2];

            // 배경색(흰색) 및 보더색(회색) 판별 (JPEG 압축 노이즈 고려해 여유값 부여)
            const isWhite = r > 245 && g > 245 && b > 245;
            const isBorder =
                r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 5; // 무채색 옅은 회색

            if (!isWhite && !isBorder) {
                // 색상이 있는 픽셀 (수업 블록) 발견
                if (!isClassOngoing) {
                    isClassOngoing = true;
                    classStartPixelY = y;
                    currentColor = `rgb(${r},${g},${b})`;
                }
            } else {
                // 흰색 또는 보더 발견 (수업 종료 또는 공강)
                if (isClassOngoing) {
                    isClassOngoing = false;
                    const classEndPixelY = y;

                    // ✨ [수정된 부분 1] 5분 단위 스냅 적용
                    const rawStartMinutes =
                        ((classStartPixelY - OFFSET_Y) / HOUR_HEIGHT) * 60;
                    const rawEndMinutes =
                        ((classEndPixelY - OFFSET_Y) / HOUR_HEIGHT) * 60;

                    const snappedStart = Math.round(rawStartMinutes / 5) * 5;
                    const snappedEnd = Math.round(rawEndMinutes / 5) * 5;

                    const sHour = Math.floor(startHour + snappedStart / 60);
                    const sMin = snappedStart % 60;
                    const eHour = Math.floor(startHour + snappedEnd / 60);
                    const eMin = snappedEnd % 60;

                    results.push({
                        day,
                        startTime: `${sHour.toString().padStart(2, "0")}:${sMin.toString().padStart(2, "0")}`,
                        endTime: `${eHour.toString().padStart(2, "0")}:${eMin.toString().padStart(2, "0")}`,
                        color: currentColor,
                    });
                }
            }
        }

        // 예외 처리: 만약 이미지가 수업 블록 중간에서 딱 잘렸을 경우 (끝나는 여백이 없을 때)
        if (isClassOngoing) {
            const classEndPixelY = height; // 이미지 맨 밑바닥을 종료 지점으로 간주

            // ✨ [수정된 부분 2] 5분 단위 스냅 적용
            const rawStartMinutes =
                ((classStartPixelY - OFFSET_Y) / HOUR_HEIGHT) * 60;
            const rawEndMinutes =
                ((classEndPixelY - OFFSET_Y) / HOUR_HEIGHT) * 60;

            const snappedStart = Math.round(rawStartMinutes / 5) * 5;
            const snappedEnd = Math.round(rawEndMinutes / 5) * 5;

            const sHour = Math.floor(startHour + snappedStart / 60);
            const sMin = snappedStart % 60;
            const eHour = Math.floor(startHour + snappedEnd / 60);
            const eMin = snappedEnd % 60;

            results.push({
                day,
                startTime: `${sHour.toString().padStart(2, "0")}:${sMin.toString().padStart(2, "0")}`,
                endTime: `${eHour.toString().padStart(2, "0")}:${eMin.toString().padStart(2, "0")}`,
                color: currentColor,
            });
        }
    }

    return results;
};

export const timeStringToNumber = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
};
