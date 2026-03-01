# NSK Parking System - Implementation Guide

## Overview
This document describes the implementation of all required features for the NSK parking reservation system according to the specified constraints and rules.

##  Implemented Features

### 1. Reservation Duration Rules
- **Employees**: Can reserve parking for up to **5 working days** (excluding weekends)
- **Managers**: Can reserve parking for up to **30 calendar days**
- **Same-day reservations**: Allowed if space is available

**Implementation**: 
- [reservationService.ts](src/service/reservationService.ts#L8-L23): `addWorkingDays()` helper function calculates working days
- [reservationService.ts](src/service/reservationService.ts#L107-L120): Updated `createReservation()` to apply duration rules based on user type

### 2. Electric Charging Stations
- Rows **A** and **F** have electric plugs
- Users can identify and select electric spots in the UI
- Electric places are already seeded in the database

**Implementation**:
- [1670000000000-SeedInitial.ts](src/migration/1670000000000-SeedInitial.ts): Rows A and F marked with status=1 (ELEC)
- [style.css](src/front/style.css#L66-L69): Electric spots styled with blue border
- [index.html](src/front/index.html): Electric icon displayed on spots

### 3. Check-in System with QR Codes
- QR code at each parking spot with unique URL
- Check-in must be completed by **11:00 AM**
- Reservations without check-in are automatically marked as NO_SHOW

**Implementation**:
- **QR Code Generation**: [qr-codes.html](src/front/qr-codes.html) - Printable page with QR codes for all 60 parking spots
- **Check-in Endpoint**: `POST /reservations/checkin/:placeLabel`
- **Frontend Check-in**: [index.html](src/front/index.html) - Check-in section at top of page
- **Auto Check-in**: QR scan redirects to `/?place=A01` and auto-triggers check-in
- **Business Logic**: [reservationService.ts](src/service/reservationService.ts#L125-L155) - `checkInReservation()` function

**QR Code URL Format**: `http://localhost:3000/?place=A01`

### 4. Automatic Expiration at 11 AM
If a reserved spot doesn't receive check-in by 11 AM, it becomes available for same-day reservations.

**Implementation**:
- [reservationService.ts](src/service/reservationService.ts#L25-L54): Updated `expireOldReservations()` to check for:
  - Past expiration date → Status: EXPIRED
  - Today's date + past 11 AM + not checked in → Status: NO_SHOW
- Called on every server start and before checking availability

### 5. Reservation Status & History
All reservations are kept in history with proper status tracking.

**Statuses**:
- `LOCKED`: Active reservation, not yet checked in
- `CHECKED_IN`: User has checked in successfully
- `EXPIRED`: Reservation expired naturally
- `NO_SHOW`: User didn't check in by 11 AM
- `CANCELLED`: Manually cancelled (reserved for future use)

**Implementation**:
- [Reservation.ts](src/entity/Reservation.ts): Updated entity with new statuses and fields
- [analyticsService.ts](src/service/analyticsService.ts#L88-L119): History retrieval functions

### 6. User Roles & Permissions

#### Employee Profile
- Make their own reservations autonomously
- View available parking spots
- Check-in to their reservations
- Access to main UI at `/`

#### Secretary Profile (Admin)
- Full admin access to back office
- Can manually edit reservations
- Add and manage users via API: `POST /users`, `GET /users`, `GET /users/:id`
- Expire reservations manually:
  - `POST /reservations/expire/selected` (specific spots)
  - `POST /reservations/expire/all` (all reservations)
- Access to QR code generator at `/qr-codes.html`
- View reservation history: `GET /dashboard/reservations/history`

#### Manager Profile
- All employee permissions
- Can reserve for 30 days instead of 5 working days
- Access to analytics dashboard at `/dashboard.html`
- **Dashboard Metrics**:
  - Total parking usage
  - Average occupancy rate
  - No-show rate
  - Proportion of electric charger usage
  - Current vs. average occupancy
  - Reservation trends

**Implementation**:
- [UserType.ts](src/type/UserType.ts): User types enum (EMPLOYEE=0, SECRETARY=1, MANAGER=2, ADMIN=3)
- [analyticsService.ts](src/service/analyticsService.ts): Dashboard analytics calculation
- [dashboard.ts](src/routes/dashboard.ts): Dashboard API endpoints
- [dashboard.html](src/front/dashboard.html): Manager dashboard UI

### 7. Message Queue Integration for Email Notifications

When a reservation is created or checked in, a message is sent to a queue for email processing.

**Implementation**:
- [messageQueueService.ts](src/service/messageQueueService.ts): Queue abstraction layer
- Supports RabbitMQ, AWS SQS, Redis, Azure Service Bus (implementation guides in comments)
- Messages sent on:
  - Reservation creation → `RESERVATION_CREATED`
  - Check-in → `RESERVATION_CHECKED_IN`

**Configuration** (add to `.env`):
```env
ENABLE_QUEUE=true
QUEUE_URL=amqp://localhost:5672  # or your queue URL
```

**Message Format**:
```json
{
  "type": "RESERVATION_CREATED",
  "reservationId": 123,
  "userId": 1,
  "userName": "John Doe",
  "placeLabel": "A01",
  "reservationDate": "2026-03-01T10:00:00Z",
  "expiresAt": "2026-03-08T10:00:00Z",
  "timestamp": "2026-03-01T10:00:00Z"
}
```

## API Endpoints

### Reservations
- `POST /reservations` - Create reservation by place ID
  ```json
  { "placeId": 1, "userId": 1 }
  ```

- `POST /reservations/by-label` - Create reservations by place labels (batch)
  ```json
  { "labels": ["A01", "A02", "B03"] }
  ```

- `POST /reservations/checkin/:placeLabel` - Check-in to reservation
  - Example: `POST /reservations/checkin/A01`

- `POST /reservations/expire/all` - Expire all active reservations (admin)

- `POST /reservations/expire/selected` - Expire specific reservations (admin)
  ```json
  { "labels": ["A01", "B05"] }
  ```

### Places
- `GET /places` - Get all places with availability status
- `GET /places/:id/availability` - Check if specific place is available

### Users
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `POST /users` - Create new user
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "status": 0
  }
  ```

### Dashboard (Manager)
- `GET /dashboard/analytics` - Get parking analytics and statistics
- `GET /dashboard/reservations/history?limit=100` - Get reservation history
- `GET /dashboard/reservations/user/:userId` - Get user's reservation history

## User Interface Pages

1. **Main Parking UI** - `/` or `/index.html`
   - View parking lot layout
   - Select and reserve parking spots
   - Check-in section at top
   - Admin controls (expire reservations)

2. **QR Code Generator** - `/qr-codes.html`
   - Generate all 60 QR codes
   - Print-friendly layout
   - For secretaries to print and post

3. **Manager Dashboard** - `/dashboard.html`
   - Analytics and statistics
   - Occupancy rates
   - No-show tracking
   - Usage trends

## Database Schema Updates

### Reservation Entity (New Fields)
```typescript
reservationDate: Date        // Date of the reservation
checkedInAt: Date | null     // Timestamp of check-in
isCheckedIn: boolean         // Check-in flag
```

### New Reservation Statuses
- `CHECKED_IN` - Successfully checked in
- `NO_SHOW` - Didn't check in by 11 AM
- `CANCELLED` - Manually cancelled

## Environment Variables

Add to `.env`:
```env
# Existing database config
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=parking

# Message Queue (optional)
ENABLE_QUEUE=true
QUEUE_URL=amqp://localhost:5672
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## Workflow Examples

### Employee Workflow
1. Open app at `http://localhost:3000`
2. Select available parking spot(s) (green)
3. Click "Valider" to reserve
4. On reservation day, scan QR code at parking spot OR enter place number manually
5. Check-in must be completed before 11:00 AM

### Secretary Workflow
1. Access main app for reservation management
2. Use "Expirer sélectionnées" or "Expirer tout" buttons as needed
3. Access `/qr-codes.html` to print QR codes for parking spots
4. Use API endpoints to add/manage users
5. View reservation history via API

### Manager Workflow
1. Access dashboard at `/dashboard.html`
2. View analytics and statistics
3. Make reservations like employees (but for 30 days)
4. Monitor parking usage and trends

## Key Business Rules Enforced

 Maximum 5 working days for employees  
 Maximum 30 days for managers  
 Same-day reservations allowed  
 Electric spots in rows A and F  
 Check-in required by 11 AM  
 No-show auto-marking after 11 AM  
 Complete reservation history  
 Message queue for email notifications  
 QR code check-in support  
 Manager analytics dashboard  
 Secretary admin capabilities  

## Notes

- The system automatically runs migrations on startup
- Old reservations are expired automatically on server start
- QR codes should be printed and laminated for durability
- Message queue is logged to console by default (implement actual queue as needed)
- Weekend days are excluded from employee reservation duration

## Future Enhancements

- Implement authentication (currently stubbed in `/auth/login`)
- Add user email field for email notifications
- Implement actual queue system (RabbitMQ/SQS/Redis)
- Add reservation cancellation by users
- Add push notifications for mobile devices
- Add reporting features for secretaries
