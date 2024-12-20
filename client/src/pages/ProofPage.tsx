import { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";

const ProofPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Setup for both canvases
    const setupCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      return { canvas, ctx };
    };

    // Setup first canvas
    const canvas1Setup = setupCanvas(canvasRef);
    // Setup second canvas
    const canvas2Setup = setupCanvas(canvas2Ref);

    if (!canvas1Setup || !canvas2Setup) return;
    
    const { canvas: canvas1, ctx: ctx1 } = canvas1Setup;
    const { canvas: canvas2, ctx: ctx2 } = canvas2Setup;

    // Shared drawing functions
    const drawPanel = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      x: number,
      width: number,
      title: string,
      frequency: string,
      color: string
    ) => {
      // Background panel with gradient
      const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
      gradient.addColorStop(0, '#333');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 10, width, canvas.height - 20);
      
      // Add subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      for (let i = 0; i < width; i += 20) {
        ctx.moveTo(x + i, 10);
        ctx.lineTo(x + i, canvas.height - 10);
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.moveTo(x, 10 + i);
        ctx.lineTo(x + width, 10 + i);
      }
      ctx.stroke();

      // Calculate dynamic text background width based on panel size
      const panelWidth = Math.min(width - 20, 300);
      
      // Title with gradient background
      const textBgGradient = ctx.createLinearGradient(x + 10, 15, x + 10 + panelWidth, 60);
      textBgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      textBgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = textBgGradient;
      ctx.fillRect(x + 10, 15, panelWidth, 50);
      
      // Add subtle border to text background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 10, 15, panelWidth, 50);
      
      // Text with enhanced shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(title, x + 20, 35);
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = color;
      ctx.fillText(frequency, x + 20, 55);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    };

    const drawBrainWave = (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      width: number,
      amplitude: number,
      frequency: number,
      color: string,
      organized: boolean
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      for (let x = 0; x <= width; x++) {
        const baseVariance = organized ? 0.1 : 0.5;
        const noiseIntensity = organized ? 0.15 : 0.4;
        
        const timeOffset = Date.now() * (organized ? 0.0002 : 0.0001);
        
        const alpha = Math.sin((x * 0.015 + timeOffset) * (organized ? 1.2 : 0.8)) * 
                     amplitude * (organized ? 0.8 : 0.4);
        
        const beta = Math.sin((x * 0.03 + timeOffset) * (organized ? 1.5 : 0.6)) * 
                    amplitude * (organized ? 0.6 : 0.3);
        
        const gamma = organized ? 
                     Math.sin((x * 0.06 + timeOffset) * 1.2) * amplitude * 0.35 : 0;
        
        const theta = Math.sin((x * 0.008 + timeOffset) * (organized ? 0.7 : 1.3)) * 
                     amplitude * (organized ? 0.3 : 0.7);
        
        const noiseFreq = Math.sin(timeOffset * 0.5) * 0.5 + 0.5;
        const noise = (Math.random() - 0.5) * amplitude * noiseIntensity * 
                     (1 + Math.sin(x * 0.005 + timeOffset)) *
                     (organized ? 0.3 : 1.2) *
                     noiseFreq;
        
        const y = startY + alpha + beta + gamma + theta + noise;
        
        if (x === 0) {
          ctx.moveTo(startX + x, y);
        } else {
          ctx.lineTo(startX + x, y);
        }
      }
      ctx.stroke();

      if (organized) {
        ctx.beginPath();
        ctx.strokeStyle = `${color}88`;
        ctx.setLineDash([5, 5]);
        for (let x = 0; x <= width; x++) {
          const y = startY + Math.sin(x * 0.08) * amplitude * 0.3;
          if (x === 0) ctx.moveTo(startX + x, y);
          else ctx.lineTo(startX + x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const drawTimeStamps = (ctx: CanvasRenderingContext2D, startX: number, width: number, y: number) => {
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      const timestamps = ['0ms', '250ms', '500ms', '750ms', '1000ms'];
      const usableWidth = Math.min(width * 0.8, 300);
      const spacing = usableWidth / (timestamps.length - 1);
      const startOffset = (width - usableWidth) / 2;
      
      timestamps.forEach((stamp, i) => {
        const x = startX + startOffset + (spacing * i);
        const metrics = ctx.measureText(stamp);
        ctx.fillText(stamp, x - (metrics.width / 2), y);
      });
    };

    const drawWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.font = 'italic 12px Arial';
      ctx.fillText('Stanford Neuroscience Lab', 10, canvas.height - 10);
    };

    // Animation for Case Study 1
    const animate1 = () => {
      ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
      
      // Background
      ctx1.fillStyle = '#1a1a1a';
      ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
      
      const halfWidth = canvas1.width / 2 - 20;

      // Draw panels
      drawPanel(ctx1, canvas1, 10, halfWidth - 10, 'Day 1 Brain Pattern', 'Wealth Score: 17', '#ff4444');
      drawPanel(ctx1, canvas1, canvas1.width/2 + 10, halfWidth - 10, 'Day 73 Brain Pattern', 'Wealth Score: 56', '#4444ff');

      // Draw waves
      drawBrainWave(ctx1, 20, 100, halfWidth - 20, 20, 1, '#ff4444', false);
      drawBrainWave(ctx1, 20, 150, halfWidth - 20, 15, 1.5, 'rgba(255, 68, 68, 0.7)', false);
      drawBrainWave(ctx1, canvas1.width/2 + 20, 100, halfWidth - 20, 25, 1, '#4444ff', true);
      drawBrainWave(ctx1, canvas1.width/2 + 20, 150, halfWidth - 20, 20, 1.5, 'rgba(68, 68, 255, 0.7)', true);

      // Draw timestamps and captions
      drawTimeStamps(ctx1, 20, halfWidth - 20, canvas1.height - 30);
      drawTimeStamps(ctx1, canvas1.width/2 + 20, halfWidth - 20, canvas1.height - 30);

      ctx1.font = '12px Arial';
      ctx1.fillStyle = '#888';
      ctx1.fillText('Neural pathways show blocked', 20, canvas1.height - 60);
      ctx1.fillText('wealth recognition patterns', 20, canvas1.height - 45);
      ctx1.fillText('Neural pathways aligned with', canvas1.width/2 + 20, canvas1.height - 60);
      ctx1.fillText('verified wealth patterns', canvas1.width/2 + 20, canvas1.height - 45);

      drawWatermark(ctx1, canvas1);
      
      requestAnimationFrame(animate1);
    };

    // Animation for Case Study 2 with different patterns
    const animate2 = () => {
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
      
      ctx2.fillStyle = '#1a1a1a';
      ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
      
      const halfWidth = canvas2.width / 2 - 20;
      const timeOffset = Date.now() * 0.0001;

      // Draw panels
      drawPanel(ctx2, canvas2, 10, halfWidth - 10, 'Day 1 Brain Pattern', 'Wealth Score: 21', '#ff4444');
      drawPanel(ctx2, canvas2, canvas2.width/2 + 10, halfWidth - 10, 'Day 90 Brain Pattern', 'Wealth Score: 62', '#4444ff');

      // Custom wave drawing for Case Study 2
      // Day 1 - More chaotic pattern
      ctx2.beginPath();
      ctx2.strokeStyle = '#ff4444';
      ctx2.lineWidth = 2;
      
      for (let i = 0; i <= halfWidth - 20; i++) {
        const y = 100 + 
          Math.sin(i * 0.02 + timeOffset) * 15 +
          Math.sin(i * 0.08 + timeOffset * 2) * 10 +
          Math.sin(i * 0.15 + timeOffset * 3) * 5 +
          (Math.random() - 0.5) * 15;
        
        if (i === 0) ctx2.moveTo(20 + i, y);
        else ctx2.lineTo(20 + i, y);
      }
      ctx2.stroke();

      // Day 90 - Harmonic pattern
      ctx2.beginPath();
      ctx2.strokeStyle = '#4444ff';
      
      for (let i = 0; i <= halfWidth - 20; i++) {
        const y = 100 + 
          Math.sin(i * 0.03 + timeOffset * 2) * 20 * Math.sin(timeOffset * 0.5) +
          Math.sin(i * 0.06 + timeOffset) * 10 +
          Math.sin(i * 0.02 - timeOffset) * 5;
        
        if (i === 0) ctx2.moveTo(canvas2.width/2 + 20 + i, y);
        else ctx2.lineTo(canvas2.width/2 + 20 + i, y);
      }
      ctx2.stroke();

      // Draw timestamps and captions
      drawTimeStamps(ctx2, 20, halfWidth - 20, canvas2.height - 30);
      drawTimeStamps(ctx2, canvas2.width/2 + 20, halfWidth - 20, canvas2.height - 30);

      ctx2.font = '12px Arial';
      ctx2.fillStyle = '#888';
      ctx2.fillText('Neural pathways show blocked', 20, canvas2.height - 60);
      ctx2.fillText('wealth recognition patterns', 20, canvas2.height - 45);
      ctx2.fillText('Neural pathways aligned with', canvas2.width/2 + 20, canvas2.height - 60);
      ctx2.fillText('verified wealth patterns', canvas2.width/2 + 20, canvas2.height - 45);

      drawWatermark(ctx2, canvas2);
      
      requestAnimationFrame(animate2);
    };

    // Start both animations
    animate1();
    animate2();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="w-full p-4 md:p-6 bg-background/40 backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Case Study 1</h2>
        <p className="text-muted-foreground mb-6 max-w-3xl">Laboratory analysis of a verified user's brain wave patterns after 73 days of consistent use</p>
        <div className="relative w-full" style={{ height: 'min(400px, 70vh)' }}>
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            style={{ 
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
        </div>
      </Card>

      <Card className="w-full p-4 md:p-6 bg-background/40 backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">Case Study 2</h2>
        <p className="text-muted-foreground mb-6 max-w-3xl">Laboratory analysis of a verified user's brain wave patterns after 90 days of consistent use</p>
        <div className="relative w-full" style={{ height: 'min(400px, 70vh)' }}>
          <canvas 
            ref={canvas2Ref} 
            className="w-full h-full"
            style={{ 
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default ProofPage;
