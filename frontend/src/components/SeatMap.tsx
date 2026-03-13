import { useRef, useCallback, useMemo, useState } from "react";
import type { FlatSeat, VenueData } from "../types/venue";
import { PRICE_TIERS } from "../utils/pricing";

interface SeatMapProps {
  venue: VenueData;
  allSeats: FlatSeat[];
  selected: Set<string>;
  focusedId: string | null;
  onSeatClick: (seat: FlatSeat) => void;
  onSeatFocus: (seat: FlatSeat) => void;
  showHeatmap: boolean;
}

const SEAT_RADIUS = 10;
const STATUS_COLORS: Record<string, string> = {
  reserved: "#475569",
  sold: "#1e293b",
  held: "#92400e",
};

export function SeatMap({
  venue,
  allSeats,
  selected,
  focusedId,
  onSeatClick,
  onSeatFocus,
  showHeatmap,
}: SeatMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    w: venue.map.width,
    h: venue.map.height,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
  } | null>(null);
  const lastTouch = useRef<{ dist: number; cx: number; cy: number } | null>(
    null
  );

  const getSeatColor = useCallback(
    (seat: FlatSeat): string => {
      if (selected.has(seat.id)) return "#22c55e";
      if (seat.status !== "available")
        return STATUS_COLORS[seat.status] ?? "#334155";
      if (showHeatmap) return PRICE_TIERS[seat.priceTier]?.color ?? "#3b82f6";
      return "#3b82f6";
    },
    [selected, showHeatmap]
  );

  const getSeatOpacity = (seat: FlatSeat): number => {
    if (seat.status === "sold") return 0.35;
    if (seat.status === "reserved" || seat.status === "held") return 0.6;
    return 1;
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, seat: FlatSeat) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSeatClick(seat);
      }
    },
    [onSeatClick]
  );

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((v) => {
        const newW = Math.min(venue.map.width, Math.max(200, v.w * factor));
        const newH = Math.min(venue.map.height, Math.max(150, v.h * factor));
        const cx = v.x + v.w / 2;
        const cy = v.y + v.h / 2;
        return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
      });
    },
    [venue.map]
  );

  // Pan with mouse drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as SVGElement).tagName === "circle") return;
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        vx: viewBox.x,
        vy: viewBox.y,
      };
    },
    [viewBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !panStart.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.current.x) * scaleX;
      const dy = (e.clientY - panStart.current.y) * scaleY;
      setViewBox((v) => ({
        ...v,
        x: panStart.current!.vx - dx,
        y: panStart.current!.vy - dy,
      }));
    },
    [isPanning, viewBox.w, viewBox.h]
  );

  const stopPan = useCallback(() => setIsPanning(false), []);

  // Touch pinch-zoom + pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouch.current = {
          dist: Math.hypot(dx, dy),
          cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        panStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          vx: viewBox.x,
          vy: viewBox.y,
        };
      }
    },
    [viewBox]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && lastTouch.current && svgRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const factor = lastTouch.current.dist / newDist;
        //const rect = svgRef.current.getBoundingClientRect();
        setViewBox((v) => {
          const newW = Math.min(venue.map.width, Math.max(200, v.w * factor));
          const newH = Math.min(venue.map.height, Math.max(150, v.h * factor));
          const cx = v.x + v.w / 2;
          const cy = v.y + v.h / 2;
          return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
        });
        lastTouch.current = {
          dist: newDist,
          cx: lastTouch.current.cx,
          cy: lastTouch.current.cy,
        };
      } else if (e.touches.length === 1 && panStart.current && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = viewBox.w / rect.width;
        const scaleY = viewBox.h / rect.height;
        const ddx = (e.touches[0].clientX - panStart.current.x) * scaleX;
        const ddy = (e.touches[0].clientY - panStart.current.y) * scaleY;
        setViewBox((v) => ({
          ...v,
          x: panStart.current!.vx - ddx,
          y: panStart.current!.vy - ddy,
        }));
      }
    },
    [venue.map, viewBox.w, viewBox.h]
  );

  // Section labels
  const sectionLabels = useMemo(() => {
    return venue.sections.map((section) => {
      const allSectionSeats = section.rows.flatMap((r) => r.seats);
      if (allSectionSeats.length === 0) return null;
      const avgX =
        allSectionSeats.reduce((s, seat) => s + seat.x, 0) /
        allSectionSeats.length;
      const minY = Math.min(...allSectionSeats.map((s) => s.y)) - 22;
      return { id: section.id, label: section.label, x: avgX, y: minY };
    });
  }, [venue.sections]);

  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

  return (
    <svg
      ref={svgRef}
      viewBox={vb}
      className="w-full h-full"
      style={{ cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}
      role="application"
      aria-label={`Seating map for ${venue.name}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={stopPan}
    >
      {/* Section labels */}
      {sectionLabels.map((lbl) =>
        lbl ? (
          <text
            key={lbl.id}
            x={lbl.x}
            y={lbl.y}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
            fontFamily="monospace"
            letterSpacing="1"
          >
            {lbl.label.toUpperCase()}
          </text>
        ) : null
      )}

      {/* Seats */}
      {allSeats.map((seat) => {
        const isAvailable = seat.status === "available";
        const isSel = selected.has(seat.id);
        const isFocused = focusedId === seat.id;
        const color = getSeatColor(seat);
        const opacity = getSeatOpacity(seat);

        return (
          <circle
            key={seat.id}
            cx={seat.x}
            cy={seat.y}
            r={isSel ? SEAT_RADIUS + 2 : SEAT_RADIUS}
            fill={color}
            fillOpacity={opacity}
            stroke={isFocused ? "#fff" : isSel ? "#86efac" : "transparent"}
            strokeWidth={isFocused || isSel ? 2 : 0}
            style={{
              cursor: isAvailable ? "pointer" : "not-allowed",
              transition: "r 0.1s ease, fill 0.15s ease",
              outline: "none",
            }}
            role="button"
            aria-label={`Seat ${seat.id}, ${seat.sectionLabel}, Row ${seat.rowIndex}, Col ${seat.col}, Status: ${seat.status}`}
            aria-pressed={isSel}
            aria-disabled={!isAvailable}
            tabIndex={isAvailable ? 0 : -1}
            onClick={() => onSeatClick(seat)}
            onFocus={() => onSeatFocus(seat)}
            onKeyDown={(e) => handleKeyDown(e, seat)}
          />
        );
      })}
    </svg>
  );
}
