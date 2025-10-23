import streamlit as st
import requests

API_URL = "http://localhost:3000/api/chat"

st.title("✈️ Airline Assistant")

user_input = st.text_input("Ask me about your flight:")

if st.button("Submit"):
    if not user_input:
        st.warning("Please enter a message!")
    else:
        try:
            response = requests.post(API_URL, json={"message": user_input})
            data = response.json()
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")
            st.stop()

        # Debug output
        st.write("Debug: Full backend response")
        st.json(data)

        if not isinstance(data, dict):
            st.error("Unexpected response format from backend")
            st.write(data)
            st.stop()

        intent = data.get("intent", "")

        # --- Booking form ---
        if intent == "Book Ticket Form":
            result = data["responses"][0]["result"]
            st.info(result.get("message", "Please fill in the booking details"))

            with st.form("booking_form"):
                customer_id = st.number_input("Customer ID", min_value=1)
                schedule_id = st.number_input("Schedule ID", min_value=1)
                amount = st.number_input("Amount")
                payment_method = st.selectbox("Payment Method", ["card", "upi", "wallet"])

                st.markdown("### Passengers")
                num_passengers = st.number_input("Number of passengers", min_value=1, max_value=10, value=1)

                passengers_data = []
                for i in range(num_passengers):
                    st.markdown(f"**Passenger {i+1}**")
                    first_name = st.text_input(f"First Name {i+1}", key=f"fn_{i}")
                    last_name = st.text_input(f"Last Name {i+1}", key=f"ln_{i}")
                    gender = st.selectbox(f"Gender {i+1}", ["Male", "Female", "Other"], key=f"gender_{i}")
                    nationality = st.text_input(f"Nationality {i+1}", "Indian", key=f"nat_{i}")
                    row_number = st.number_input(f"Row Number {i+1}", min_value=1, key=f"row_{i}")
                    column_letter = st.text_input(f"Column Letter {i+1}", "A", key=f"col_{i}")
                    seat_class = st.text_input(f"Class {i+1}", "Economy", key=f"class_{i}")
                    price = st.number_input(f"Price {i+1}", min_value=0, key=f"price_{i}")

                    passengers_data.append({
                        "first_name": first_name,
                        "last_name": last_name,
                        "gender": gender,
                        "nationality": nationality,
                        "row_number": row_number,
                        "column_letter": column_letter,
                        "class": seat_class,
                        "price": price,
                    })

                submitted = st.form_submit_button("Book Flight")
                if submitted:
                    booking_data = {
                        "customer_id": customer_id,
                        "schedule_id": schedule_id,
                        "amount": amount,
                        "payment_method": payment_method,
                        "passengers": passengers_data,
                    }

                    booking_response = requests.post(
                        API_URL, json={"message": "confirm booking", "inputData": booking_data}
                    )
                    booking_result = booking_response.json()

                    st.success("✅ Booking Successful!")

                    booking_id = booking_result.get("responses", [{}])[0].get("result", {}).get("booking_id", "N/A")
                    st.write(f"**Booking ID:** {booking_id}")
                    st.write(f"**Customer ID:** {customer_id}")
                    st.write(f"**Schedule ID:** {schedule_id}")
                    st.write(f"**Amount Paid:** {amount}")
                    st.write(f"**Payment Method:** {payment_method}")

                    st.markdown("### Passengers")
                    for i, p in enumerate(passengers_data):
                        st.write(f"**Passenger {i+1}:** {p['first_name']} {p['last_name']}")
                        st.write(f" - Gender: {p['gender']}")
                        st.write(f" - Nationality: {p['nationality']}")
                        st.write(f" - Seat: Row {p['row_number']}, Column {p['column_letter']}")
                        st.write(f" - Class: {p['class']}")
                        st.write(f" - Price: {p['price']}")
                        st.write("---")

        # --- Get Bookings ---
        elif intent == "Get Bookings":
            st.info(f"Bookings for Customer ID: {user_input}")
            responses = data.get("responses", [])
            if responses:
                st.json(responses[0].get("result", {}))
            else:
                st.warning("No bookings found")

        # --- Unknown input ---
        elif intent == "Unknown":
            st.info(data["responses"][0]["result"]["message"])

        else:
            st.info("Response from assistant:")
            st.json(data)
