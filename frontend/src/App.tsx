import { useState, useCallback } from "react";
import { useVenue } from "./hooks/useVenue";
import { useSelection } from "./hooks/useSelection";
import { SeatMap } from "./components/SeatMap";
import { SeatDetail } from "./components/SeatDetail";
import { SelectionSummary } from "./components/SelectionSummary";
import type { FlatSeat } from "./types/venue";
import { PRICE_TIERS } from "./utils/pricing";

export default function App() {
  const { venue, allSeats, loading, error } = useVenue("/venue.json");
  const { selected, toggle, clear, isSelected, isFull } = useSelection();
  const [focusedSeat, setFocusedSeat] = useState<FlatSeat | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleSeatClick = useCallback(
    (seat: FlatSeat) => {
      setFocusedSeat(seat);
      toggle(seat.id, seat.status === "available");
    },
    [toggle]
  );

  const handleSeatFocus = useCallback((seat: FlatSeat) => {
    setFocusedSeat(seat);
  }, []);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Loading venue…</p>
      </div>
    );

  if (error || !venue)
    return (
      <div className="loading-screen">
        <p style={{ color: "#ef4444" }}>⚠ {error ?? "Failed to load venue"}</p>
      </div>
    );

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div>
            <h1 className="venue-name">{venue.name}</h1>
            <p className="venue-sub">Interactive Seating Map</p>
          </div>
        </div>
        <div className="header-right">
          <button
            className={`heatmap-btn ${showHeatmap ? "active" : ""}`}
            onClick={() => setShowHeatmap((v) => !v)}
            aria-pressed={showHeatmap}
            aria-label="Toggle price heatmap"
          >
            {showHeatmap ? "Heatmap On" : "Heatmap"}
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Map */}
        <main className="map-container" role="main">
          <SeatMap
            venue={venue}
            allSeats={allSeats}
            selected={selected}
            focusedId={focusedSeat?.id ?? null}
            onSeatClick={handleSeatClick}
            onSeatFocus={handleSeatFocus}
            showHeatmap={showHeatmap}
          />

          {/* Legend */}
          <div className="legend">
            <div className="legend-item">
              <span className="dot" style={{ background: "#3b82f6" }} />
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ background: "#22c55e" }} />
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <span
                className="dot"
                style={{ background: "#475569", opacity: 0.6 }}
              />
              <span>Reserved</span>
            </div>
            <div className="legend-item">
              <span
                className="dot"
                style={{ background: "#1e293b", opacity: 0.6 }}
              />
              <span>Sold</span>
            </div>
          </div>

          {/* Price tiers legend when heatmap active */}
          {showHeatmap && (
            <div className="heatmap-legend">
              {Object.entries(PRICE_TIERS).map(([tier, cfg]) => (
                <div key={tier} className="legend-item">
                  <span className="dot" style={{ background: cfg.color }} />
                  <span>
                    {cfg.label} — ${cfg.price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="sidebar">
          <SeatDetail
            seat={focusedSeat}
            isSelected={focusedSeat ? isSelected(focusedSeat.id) : false}
            isFull={isFull}
            onToggle={() =>
              focusedSeat &&
              toggle(focusedSeat.id, focusedSeat.status === "available")
            }
          />
          <SelectionSummary
            selected={selected}
            allSeats={allSeats}
            onClear={clear}
            onSeatClick={(seat) => {
              setFocusedSeat(seat);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
