// Utility: transforms a booking object into the MyTrips trip shape
// Does NOT alter original booking; returns a new object matching mockTrips.js

// Attempts to convert unknown time strings (e.g., "08:45 AM") into a valid ISO string
const toISO = (val) => {
  if (!val) return new Date().toISOString();
  
  // Try direct conversion first
  const direct = new Date(val);
  if (!isNaN(direct.getTime()) && direct.getFullYear() > 2000) {
    return direct.toISOString();
  }
  
  // Try time string parsing
  const str = String(val).trim();
  const m = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  
  if (m) {
    const base = new Date();
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3];
    
    if (ap) {
      const up = ap.toUpperCase();
      if (up === "PM" && h < 12) h += 12;
      if (up === "AM" && h === 12) h = 0;
    }
    
    base.setHours(h, min, 0, 0);
    const result = new Date(base);
    
    if (!isNaN(result.getTime())) {
      return result.toISOString();
    }
  }
  
  // Fallback to current time
  return new Date().toISOString();
};

const parseLocation = (val) => {
  const text = String(val || "").trim();
  const codeMatch = text.match(/\b[A-Z]{3}\b/);
  const code = codeMatch ? codeMatch[0] : (text.split(',').pop() || '').trim().toUpperCase().slice(0,3) || 'N/A';
  const city = (text.split(',')[0] || code || 'Unknown').trim();
  const airport = text || city;
  return { code, city, airport };
};

export const transformBookingToTrip = (booking) => {
  if (!booking) return null;
  const firstPassenger = booking.passengers?.[0] || {};
  const passenger = [firstPassenger.firstName, firstPassenger.lastName].filter(Boolean).join(' ').trim() || 'Passenger';
  const seat = booking.selectedSeat || booking.selectedSeats?.[0] || 'N/A';
  const flight = booking.flight || {};

  const fromLoc = parseLocation(flight.from);
  const toLoc = parseLocation(flight.to);

  const departAt = toISO(flight.departure || flight.departAt);
  const arriveAt = toISO(flight.arrival || flight.arriveAt);
  const nowMs = Date.now();
  const status = (() => {
    try {
      const departDate = new Date(departAt);
      if (isNaN(departDate.getTime())) return 'Upcoming';
      return departDate.getTime() < nowMs ? 'Completed' : 'Upcoming';
    } catch {
      return 'Upcoming';
    }
  })();

  // include full passengers list with categories if present (non-breaking extra field)
  const passengers = Array.isArray(booking.passengers)
    ? booking.passengers.map((p) => ({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        age: p.age || '',
        gender: p.gender || '',
        category: p.category || 'Adult',
      }))
    : [];

  return {
    bookingId: booking.bookingId,
    passenger,
    airline: flight.airline || 'OnWings',
    flightNo: String(flight.id || flight.flightNo || 'N/A'),
    from: fromLoc,
    to: toLoc,
    departAt,
    arriveAt,
    amount: Number(booking.total || 0),
    seat,
    status,
    passengers,
  };
};

export default transformBookingToTrip;
