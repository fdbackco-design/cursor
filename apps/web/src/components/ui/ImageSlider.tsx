'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SlideData {
  id: number;
  image: string;
  /** 배너 클릭 시 이동할 링크 (없으면 클릭 불가) */
  link?: string;
  /** 외부 링크일 때 새 탭 열기 */
  openInNewTab?: boolean;
}

interface ImageSliderProps {
  slides: SlideData[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function ImageSlider({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}: ImageSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 자동 슬라이드
  useEffect(() => {
    if (!autoPlay || slides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length, isHovered]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (event.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (slides.length === 0) {
    return (
      <div className={`relative h-96 bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">슬라이드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 슬라이드 컨테이너 */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => {
          const hasLink = slide.link && slide.link.trim() !== '';
          const slideContent = (
            <div
              className="w-full flex-shrink-0 relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100"
              style={!hasLink ? { cursor: 'default' } : undefined}
            >
              {/* 모바일: cover - 기존 방식 유지 */}
              <div
                className="absolute inset-0 md:hidden w-full h-full"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              {/* 웹/데스크톱: contain - 이미지 전체 노출, 좌우 여백은 배경색 */}
              <div className="absolute inset-0 hidden md:flex items-center justify-center bg-gray-100">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            </div>
          );

          if (hasLink) {
            const isExternal = slide.link!.startsWith('http://') || slide.link!.startsWith('https://');
            const target = slide.openInNewTab || isExternal ? '_blank' : '_self';
            const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
            return (
              <a
                key={slide.id}
                href={slide.link}
                target={target}
                rel={rel}
                className="block w-full flex-shrink-0"
              >
                {slideContent}
              </a>
            );
          }

          return (
            <div key={slide.id} className="w-full flex-shrink-0">
              {slideContent}
            </div>
          );
        })}
      </div>

      {/* 네비게이션 화살표 */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200 z-10"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200 z-10"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* 인디케이터 도트 */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'bg-white scale-110'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}

      {/* 슬라이드 카운터 */}
      {slides.length > 1 && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black bg-opacity-30 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm z-10">
          {currentSlide + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}
