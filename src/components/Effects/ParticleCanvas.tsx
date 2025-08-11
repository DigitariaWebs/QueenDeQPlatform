import { useEffect, useRef } from 'react';

export const ParticleCanvas = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    opacity: number;
  }>>([]);
  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initParticles = (width: number, height: number) => {
      particlesRef.current = [];
      const numParticles = 100;
      for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          opacity: 0.6 + Math.random() * 0.4
        });
      }
    };

    const resizeCanvas = (contentWidth: number, contentHeight: number) => {
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      // Set the display size (CSS pixels)
      canvas.style.width = `${contentWidth}px`;
      canvas.style.height = `${contentHeight}px`;
      // Set the actual number of pixels in the canvas
      canvas.width = Math.floor(contentWidth * dpr);
      canvas.height = Math.floor(contentHeight * dpr);
      // Ensure 1 unit in the canvas is 1 CSS pixel
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(contentWidth, contentHeight);
    };

    const animate = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Draw particle with subtle twinkling effect
        const twinkle = 0.7 + 0.3 * Math.sin(Date.now() * 0.002 + particle.x * 0.01);
        const radius = particle.radius; // radius in CSS pixels

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          radius * 2
        );
        gradient.addColorStop(0, `rgba(214, 174, 96, ${particle.opacity * twinkle})`);
        gradient.addColorStop(1, 'rgba(214, 174, 96, 0)');

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    // Observe size of the canvas container for accurate initial sizing
    const start = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      resizeCanvas(width, height);
      animate();
    };

    // ResizeObserver handles dynamic layout changes (not just window resize)
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          const boxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : (entry.contentBoxSize as any);
          const width = Math.max(1, Math.floor(boxSize?.inlineSize || canvas.clientWidth));
          const height = Math.max(1, Math.floor(boxSize?.blockSize || canvas.clientHeight));
          resizeCanvas(width, height);
        }
      }
    });

    resizeObserverRef.current.observe(canvas);
    start();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};
