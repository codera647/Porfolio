"use client";

import { useEffect, useRef } from "react";
import styles from "./Projects.module.css";

type ProjectPreviewVideoProps = {
  className?: string;
  eager?: boolean;
  src?: string;
  poster?: string;
  label?: string;
};

export function ProjectPreviewVideo({
  className = "",
  eager = false,
  src = "/projects/synapse/demo.mp4",
  poster = "/projects/synapse/screens/landing-1.png",
  label = "Synapse product demonstration",
}: ProjectPreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className={`${styles.previewVideo} ${className}`}
      muted
      loop
      playsInline
      autoPlay
      preload={eager ? "auto" : "metadata"}
      poster={poster}
      aria-label={label}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export default ProjectPreviewVideo;
