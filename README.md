# NSK Parking Reservation System

A comprehensive parking reservation system built with TypeScript, Express, TypeORM, and PostgreSQL. This system allows employees to reserve parking spots autonomously, with features for check-in, QR codes, manager analytics, and secretary administration.

## Features

 **Smart Reservations**
- Employees: Reserve for up to 5 working days (excluding weekends)
- Managers: Reserve for up to 30 days
- Same-day reservations supported
- Automatic conflict detection

 **Check-in System**
- QR code at each parking spot
- Scan QR or enter place number manually
- Check-in required by 11:00 AM
- Automatic no-show handling

 **Electric Vehicle Support**
- Rows A and F equipped with electric chargers
- Visual indicators in UI
- Analytics on electric spot usage

 **Manager Dashboard**
- Real-time occupancy rates
- Average usage statistics
- No-show tracking
- Historical data analysis

 **Admin Tools**
- Manual reservation management
- User management
- Bulk operations
- Complete reservation history

 **Message Queue Integration**
- Send notifications for reservations
- Extensible for email/SMS systems
- Supports RabbitMQ, AWS SQS, Redis

## Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd nsk-sahc
   npm install
   ```

2. **Configure environment**
   
   Create a `.env` file in the project root:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=yourpassword
   DB_NAME=parking
   
   # Optional: Enable message queue
   ENABLE_QUEUE=false
   QUEUE_URL=amqp://localhost:5672
   ```

3. **Run the application**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   The application will automatically run database migrations on startup.
   
   Production mode:
   ```bash
   npm run build
   npm start
   ```

4. **First Login**
   
   Navigate to http://localhost:3000 (redirects to login page)
   
   **Test Accounts** (password: `password123`):
   - **Employee**: jean.dupont@company.com
   - **Employee**: marie.martin@company.com
   - **Secretary**: sophie.bernard@company.com
   - **Manager**: pierre.dubois@company.com
   - **Admin**: admin@company.com

5. **Access the application**
   - Login: http://localhost:3000/login.html
   - Main UI: http://localhost:3000
   - Manager Dashboard: http://localhost:3000/dashboard.html
   - QR Code Generator: http://localhost:3000/qr-codes.html

## Project Structure

```
nsk-sahc/
├── src/
│   ├── entity/           # TypeORM entities
│   │   ├── User.ts       # User with authentication
│   │   ├── Place.ts      # Parking spots
│   │   └── Reservation.ts # Reservation with status tracking
│   ├── service/          # Business logic
│   │   ├── reservationService.ts  # Core reservation logic
│   │   ├── placeService.ts        # Place management
│   │   ├── analyticsService.ts    # Dashboard analytics
│   │   └── messageQueueService.ts # Notification abstraction
│   ├── routes/           # Express routes
│   │   ├── reservation.ts # Reservation CRUD & check-in
│   │   ├── place.ts       # Place availability
│   │   ├── user.ts        # User management
│   │   ├── dashboard.ts   # Analytics & history
│   │   └── auth.ts        # Login & session
│   ├── migration/        # Database migrations
│   │   ├── 1670000000000-SeedInitial.ts    # Initial places
│   │   ├── 1670000001000-AddUserAuth.ts    # Add email/password
│   │   └── 1670000002000-SeedUsers.ts      # Test users
│   ├── front/            # Frontend files
│   │   ├── login.html/css/js      # Login page
│   │   ├── index.html/css/js      # Main parking UI
│   │   ├── dashboard.html/css/js  # Manager analytics
│   │   └── qr-codes.html/css/js   # QR generator
│   ├── __tests__/        # Test suites
│   │   ├── reservation.test.ts    # Core logic tests
│   │   ├── analytics.test.ts      # Analytics tests
│   │   ├── place.test.ts          # Place tests
│   │   └── integration.test.ts    # E2E tests
│   ├── type/             # TypeScript enums
│   │   ├── UserType.ts   # User roles
│   │   └── PlaceType.ts  # Parking types
│   ├── data-source.ts    # Database configuration
│   └── index.ts          # Application entry point
├── API_REFERENCE.md      # Complete API documentation
├── IMPLEMENTATION_GUIDE.md  # Detailed implementation guide
└── README.md             # This file
```

## User Roles

### Employee (Status: 0)
- Reserve parking spots
- Check-in to reservations
- View available spots
- Max reservation: 5 working days

### Secretary (Status: 1)
- All employee permissions
- Manage users (add, edit, view)
- Manually expire reservations
- Access to QR code generator
- View reservation history

### Manager (Status: 2)
- All employee permissions
- Access to analytics dashboard
- Max reservation: 30 days
- View usage statistics and trends

### Admin (Status: 3)
- All secretary permissions
- Full system access

## API Documentation

