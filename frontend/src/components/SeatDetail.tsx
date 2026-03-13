import type { FlatSeat } from "../types/venue";
import { PRICE_TIERS, formatCurrency } from "../utils/pricing";

interface SeatDetailProps {
  seat: FlatSeat | null;
  isSelected: boolean;
  isFull: boolean;
  onToggle: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#22c55e" },
  reserved: { label: "Reserved", color: "#f59e0b" },
  sold: { label: "Sold Out", color: "#ef4444" },
  held: { label: "On Hold", color: "#f97316" },
};

export function SeatDetail({
  seat,
  isSelected,
  isFull,
  onToggle,
}: SeatDetailProps) {
  if (!seat) {
    return (
      <div className="seat-detail-empty">
        <div style={{ fontSize: 40, marginBottom: 8 }}></div>
        <p
          style={{
            color: "#64748b",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Click any available seat
          <br />
          to see details
        </p>
      </div>
    );
  }

  const tier = PRICE_TIERS[seat.priceTier];
  const statusInfo = STATUS_LABELS[seat.status] ?? {
    label: seat.status,
    color: "#64748b",
  };
  const isAvailable = seat.status === "available";
  const canSelect = isAvailable && (!isFull || isSelected);

  return (
    <div className="seat-detail">
      <div className="seat-id">
        <span
          style={{
            color: tier?.color ?? "#3b82f6",
            fontFamily: "monospace",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {seat.id}
        </span>
        <span
          style={{
            background: statusInfo.color + "22",
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}44`,
            borderRadius: 99,
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Section</span>
          <span className="detail-value">{seat.sectionLabel}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Row</span>
          <span className="detail-value">{seat.rowIndex}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Seat</span>
          <span className="detail-value">{seat.col}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Price Tier</span>
          <span className="detail-value" style={{ color: tier?.color }}>
            Tier {seat.priceTier}
          </span>
        </div>
      </div>

      <div className="price-display">
        <span style={{ color: "#64748b", fontSize: 13 }}>Price per seat</span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#f1f5f9",
            letterSpacing: "-0.03em",
          }}
        >
          {tier ? formatCurrency(tier.price) : "—"}
        </span>
      </div>

      {isAvailable && (
        <button
          className={`select-btn ${isSelected ? "selected" : ""} ${
            !canSelect ? "disabled" : ""
          }`}
          onClick={onToggle}
          disabled={!canSelect}
          aria-label={
            isSelected ? `Deselect seat ${seat.id}` : `Select seat ${seat.id}`
          }
        >
          {isSelected
            ? "✓ Remove Seat"
            : !isFull
            ? "+ Select Seat"
            : "Selection Full"}
        </button>
      )}
    </div>
  );
}
