import type { ImageClassInfo } from "../types/schedule";

// "HH:MM" 문자열을 숫자 시간(예: 9.5)으로 변환
export const timeStringToNumber = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60;
};

// 좌상단 샘플 픽셀로 다크/라이트 테마 추정
export const detectDarkMode = (
    imageData: Uint8ClampedArray,
    width: number
): boolean => {
    const sampleX = 2;
    const sampleY = 2;
    const sampleIndex = (sampleY * width + sampleX) * 4;
    const r = imageData[sampleIndex];
    const g = imageData[sampleIndex + 1];
    const b = imageData[sampleIndex + 2];
    return r + g + b < 300;
};

// 테마별 임계값으로 배경/보더 픽셀 여부 판별
export const isBackgroundOrBorder = (
    r: number,
    g: number,
    b: number,
    isDarkMode: boolean
): boolean => {
    if (isDarkMode) {
        return (
            r < 70 &&
            g < 70 &&
            b < 70 &&
            Math.abs(r - g) < 10 &&
            Math.abs(g - b) < 10
        );
    }

    const isWhite = r > 245 && g > 245 && b > 245;
    const isBorder = r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 5;
    return isWhite || isBorder;
};

// 픽셀 구간을 시간 문자열로 변환해 결과 객체 생성
export const createImageClassInfo = (
    day: number,
    classStartPixelY: number,
    classEndPixelY: number,
    offsetY: number,
    hourHeight: number,
    startHour: number,
    color: string
): ImageClassInfo => {
    const rawStartMinutes = ((classStartPixelY - offsetY) / hourHeight) * 60;
    const rawEndMinutes = ((classEndPixelY - offsetY) / hourHeight) * 60;

    // 이미지 노이즈를 줄이기 위해 5분 단위로 스냅
    const snappedStart = Math.round(rawStartMinutes / 5) * 5;
    const snappedEnd = Math.round(rawEndMinutes / 5) * 5;

    const sHour = Math.floor(startHour + snappedStart / 60);
    const sMin = snappedStart % 60;
    const eHour = Math.floor(startHour + snappedEnd / 60);
    const eMin = snappedEnd % 60;

    return {
        day,
        startTime: `${sHour.toString().padStart(2, "0")}:${sMin.toString().padStart(2, "0")}`,
        endTime: `${eHour.toString().padStart(2, "0")}:${eMin.toString().padStart(2, "0")}`,
        color,
    };
};

// 1차원 RGBA 배열에서 (x, y)의 RGB만 추출
type RGB = { r: number; g: number; b: number };
export const getPixelRgb = (
    imageData: Uint8ClampedArray,
    width: number,
    x: number,
    y: number
): RGB => {
    const idx = (y * width + x) * 4;
    return {
        r: imageData[idx],
        g: imageData[idx + 1],
        b: imageData[idx + 2],
    };
};

// Border 색상 범위
const isGridBorderPixel = (
    r: number,
    g: number,
    b: number,
    isDarkMode: boolean
): boolean => {
    const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
    if (!isGray) return false;

    if (isDarkMode) {
        return r >= 38 && r <= 78;
    }

    return r >= 225 && r <= 239;
};

// (startX,startY)에서 오른쪽으로 가며 처음 만나는 보더 = OFFSET_X
export const detectOffsetXFromTopLeft = (
    imageData: Uint8ClampedArray,
    width: number,
    isDarkMode: boolean,
    startX: number,
    startY: number
): number => {
    for (let x = startX; x < width; x++) {
        const idx = (startY * width + x) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        if (isGridBorderPixel(r, g, b, isDarkMode)) {
            return x;
        }
    }

    return 60;
};

// (startX,startY)에서 아래로 가며 처음 만나는 보더 = OFFSET_Y
export const detectOffsetYFromTopLeft = (
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    isDarkMode: boolean,
    startX: number,
    startY: number
): number => {
    for (let y = startY; y < height; y++) {
        const idx = (y * width + startX) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        if (isGridBorderPixel(r, g, b, isDarkMode)) {
            return y;
        }
    }

    return 60;
};

// (offsetX+1, 5)에서 오른쪽으로 탐색해서 "수직 보더 두께" 측정
export const detectVerticalBorderThickness = (
    imageData: Uint8ClampedArray,
    width: number,
    isDarkMode: boolean,
    offsetX: number
): number => {
    const startX = offsetX;
    const y = 5;
    let thickness = 0;

    for (let x = startX; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        if (!isGridBorderPixel(r, g, b, isDarkMode)) break;
        thickness++;
    }

    return thickness;
};

// (5, offsetY+1)에서 아래로 탐색해서 "수평 보더 두께" 측정
export const detectHorizontalBorderThickness = (
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    isDarkMode: boolean,
    offsetY: number
): number => {
    const x = 15;
    const startY = offsetY;
    let thickness = 0;

    for (let y = startY; y < height; y++) {
        const idx = (y * width + x) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        if (!isGridBorderPixel(r, g, b, isDarkMode)) break;
        thickness++;
    }

    return thickness;
};

export const detectDayWidthFromOffset = (
    imageData: Uint8ClampedArray,
    width: number,
    isDarkMode: boolean,
    offsetX: number,
    verticalBorderThickness: number
): number => {
    // 측정된 보더 두께만큼 확실하게 건너뛰고 배경부터 스캔 시작
    const startX = offsetX + verticalBorderThickness;
    const y = 5; // 상단 요일 헤더의 안전한 빈 공간

    for (let x = startX; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        if (isGridBorderPixel(r, g, b, isDarkMode)) {
            // ✨ (다음 선의 시작점 - 이번 선의 시작점) = 정확한 요일 너비 주기
            // 주의: x - startX가 아니라 x - offsetX를 해야 두께가 포함된 완벽한 1칸 너비가 나옵니다.
            const gap = x - offsetX;

            // 고해상도 캡처본(폭 1000px 이상) 대응을 위해 230 -> 400으로 넉넉하게 확장
            if (gap >= 80 && gap <= 400) return gap;
            break;
        }
    }

    // 폴백: 스캔 실패 시 전체 너비에서 여백을 빼고 5등분
    return Math.floor((width - offsetX) / 5);
};

export const detectHourHeightFromOffset = (
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    isDarkMode: boolean,
    offsetY: number,
    HorizontalBorderThickness: number
): number => {
    // 두께 잴 때와 동일하게 얇은 선 노이즈를 피할 수 있는 안전한 X 위치 지정 (15)
    const safeX = 15;

    // 측정된 보더 두께만큼 확실하게 건너뛰고 탐색 시작
    const startY = offsetY + HorizontalBorderThickness;

    for (let y = startY; y < height; y++) {
        const idx = (y * width + safeX) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        if (isGridBorderPixel(r, g, b, isDarkMode)) {
            // ✨ (다음 선의 시작점 - 이번 선의 시작점) = 정확한 1시간 높이 주기
            const gap = y - offsetY;

            // 🚨 시간 밀림 현상의 원인이었던 `return gap - 3` 삭제! 순수 gap 반환.
            if (gap >= 40 && gap <= 400) return gap;
            break;
        }
    }

    // 폴백
    return 80;
};
