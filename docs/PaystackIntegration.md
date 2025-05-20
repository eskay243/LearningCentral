# Paystack Payment Integration Guide

## Overview

This document outlines the implementation of Paystack payment processing in the Codelab Educare Learning Management System (LMS). Paystack is a popular payment gateway in Nigeria, making it an ideal choice for handling course payments in the Nigerian market.

## Architecture

The payment flow consists of the following components:

1. **Frontend Payment Modal** - Collects and validates payment information
2. **Payment Initialization API** - Sends payment request to Paystack
3. **Paystack Hosted Payment Page** - Securely processes payment information
4. **Payment Callback Handling** - Verifies and records successful payments
5. **Course Enrollment Processing** - Enrolls students after payment verification

## Frontend Components

### EnrollButton Component

The `EnrollButton` component serves as the entry point for course enrollment, with different behaviors based on course price and user enrollment status:

- For free courses: Direct enrollment without payment
- For paid courses: Opens the payment modal
- For already enrolled users: Redirects to the course page

```jsx
<EnrollButton 
  courseId={course.id}
  courseTitle={course.title}
  price={course.price}
  isEnrolled={isEnrolled}
  onEnrollSuccess={handleEnrollmentSuccess}
/>
```

### PaymentModal Component

The `PaymentModal` component initiates the Paystack payment process:

1. Collects course and payment details
2. Makes an API call to initialize the payment
3. Redirects the user to Paystack's hosted payment page

```jsx
<PaymentModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  courseId={courseId}
  courseTitle={courseTitle}
  price={price}
  onSuccess={onEnrollSuccess}
/>
```

### PaymentCallback Page

The `PaymentCallback` page handles the user's return from Paystack's payment page:

1. Extracts the payment reference from the URL
2. Verifies the payment status with the backend
3. Displays appropriate success/failure messages
4. Redirects users to their courses or dashboard

## Backend Implementation

### Payment Initialization

The `/api/payments/initialize` endpoint prepares a payment request to Paystack:

1. Validates the request (course ID, amount, user details)
2. Checks if the user is already enrolled
3. Prepares metadata for the transaction
4. Calls Paystack's API to initialize the payment
5. Returns an authorization URL for redirection

```javascript
// Key data sent to Paystack
const paymentData = await initializePayment({
  email: user.email,
  amount,
  metadata: {
    courseId,
    userId,
    courseName: course.title
  },
  callbackUrl: `${req.protocol}://${req.get('host')}/payment-callback`
});
```

### Payment Verification

The `/api/payments/verify/:reference` endpoint verifies completed payments:

1. Receives the payment reference from Paystack
2. Verifies the transaction status with Paystack's API
3. If successful, enrolls the user in the course
4. Creates a notification for the user
5. Returns the enrollment details

```javascript
// Verification and enrollment process
const paymentData = await verifyPayment(reference);

if (paymentData.status === 'success') {
  // Extract course ID from metadata
  const courseId = paymentData.metadata?.courseId;
  
  if (courseId) {
    // Enroll the user in the course
    const enrollment = await storage.enrollUserInCourse({
      courseId,
      userId,
      paymentReference: reference,
      paymentAmount: paymentData.amount / 100, // Convert from kobo to naira
      paymentStatus: 'completed',
      paymentMethod: 'paystack',
      paymentProvider: 'paystack',
      progress: 0,
      completedAt: null,
      certificateId: null
    });
  }
}
```

## Database Schema

The database supports payment tracking with these key fields in the `courseEnrollments` table:

- `paymentStatus`: Current payment status (unpaid, completed, failed)
- `paymentAmount`: Amount paid for the course
- `paymentMethod`: Payment method used (paystack, bank transfer, etc.)
- `paymentReference`: Unique reference from Paystack for transaction tracking
- `paymentProvider`: Payment gateway provider (paystack)

## Payment Flow Sequence

1. **User initiates enrollment**:
   - Clicks "Enroll" on a course
   - System checks enrollment status and course price

2. **Payment modal appears**:
   - Displays course details and price
   - User clicks "Pay with Paystack"

3. **Payment initialization**:
   - Frontend calls `/api/payments/initialize`
   - Backend prepares request and calls Paystack
   - Paystack returns authorization URL

4. **User completes payment**:
   - Browser redirects to Paystack's payment page
   - User enters payment details (card, bank, etc.)
   - Paystack processes the payment

5. **Payment callback**:
   - Paystack redirects user to callback URL
   - Frontend extracts reference from URL
   - Backend verifies payment with Paystack

6. **Enrollment processing**:
   - Backend enrolls user in course if payment succeeded
   - System creates notification for user
   - User sees success/failure message

7. **User redirection**:
   - Success: Redirected to dashboard or course
   - Failure: Shown error with option to retry

## Security Considerations

- Payment credentials are never handled directly by the LMS
- Paystack's hosted checkout page ensures PCI compliance
- Payment verification uses server-side validation
- Secret API keys are securely stored as environment variables
- Metadata includes validation parameters to prevent fraud

## Testing the Integration

To test the Paystack integration:

1. Create a test course with a price (e.g., ₦5,000)
2. Attempt to enroll in the course
3. Use Paystack test cards for payment:
   - Card Number: 5060 6666 6666 6666 660
   - Expiry Date: Any future date
   - CVV: Any 3 digits
   - PIN: Any 4 digits
   - OTP: 123456

## Troubleshooting

Common issues and solutions:

1. **Payment initialization fails**:
   - Check that Paystack API keys are correctly set
   - Verify user has a valid email address
   - Ensure amount is properly formatted

2. **Verification fails after payment**:
   - Check callback URL is correctly configured
   - Verify payment reference is being passed correctly
   - Review Paystack dashboard for transaction status

3. **User not enrolled after payment**:
   - Check for errors in the enrollment process
   - Verify transaction metadata contains correct courseId
   - Review server logs for exceptions during enrollment