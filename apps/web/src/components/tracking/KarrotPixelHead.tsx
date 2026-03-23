/**
 * 당근(Karrot) 광고 픽셀 — 루트 layout의 </head> 직전에만 삽입.
 * 외부 스크립트(동기) → 인라인 순서 유지, window는 브라우저에서만 접근.
 */
const DEV_LOG =
  process.env.NODE_ENV === 'development'
    ? "console.log('[KarrotPixel] ViewPage tracked (dev)');"
    : '';

export function KarrotPixelHead() {
  const inline = `
(function () {
  if (typeof window === 'undefined') return;
  var w = window;
  if (w.__KARROT_PIXEL_FEEDBACKMALL__) return;
  if (!w.karrotPixel) return;
  w.__KARROT_PIXEL_FEEDBACKMALL__ = true;
  try {
    w.karrotPixel.init('1774231185070418001');
    w.karrotPixel.track('ViewPage');
    ${DEV_LOG}
  } catch (e) {
    console.error('[KarrotPixel] init/track failed', e);
  }
})();
`.trim();

  return (
    <>
      {/* Danggeun Market Code */}
      <script src="https://karrot-pixel.business.daangn.com/karrot-pixel.js" />
      <script
        id="karrot-pixel-inline-feedbackmall"
        dangerouslySetInnerHTML={{ __html: inline }}
      />
      {/* End Danggeun Market Code */}
    </>
  );
}
