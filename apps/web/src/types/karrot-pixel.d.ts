export {};

declare global {
  interface Window {
    /** Karrot 픽셀 중복 초기화 방지 */
    __KARROT_PIXEL_FEEDBACKMALL__?: boolean;
    karrotPixel?: {
      init: (pixelId: string) => void;
      track: (eventName: string) => void;
    };
  }
}
