import React, { useRef, useEffect } from 'react';
import { CharacterState, Furniture, HomeType, IntimacyParticle } from './homesteadTypes';
import { CANVAS_WIDTH, CANVAS_HEIGHT, HOME_CONFIGS, MAP_COLS, MAP_ROWS, TILE_SIZE, isWallTile } from './furnitureData';
import { drawTile, drawFurniture, drawCharacter, drawParticles, drawRoomWatermarks } from './drawing';

interface HomesteadCanvasProps {
  homeType: HomeType;
  playerRef: React.MutableRefObject<CharacterState>;
  npcsRef: React.MutableRefObject<CharacterState[]>;
  particlesRef?: React.MutableRefObject<IntimacyParticle[]>;
  furnitures: Furniture[];
  onCanvasTap?: (x: number, y: number) => void;
}

export const HomesteadCanvas: React.FC<HomesteadCanvasProps> = ({
  homeType,
  playerRef,
  npcsRef,
  particlesRef,
  furnitures,
  onCanvasTap
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const homeConfig = HOME_CONFIGS[homeType];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. 清空画布
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. 绘制地图瓦片 (地板与四周及房间内隔断墙壁)
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          const isWall = isWallTile(c, r);
          const color = isWall ? homeConfig.wallColor : homeConfig.floorColor;
          drawTile(ctx, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, color, isWall);
        }
      }

      // 2.5 绘制 4 大独立功能房间水纹与名称地标
      drawRoomWatermarks(ctx);

      // 3. 绘制家具
      for (const f of furnitures) {
        drawFurniture(ctx, f);
      }

      // 4. 按 Y 坐标深度排序绘制所有在场角色 (出门晨跑的 NPC 自动隐藏消失)
      const visibleNpcs = npcsRef.current.filter(n => !n.isOutside);
      const allCharacters: CharacterState[] = [
        playerRef.current,
        ...visibleNpcs
      ].sort((a, b) => a.y - b.y);

      for (const ch of allCharacters) {
        drawCharacter(ctx, ch);
      }

      // 5. 绘制浪漫与温馨互动粒子特效 (亲亲、牵手、抱抱等)
      if (particlesRef && particlesRef.current.length > 0) {
        drawParticles(ctx, particlesRef.current);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [furnitures, playerRef, npcsRef, particlesRef, homeConfig]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onCanvasTap) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    onCanvasTap(clickX, clickY);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#181d24] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        className="rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-crosshair active:brightness-105 transition-all"
        style={{
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};