See [API_REFERENCE.md](API_REFERENCE.md) for complete API documentation.

### Key Endpoints

- `GET /places` - Get all parking spots with availability
- `POST /reservations/by-label` - Create reservations
- `POST /reservations/checkin/:placeLabel` - Check-in
- `GET /dashboard/analytics` - Get statistics (managers)
- `POST /reservations/expire/all` - Expire all (admin)

## Database Schema

### User
```typescript
{
  id: number
  firstName: string
  lastName: string
  email: string (unique)
  password: string (hashed)
  status: UserType (0=EMPLOYEE, 1=SECRETARY, 2=MANAGER, 3=ADMIN)
}
```

### Place
```typescript
{
  id: number
  label: string (e.g., "A01")
  status: PlaceType (0=REGULAR, 1=ELECTRIC)
}
```

### Reservation
```typescript
{
  id: number
  place: Place
  user: User
  status: ReservationStatus
  reservationDate: Date
  expiresAt: Date
  isCheckedIn: boolean
  checkedInAt: Date
  createdAt: Date
}
```

**Reservation Statuses:**
- `LOCKED` - Active reservation, not yet checked in
- `CHECKED_IN` - User has checked in
- `EXPIRED` - Reservation expired normally
- `NO_SHOW` - User didn't check in by deadline
- `CANCELLED` - Manually cancelled

## Parking Layout

- **60 total spots** across 6 rows (A-F)
- **10 spots per row** (01-10)
- **Rows A & F**: Electric charging stations
- **Rows B-E**: Regular parking

## Business Rules

1. **Reservation Duration**
   - Employees: Max 5 working days (Mon-Fri only)
   - Managers: Max 30 calendar days
   - Can start on current day if available

2. **Check-in Requirements**
   - Must check-in by 11:00 AM on reservation day
   - Can scan QR code or enter place number
   - No check-in = automatic NO_SHOW status
   - Spot becomes available for same-day reservation

3. **Electric Charging**
   - Users needing charging must select rows A or F
   - 20 electric spots total (33% of parking)

4. **History Tracking**
   - All reservations kept permanently
   - Full audit trail with statuses
   - Analytics based on historical data

## Development

### Available Scripts

```bash
npm run dev       # Development with hot-reload
npm run build     # Compile TypeScript
npm start         # Run production build
npm test          # Run tests
npm run lint      # Lint code
npm run format    # Format code
```

### Testing

```bash
npm test
```

Tests are located in `src/__tests__/`

## Production Deployment

1. Set environment variables
2. Build the application: `npm run build`
3. Run database migrations: automatic on start
4. Start the server: `npm start`
5. *Configure reverse proxy (nginx/Apache) (optional)
6. *Set up SSL certificate

## Docker Support

```bash
docker-compose up
```

See [docker-compose.yml](docker-compose.yml) for configuration.

## Documentation

- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Detailed feature guide
- [TEST_DOCUMENTATION.md](TEST_DOCUMENTATION.md) - Test suite overview and patterns
- [adr.md](adr.md) - Architecture decisions
- [archi.drawio.png](archi.drawio.png) - Architecture diagram

## Security

### Authentication System
- **Token-based authentication** with session management
- **Password hashing** using bcryptjs
- **24-hour session expiration** for security
- **Role-based access control** at UI and API level
- **Protected routes** requiring valid authentication

### Security Best Practices
- Passwords are hashed before storage
- Tokens stored in localStorage (client-side)
- Token verification on protected endpoints
- CORS enabled for frontend access

## Testing

### Run Tests
```bash
npm test          # Run all tests
npm test -- --watch  # Run in watch mode
```

### Test Coverage
- Reservation creation and locking
- Check-in functionality
- Expiration logic
- Duration rules (5 days employees, 30 days managers)
- No-show handling
- Authentication flow
- Analytics calculations
- Place management
- Integration scenarios

### Test Files
- `reservation.test.ts` - Core reservation logic and check-in
- `analytics.test.ts` - Dashboard analytics and reporting
- `place.test.ts` - Parking place management
- `integration.test.ts` - End-to-end user journeys

### Running Specific Tests
```bash
npm test reservation    # Run reservation tests only
npm test analytics      # Run analytics tests only
npm test integration    # Run integration tests only
```

Tests are located in `src/__tests__/` and use an in-memory PostgreSQL database.

## Future Enhancements

- [X] User authentication & authorization
- [X] Password-based login system
- [X] History export (CSV)
- [ ] Email notifications implementation
- [ ] Mobile app (Flutter)
- [ ] Push notifications
- [ ] Reservation cancellation by users
- [ ] Multi-location support
- [ ] Integration with access control systems
- [ ] Two-factor authentication
- [ ] Password reset functionality

## Support

For issues or questions, please contact the development team.

## License

ISC
