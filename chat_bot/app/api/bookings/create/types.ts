export interface PassengerSeat {
  first_name: string;
  last_name: string;
  gender: 'M' | 'F' | 'O';
  age?: number;
  passport_number?: string;
  nationality: string;
  row_number: number;
  column_letter: string;
  class: 'Economy' | 'Business' | 'First';
  price: number;
}

export interface BookingRequest {
  customer_id: number;
  schedule_id: number;
  payment_method: 'Credit Card' | 'UPI' | 'Net Banking';
  amount: number;
  passengers: PassengerSeat[];
}
