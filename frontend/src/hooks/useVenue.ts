import { useState, useEffect } from 'react';
import type { VenueData, FlatSeat } from '../types/venue';

interface UseVenueResult {
  venue: VenueData | null;
  allSeats: FlatSeat[];
  loading: boolean;
  error: string | null;
}

export function useVenue(url: string): UseVenueResult {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status}`);
        }
        const data = await response.json() as VenueData;
        
        setVenue(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  // flatten section → row → seat into one list so components don't
 // have to think about the nested structure at all
  const allSeats: FlatSeat[] = venue
    ? venue.sections.flatMap(section =>
        section.rows.flatMap(row =>
          row.seats.map(seat => ({
            ...seat,
            sectionId: section.id,
            sectionLabel: section.label,
            rowIndex: row.index,
          }))
        )
      )
    : [];

  return { venue, allSeats, loading, error };
}
