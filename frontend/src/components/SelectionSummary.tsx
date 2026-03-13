import type { FlatSeat } from "../types/venue";
import { getTierPrice, formatCurrency } from "../utils/pricing";

interface SelectionSummaryProps {
  selected: Set<string>;
  allSeats: FlatSeat[];
  onClear: () => void;
  onSeatClick: (seat: FlatSeat) => void;
}

export function SelectionSummary({
  selected,
  allSeats,
  onClear,
  onSeatClick,
}: SelectionSummaryProps) {
  const selectedSeats = allSeats.filter((s) => selected.has(s.id));
  const total = selectedSeats.reduce(
    (sum, s) => sum + getTierPrice(s.priceTier),
    0
  );

  if (selected.size === 0) {
    return (
      <div className="summary-empty">
        <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>
          No seats selected · Up to 8
        </p>
      </div>
    );
  }

  return (
    <div className="summary-panel">
      <div className="summary-header">
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: "#94a3b8",
            letterSpacing: "0.08em",
          }}
        >
          YOUR SEATS ({selected.size}/8)
        </span>
        <button
          onClick={onClear}
          className="clear-btn"
          aria-label="Clear all selected seats"
        >
          Clear all
        </button>
      </div>

      <div className="seats-list">
        {selectedSeats.map((seat) => (
          <div
            key={seat.id}
            className="summary-seat"
            onClick={() => onSeatClick(seat)}
            role="button"
            tabIndex={0}
            aria-label={`Selected seat ${seat.id}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSeatClick(seat);
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 600,
                color: "#e2e8f0",
                fontSize: 13,
              }}
            >
              {seat.id}
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              {formatCurrency(getTierPrice(seat.priceTier))}
            </span>
          </div>
        ))}
      </div>

      <div className="summary-totals">
        <div className="total-row grand">
          <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Total</span>
          <span style={{ color: "#22c55e", fontWeight: 800, fontSize: 18 }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <button className="checkout-btn" aria-label="Proceed to checkout">
        Checkout →
      </button>
    </div>
  );
}
