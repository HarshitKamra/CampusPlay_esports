# Payment Integration Setup Guide

## Overview
This application uses **Razorpay** for UPI and payment processing in India. Follow these steps to set up payment functionality.

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a free account
3. Complete KYC verification (required for live payments)
4. Once verified, you'll get access to your dashboard

## Step 2: Get API Keys

1. Log in to your Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Generate **Test Keys** (for development) or **Live Keys** (for production)
4. You'll get:
   - **Key ID** (e.g., `rzp_test_xxxxxxxxxxxxx`)
   - **Key Secret** (e.g., `xxxxxxxxxxxxxxxxxxxxxxxx`)

## Step 3: Configure Environment Variables

Add these to your `.env` file in the `server` directory:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** 
- Never commit your `.env` file to version control
- Use test keys during development
- Switch to live keys only in production

## Step 4: Test Payment Flow

### Test Cards (for development):
- **Success:** `4111 1111 1111 1111`
- **Failure:** `4000 0000 0000 0002`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Test UPI IDs:
- `success@razorpay`
- `failure@razorpay`

## Step 5: How It Works

1. **Admin creates tournament** with entry price (₹)
2. **User clicks "Pay ₹X"** button on tournament
3. **System creates Razorpay order** via `/api/payments/create-order`
4. **Razorpay checkout opens** (supports UPI, Cards, Netbanking, Wallets)
5. **User completes payment**
6. **System verifies payment** via `/api/payments/verify`
7. **User is automatically registered** in tournament

## Step 6: Payment Methods Supported

- ✅ UPI (PhonePe, Google Pay, Paytm, BHIM, etc.)
- ✅ Credit/Debit Cards
- ✅ Net Banking
- ✅ Wallets (Paytm, Freecharge, etc.)
- ✅ EMI

## Step 7: Receiving Payments

### Test Mode:
- Payments are simulated (no real money)
- Use test cards/UPI IDs

### Live Mode:
- Real payments are processed
- Money goes to your Razorpay account
- Transfer to your bank account (settlement)

## Step 8: Settlement (Getting Money)

1. Go to Razorpay Dashboard → **Transfers**
2. Configure your bank account
3. Money is automatically settled (usually T+2 days)
4. You can also manually transfer

## Step 9: Webhook Setup (Optional but Recommended)

For production, set up webhooks to handle payment status updates:

1. Go to Razorpay Dashboard → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`

## Step 10: Admin Features

- Set entry price when creating tournament
- View all tournament participants
- See payment status for each participant
- Export payment reports (via Razorpay dashboard)

## Troubleshooting

### Payment not working?
1. Check if API keys are correct in `.env`
2. Verify Razorpay account is activated
3. Check browser console for errors
4. Ensure you're using correct test/live keys

### Payment verified but user not registered?
1. Check server logs for errors
2. Verify payment status in database
3. Check if tournament registration is open

### UPI not showing?
1. Ensure you're using a supported UPI app
2. Check if test UPI IDs work: `success@razorpay`
3. Verify Razorpay account supports UPI

## Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- Test Mode: https://razorpay.com/docs/payments/test-cards/

## Security Notes

- ✅ Never expose `RAZORPAY_KEY_SECRET` in frontend code
- ✅ Always verify payment signature on server
- ✅ Use HTTPS in production
- ✅ Validate all payment data server-side










