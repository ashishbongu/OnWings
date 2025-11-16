import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchFlightById,
  selectCurrentFlight,
  selectBookingStatus,
  clearBooking,
  selectPassengers,
  selectSelectedSeats,
  addPassenger,
  removePassenger // <-- Make sure this is imported
} from '../store/slices/bookingSlice'
// 1. Import the selector for your search parameters
import { selectSearchParams } from '../store/slices/flightSlice'
import FlightLoader from '../components/common/FlightLoader' // Use new loader
import PassengerForm from '../components/booking/PassengerForm'
import SeatMap from '../components/booking/SeatMap'
import PriceSummary from '../components/booking/PriceSummary'
import LuggageInfo from '../components/booking/LuggageInfo'

const BookingPage = () => {
  const { flightId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const flight = useSelector(selectCurrentFlight);
  const status = useSelector(selectBookingStatus);
  const passengers = useSelector(selectPassengers);
  const selectedSeats = useSelector(selectSelectedSeats);
  // 2. Get the search params from the flightSlice
  const searchParams = useSelector(selectSearchParams);

  // This hook fetches the flight details
  useEffect(() => {
    if (flightId) {
      dispatch(fetchFlightById(flightId));
    }
  }, [dispatch, flightId]);

  // 3. --- THIS IS THE NEW LOGIC ---
  // This hook syncs the passenger count from your search
  useEffect(() => {
    // Get passenger count from your search (saved in flightSlice)
    const adults = Number(searchParams?.adults || 1);
    const children = Number(searchParams?.children || 0);
    const desiredPassengerCount = Math.max(1, adults + children);
    
    // Get the current passenger count in the booking form
    const currentPassengerCount = passengers.length;
    
    if (desiredPassengerCount > currentPassengerCount) {
      // Add missing passengers
      const diff = desiredPassengerCount - currentPassengerCount;
      for (let i = 0; i < diff; i++) {
        dispatch(addPassenger());
      }
    } else if (desiredPassengerCount < currentPassengerCount) {
      // Remove extra passengers (from the end)
      const diff = currentPassengerCount - desiredPassengerCount;
      for (let i = 0; i < diff; i++) {
        // We dispatch the ID of the *last* passenger
        dispatch(removePassenger(passengers[passengers.length - (i + 1)].id));
      }
    }
    // This hook runs when the page loads or if the search params change
  }, [dispatch, searchParams?.adults, searchParams?.children, passengers.length]); // Added passengers.length to dependency

  const handleBooking = () => {
    // You can add validation here
    navigate('/payment');
  }

  if (status === 'loading' || !flight) {
    return (
      // Use the new FlightLoader
      <div className="flex flex-col justify-center items-center h-96">
        <FlightLoader />
        <span className="text-xl -mt-4 text-white/80">Loading Booking Details...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-white/90 mb-8">Booking Details</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <PassengerForm />
          <LuggageInfo /> 
          <SeatMap />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24"> {/* Makes PriceSummary sticky */}
            <PriceSummary onConfirm={handleBooking} />
          </div>
        </div>

      </div>
    </div>
  )
}

export default BookingPage
