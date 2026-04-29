# Security Specification - BUSNET OS

## Data Invariants
1. A **User** cannot modify their own `role` or `loyaltyPoints` after creation (or even at creation, they should default or be admin-assigned).
2. A **Trip** must belong to a valid carrier (`carrierId`).
3. A **Booking** must reference a valid `tripId` and `userId`.
4. **ForumPosts** can only be liked/modified by verified users.
5. **Logs** and **Leads** are restricted to internal staff Roles.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Creating a booking with `userId` of another user.
2. **Privilege Escalation**: Updating user profile to SET `role: 'admin'`.
3. **Ghost Field Injection**: Adding `isVerified: true` to a forum post via client update.
4. **Relational Orphan**: Creating a booking for a non-existent trip.
5. **PII Leak**: A user reading another user's private profile (phone, email).
6. **Resource Exhaustion**: Sending a 1MB string as a `passengerName` in a booking.
7. **Temporal Fraud**: Setting `createdAt` in a booking to a date in the past.
8. **State Shortcut**: Updating a booking status from `pending` to `refunded` without proper carrier authorization.
9. **Identity Poisoning**: Using a 2KB string of non-alphanumeric characters as a `tripId`.
10. **Admin Bypass**: Attempting to delete a trip without being the carrier owner or an admin.
11. **Negative Seats**: Booking `-5` seats on a trip.
12. **Unauthorized Metadata**: Changing the `carrierId` of a Trip after it's been created.

## Implementation Details
- `isValidUser`, `isValidTrip`, `isValidBooking`, etc. will be defined.
- `affectedKeys().hasOnly()` will be used to restrict updates to specific fields.
- `exists()` and `get()` checks for relational integrity.
