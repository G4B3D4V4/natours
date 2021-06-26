import axios from 'axios'
import { showAlert } from './alerts'
const stripe = Stripe('pk_test_51J4QonGUK4WQqLDfVXlf9hyquc6fSE9afkCJ3asEuBAUz0MfEtwGxRiXjIZilIsurmrPHLRoXcDEAgzZchAZqIvu00Kbz7J7PP');

export const bookTour = async tourId => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        // 2) Create Checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    } catch (error) {
        showAlert('error', error)
    }
}