// these mirror the venue.json structure exactly.
// FlatSeat is what we actually work with after parsing — it carries
// its section/row context so we don't have to look them up later.

export type SeatStatus = 'available' | 'reserved' | 'sold' | 'held';

export interface Seat {
  id: string;
  col: number;
  x: number;
  y: number;
  priceTier: 1 | 2 | 3 | 4;
  status: SeatStatus;
}

export interface Row {
  index: number;
  seats: Seat[];
}

export interface Section {
  id: string;
  label: string;
  transform: { x: number; y: number; scale: number };
  rows: Row[];
}

export interface VenueData {
  venueId: string;
  name: string;
  map: { width: number; height: number };
  sections: Section[];
}

// after we flatten the nested structure, each seat carries its own context
export interface FlatSeat extends Seat {
  sectionId: string;
  sectionLabel: string;
  rowIndex: number;
}

export interface PriceTierConfig {
  label: string;
  price: number;
  color: string;
}
