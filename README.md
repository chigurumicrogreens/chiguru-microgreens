# Chiguru Microgreens Online Portal

A free-tool MVP for selling microgreens online.

## What is included

- Responsive landing page for new customers
- Product catalogue with add-to-cart
- Weekly subscription bundle options
- Delivery fee calculation
- UPI payment link
- WhatsApp order handoff with full order summary
- Cart persistence in the browser

## Customize before launch

Edit `app.js`:

- `STORE.whatsappNumber`: replace with the business WhatsApp number, including country code.
- `STORE.upiId`: replace with the real UPI ID.
- `products`: update product names, prices, pack sizes, descriptions, and images.
- `STORE.deliveryFees`: update delivery charges by area.
- `STORE.freeDeliveryAt`: update the free delivery threshold.

## Free MVP tool stack

- Website hosting: GitHub Pages, Netlify, Vercel, or Google Sites embed
- Order capture: WhatsApp order message
- Payments: UPI link or QR code
- Operations tracking: Google Sheets
- Customer follow-up: WhatsApp Business labels and quick replies
- Analytics: Google Analytics or Microsoft Clarity

## Suggested next steps

1. Replace placeholder WhatsApp and UPI details.
2. Confirm product list, pack size, and delivery areas.
3. Add real Chiguru product photos.
4. Deploy as a static website.
5. Connect WhatsApp Business quick replies for payment confirmation and delivery updates.
