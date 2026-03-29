import type { ImageClassInfo } from "../types/schedule";
import {
    createImageClassInfo,
    detectDarkMode,
    detectDayWidthFromOffset,
    detectHorizontalBorderThickness,
    detectHourHeightFromOffset,
    detectOffsetXFromTopLeft,
    detectOffsetYFromTopLeft,
    detectVerticalBorderThickness,
    getPixelRgb,
    isBackgroundOrBorder,
} from "./utils";

// 에브리타임 시간표 이미지에서 수업 블록을 읽어 시간 정보로 변환
export const analyzeEverytimeImage = async (
    image: HTMLImageElement
): Promise<ImageClassInfo[] | null> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const width = image.width;
    const height = image.height;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    // 이미지 전체 픽셀을 한 번에 가져와 스캔 비용 최소화
    const imageData = ctx.getImageData(0, 0, width, height).data;
    // 다크모드 분석
    const isDarkMode = detectDarkMode(imageData, width);
    // 좌측 시간축 너비 (월요일 시작점)
    const OFFSET_X = detectOffsetXFromTopLeft(
        imageData,
        width,
        isDarkMode,
        5,
        5
    );
    // 현재 캡처 포맷 기준 레이아웃 상수
    const OFFSET_Y = detectOffsetYFromTopLeft(
        imageData,
        width,
        height,
        isDarkMode,
        5,
        5
    );

    // 수직 보더 넓이
    const VerticalBorderThickness = detectVerticalBorderThickness(
        imageData,
        width,
        isDarkMode,
        OFFSET_X
    );
    // 수평 보더 넓이
    const HorizontalBorderThickness = detectHorizontalBorderThickness(
        imageData,
        width,
        height,
        isDarkMode,
        OFFSET_Y
    );
    // 요일별 가로 너비
    const DAY_WIDTH = detectDayWidthFromOffset(
        imageData,
        width,
        isDarkMode,
        OFFSET_X,
        VerticalBorderThickness
    );
    // 1시간당 세로 높이
    const HOUR_HEIGHT = detectHourHeightFromOffset(
        imageData,
        width,
        height,
        isDarkMode,
        OFFSET_Y,
        HorizontalBorderThickness
    );

    // 날짜 갯수
    const maxDay = Math.trunc((width - OFFSET_X) / DAY_WIDTH);

    let startHour = 9; // OCR 실패 시 사용할 기본값
    try {
        // ocr.ts를 동적 임포트해서 초기 로딩 속도 방어
        const { extractStartHourImage, detectStartHourWithOCR } =
            await import("./ocr");
        const cropCanvas = extractStartHourImage(
            image,
            OFFSET_X,
            OFFSET_Y,
            HOUR_HEIGHT,
            isDarkMode
        );

        console.log("시작 시간을 찾기 위해 OCR 분석을 시작합니다...");
        const ocrResult = await detectStartHourWithOCR(cropCanvas);

        if (ocrResult !== null) {
            startHour = ocrResult;
            console.log(`✅ OCR 인식 성공! 시간표 시작 시간: ${startHour}시`);
        } else {
            console.warn(
                `⚠️ OCR 인식 실패. 기본값인 ${startHour}시로 설정합니다.`
            );
        }
    } catch (e) {
        console.error("OCR 모듈 로드 또는 실행 실패:", e);
    }

    const results: ImageClassInfo[] = [];

    // 요일 각 열을 세로 스캔
    // 요일 각 열을 세로 스캔
    for (let day = 0; day < maxDay; day++) {
        const scanX = Math.floor(OFFSET_X + day * DAY_WIDTH + DAY_WIDTH - 7);

        let isClassOngoing = false;
        let classStartPixelY = 0;
        let currentColor = "";
        let currentR = 0,
            currentG = 0,
            currentB = 0; // ✨ 현재 블록 색상 저장용

        for (let y = OFFSET_Y; y < height; y++) {
            // 현재 스캔 좌표의 픽셀 RGB 값을 가져옴
            const { r, g, b } = getPixelRgb(imageData, width, scanX, y);
            // 현재 픽셀이 배경/보더인지(수업 블록이 아닌지) 판별
            const isBgOrBorder = isBackgroundOrBorder(r, g, b, isDarkMode);

            if (!isBgOrBorder) {
                if (!isClassOngoing) {
                    // 배경이 아닌 첫 픽셀을 수업 시작점으로 기록
                    isClassOngoing = true;
                    classStartPixelY = y;
                    currentColor = `rgb(${r},${g},${b})`;
                    currentR = r;
                    currentG = g;
                    currentB = b; // 기준 색상 저장
                } else {
                    // ✨ 수업 진행 중인데 색상이 확 바뀐 경우 (연강 분리)
                    const colorDiff =
                        Math.abs(r - currentR) +
                        Math.abs(g - currentG) +
                        Math.abs(b - currentB);
                    if (colorDiff > 60) {
                        if (y - classStartPixelY < 15) {
                            // 1. 탑 섀도우 (노이즈): 시작 직후 바뀐 건 윗쪽 테두리 노이즈이므로 진짜 색상으로 교체만 함
                            currentColor = `rgb(${r},${g},${b})`;
                            currentR = r;
                            currentG = g;
                            currentB = b;
                        } else {
                            // 2. 바텀 섀도우인지, 아니면 진짜 연강인지 판별 (살짝 아래를 미리 봄)
                            const peekY = Math.min(y + 15, height - 1);
                            const peekPixel = getPixelRgb(
                                imageData,
                                width,
                                scanX,
                                peekY
                            );
                            const peekIsBg = isBackgroundOrBorder(
                                peekPixel.r,
                                peekPixel.g,
                                peekPixel.b,
                                isDarkMode
                            );

                            if (!peekIsBg) {
                                // 15px 뒤에도 배경이 아니다 -> 완전히 다른 과목이 딱 붙어있는 연강! 자릅니다.
                                results.push(
                                    createImageClassInfo(
                                        day,
                                        classStartPixelY,
                                        y,
                                        OFFSET_Y,
                                        HOUR_HEIGHT,
                                        startHour,
                                        currentColor
                                    )
                                );
                                // 새 과목으로 바로 다시 시작
                                classStartPixelY = y;
                                currentColor = `rgb(${r},${g},${b})`;
                                currentR = r;
                                currentG = g;
                                currentB = b;
                            }
                            // 만약 peekIsBg가 true라면? 그냥 바텀 섀도우(그림자)이므로 무시하고 통과합니다.
                        }
                    }
                }
            } else if (isClassOngoing) {
                // 다시 배경을 만나면 수업 종료
                isClassOngoing = false;

                // ✨ PC vs 모바일 그림자 문제 완벽 해결!
                // 1시간 높이가 100px 이상인 경우(모바일)에만 하단 그림자를 깎아내고,
                // 100px 미만인 경우(PC 웹)는 그림자가 없으므로 그대로(0) 유지합니다.
                const shadowOffset =
                    HOUR_HEIGHT > 100 ? Math.floor(HOUR_HEIGHT * 0.04) : 0;
                const classEndPixelY = y - shadowOffset;

                // ✨ 10px 미만의 자투리 노이즈 블록은 무시
                if (classEndPixelY - classStartPixelY >= 10) {
                    results.push(
                        createImageClassInfo(
                            day,
                            classStartPixelY,
                            classEndPixelY,
                            OFFSET_Y,
                            HOUR_HEIGHT,
                            startHour,
                            currentColor
                        )
                    );
                }
            }
        }

        // 이미지 하단에서 수업이 끝나는 케이스 보정
        if (isClassOngoing && height - classStartPixelY >= 10) {
            results.push(
                createImageClassInfo(
                    day,
                    classStartPixelY,
                    height,
                    OFFSET_Y,
                    HOUR_HEIGHT,
                    startHour,
                    currentColor
                )
            );
        }
    }

    // 디버그 로그
    console.group("에브리타임 이미지 분석 결과");
    console.log(
        `감지된 테마: ${isDarkMode ? "다크 모드 🌙" : "라이트 모드 ☀️"}`
    );
    console.log(
        `최좌측 최상단 Grid 오른쪽 보더 시작점(OFFSET_X): ${OFFSET_X}px`
    );
    console.log(`최좌측 최상단 Grid 하단 보더 시작점(OFFSET_Y): ${OFFSET_Y}px`);
    console.log(`사용된 1시간 기준 넓이(DAY_WIDTH): ${DAY_WIDTH}px`);
    console.log(`사용된 1시간 기준 높이(HOUR_HEIGHT): ${HOUR_HEIGHT}px`);
    console.log(results);
    console.groupEnd();

    return results;
};
