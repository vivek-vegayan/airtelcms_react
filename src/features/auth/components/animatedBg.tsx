import React from "react";

export const AnimatedBg = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const hexagons: any[] = [];
    const lines: any[] = [];

    const HEX_COUNT = 50;

    // Create hexagons
    for (let i = 0; i < HEX_COUNT; i++) {
      hexagons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 15 + Math.random() * 25,
        speed: 0.2 + Math.random() * 0.6,
        opacity: 0.1 + Math.random() * 0.3,
      });
    }

    const drawHex = (x: number, y: number, size: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, alpha: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(0,180,255,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Move hexagons
      hexagons.forEach((h) => {
        h.y -= h.speed;
        if (h.y < -50) {
          h.y = height + 50;
          h.x = Math.random() * width;
        }

        drawHex(h.x, h.y, h.size, h.opacity);
      });

      // Draw connecting lines (network effect)
      for (let i = 0; i < hexagons.length; i++) {
        for (let j = i + 1; j < hexagons.length; j++) {
          const dx = hexagons[i].x - hexagons[j].x;
          const dy = hexagons[i].y - hexagons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            drawLine(
              hexagons[i].x,
              hexagons[i].y,
              hexagons[j].x,
              hexagons[j].y,
              0.05
            );
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
};