# NSK Parking API Reference

## Base URL
```
http://localhost:3000
```

## Endpoints

### Places

#### Get All Places with Availability
```http
GET /places
```

**Response:**
```json
{
  "places": [
    {
      "id": "A01",
      "isOccupied": false,
      "isElectric": true
    },
    {
      "id": "B05",
      "isOccupied": true,
      "isElectric": false
    }
  ]
}
```

#### Check Place Availability
```http
GET /places/:id/availability
```

**Parameters:**
- `id` (path) - Place ID (numeric)

**Response:**
```json
{
  "placeId": 1,
  "available": true
}
```

---

### Reservations

#### Create Reservation by Place ID
```http
POST /reservations
```

**Body:**
```json
{
  "placeId": 1,
  "userId": 1
}
```

**Response (201):**
```json
{
  "id": 123,
  "status": "LOCKED",
  "reservationDate": "2026-03-01T10:00:00.000Z",
  "expiresAt": "2026-03-08T10:00:00.000Z",
  "isCheckedIn": false,
  "checkedInAt": null,
  "place": {
    "id": 1,
    "label": "A01",
    "status": 1
  },
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "status": 0
  }
}
```

**Error (400):**
```json
{
  "error": "Place already reserved"
}
```

#### Create Reservations by Labels (Batch)
```http
POST /reservations/by-label
```

**Body:**
```json
{
  "labels": ["A01", "A02", "B03"]
}
```

**Response (201):**
```json
{
  "success": [
    {
      "label": "A01",
      "reservation": { /* reservation object */ }
    },
    {
      "label": "A02",
      "reservation": { /* reservation object */ }
    }
  ],
  "errors": [
    {
      "label": "B03",
      "error": "Place already reserved"
    }
  ],
  "total": 3,
  "created": 2
}
```

#### Check-in to Reservation
```http
POST /reservations/checkin/:placeLabel
```

**Parameters:**
- `placeLabel` (path) - Place label (e.g., "A01")

**Response (200):**
```json
{
  "message": "Check-in successful",
  "placeLabel": "A01",
  "reservation": { /* updated reservation object */ }
}
```

**Error (400):**
```json
{
  "error": "No active reservation found for this place today"
}
```

#### Expire All Reservations (Admin)
```http
POST /reservations/expire/all
```

**Response (200):**
```json
{
  "message": "5 reservation(s) expired",
  "count": 5
}
```

#### Expire Selected Reservations (Admin)
```http
POST /reservations/expire/selected
```

**Body:**
```json
{
  "labels": ["A01", "B05"]
}
```

**Response (200):**
```json
{
  "message": "2 reservation(s) expired",
  "count": 2,
  "labels": ["A01", "B05"]
}
```

---

### Users

#### List All Users
```http
GET /users
```

**Response:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "status": 0
  },
  {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "status": 2
  }
]
```

#### Get User by ID
```http
GET /users/:id
```

**Parameters:**
- `id` (path) - User ID

**Response (200):**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "status": 0
}
```

**Response (404):**
```
Not found
```

#### Create User
```http
POST /users
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "status": 0
}
```

**User Status Values:**
- `0` - EMPLOYEE
- `1` - SECRETARY
- `2` - MANAGER
- `3` - ADMIN

**Response (201):**
```json
{
  "id": 5,
  "firstName": "John",
  "lastName": "Doe",
  "status": 0
}
```

---

### Dashboard (Manager/Admin)

#### Get Parking Analytics
```http
GET /dashboard/analytics
```

**Response (200):**
```json
{
  "totalPlaces": 60,
  "electricPlaces": 20,
  "electricPlacesPercentage": 33.33,
  "currentOccupancy": 15,
  "currentOccupancyRate": 25.0,
  "averageOccupancy": 18.5,
  "averageOccupancyRate": 30.83,
  "totalReservations": 250,
  "totalReservationsLast30Days": 45,
  "checkedInReservations": 200,
  "noShowReservations": 5,
  "noShowRate": 11.11,
  "period": {
    "from": "2026-01-30T10:00:00.000Z",
    "to": "2026-03-01T10:00:00.000Z"
  }
}
```

#### Get Reservation History
```http
GET /dashboard/reservations/history?limit=100
```

**Query Parameters:**
- `limit` (optional) - Maximum number of records (default: 100)

**Response (200):**
```json
{
  "reservations": [
    {
      "id": 123,
      "status": "CHECKED_IN",
      "reservationDate": "2026-03-01",
      "expiresAt": "2026-03-08T10:00:00.000Z",
      "createdAt": "2026-02-28T15:00:00.000Z",
      "isCheckedIn": true,
      "checkedInAt": "2026-03-01T08:30:00.000Z",
      "place": {
        "id": 1,
        "label": "A01",
        "status": 1
      },
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "status": 0
      }
    }
  ],
  "count": 1
}
```

#### Get User's Reservation History
```http
GET /dashboard/reservations/user/:userId
```

**Parameters:**
- `userId` (path) - User ID

**Response (200):**
```json
{
  "reservations": [ /* array of reservation objects */ ],
  "count": 15
}
```

---

### Authentication (Not Implemented)

#### Login
```http
POST /auth/login
```

**Response (501):**
```json
{
  "error": "Not implemented"
}
```

---

## Reservation Status Values

- `LOCKED` - Active reservation, waiting for check-in
- `CHECKED_IN` - User has checked in successfully
- `EXPIRED` - Reservation expired after expiration date
- `NO_SHOW` - User didn't check in by 11 AM
- `CANCELLED` - Manually cancelled (future use)

## Place Status Values

- `0` - DEFAULT (regular parking spot)
- `1` - ELEC (electric charging spot)

## Error Responses

All endpoints may return the following error format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `501` - Not Implemented

---

## Message Queue Events

When a reservation is created or checked in, a message is sent to the configured queue:

### RESERVATION_CREATED
```json
{
  "type": "RESERVATION_CREATED",
  "reservationId": 123,
  "userId": 1,
  "userName": "John Doe",
  "placeLabel": "A01",
  "reservationDate": "2026-03-01T10:00:00.000Z",
  "expiresAt": "2026-03-08T10:00:00.000Z",
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

### RESERVATION_CHECKED_IN
```json
{
  "type": "RESERVATION_CHECKED_IN",
  "reservationId": 123,
  "userId": 1,
  "userName": "John Doe",
  "placeLabel": "A01",
  "reservationDate": "2026-03-01T10:00:00.000Z",
  "expiresAt": "2026-03-08T10:00:00.000Z",
  "timestamp": "2026-03-01T10:30:00.000Z"
}
```

---

## CORS

The API enables CORS for all origins (`*`). In production, configure this to specific domains.

## Notes

- All dates are in ISO 8601 format
- Timestamps include timezone information
- Check-in must be done before 11:00 AM on the reservation date
- Employees can reserve for 5 working days maximum
- Managers can reserve for 30 calendar days maximum
- Electric spots are in rows A and F
