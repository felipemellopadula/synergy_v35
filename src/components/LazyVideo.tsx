import { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  src: string;
  className?: string;
}

export const LazyVideo = ({ src, className }: LazyVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: "200px"
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current && !hasError) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (e) {
          console.log("Video autoplay blocked");
        }
      };
      playVideo();
    }
  }, [isVisible, hasError]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {hasError && (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
      )}
    </div>
  );
};
