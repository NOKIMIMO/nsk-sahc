# Test Documentation

## Overview
This document describes the test suite for the NSK Parking Reservation System.

## Test Structure

### Test Files

#### 1. `reservation.test.ts` - Core Reservation Logic
Tests the fundamental reservation system functionality:

- **Reservation Creation & Locking**: Validates that reservations lock parking spots and prevent double booking
- **Check-in Functionality**: Ensures users can check in and status updates correctly
- **Duration Rules**: 
  - Employee reservations limited to 5 working days
  - Manager reservations limited to 30 calendar days
- **No-show Handling**: Unchecked-in reservations marked as NO_SHOW after expiration
- **Checked-in Protection**: Active check-ins are not expired prematurely
- **Place Lock Status**: Verifies place availability checking
- **Password Hashing**: Validates bcrypt password security

**Total Tests**: 8

#### 2. `analytics.test.ts` - Dashboard & Reporting
Tests the analytics and reporting features:

- **Total Places Calculation**: Counts all parking spots correctly
- **Electric Places Tracking**: Identifies and counts electric charging spots
- **Current Occupancy**: Calculates real-time occupancy rates
- **No-show Rate**: Tracks and calculates no-show percentages
- **Reservation History**: Retrieves historical data with user and place details
- **Limit Enforcement**: Respects pagination limits in history queries
- **Empty Database Handling**: Gracefully handles no data scenarios

**Total Tests**: 7

#### 3. `place.test.ts` - Parking Place Management
Tests parking place entity and operations:

- **Place Creation**: Creates places with labels and status types
- **Place Retrieval**: Gets all places with availability info
- **Electric vs Regular**: Properly distinguishes electric and regular spots
- **Unique Labels**: Enforces unique constraint on place labels

**Total Tests**: 4

#### 4. `integration.test.ts` - End-to-End Scenarios
Tests complete user workflows and system integration:

- **Complete User Journey**: Reserve → Check-in → Analytics flow
- **Concurrent Reservations**: Multiple users competing for spots
- **Weekend Handling**: Working days calculation for employees
- **Electric vs Regular Distinction**: Type separation in queries
- **Full Lifecycle**: Complete reservation lifecycle with expiration
- **Role-based Limits**: Different durations for employees vs managers
- **Concurrent Check-ins**: Multiple simultaneous check-ins

**Total Tests**: 8

## Test Database

### Configuration
Tests use a separate PostgreSQL database with:
- **Dynamic naming**: `unit-tests-{timestamp}` to avoid conflicts
- **Schema sync**: `synchronize: true` for automatic schema creation
- **Drop on teardown**: `dropSchema: true` to clean up after each test
- **Isolation**: Each test suite gets its own database instance

### Test Data
Tests create their own data using:
- Test users with various roles (EMPLOYEE, SECRETARY, MANAGER, ADMIN)
- Test parking places (both electric and regular)
- Test reservations with different statuses

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm test -- --watch
```

### Specific Test Files
```bash
npm test reservation    # Reservation tests only
npm test analytics      # Analytics tests only
npm test place          # Place tests only
npm test integration    # Integration tests only
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Patterns

### Setup Pattern
Each test file uses a `TestHelper` singleton to:
1. Create a fresh database connection
2. Initialize schema
3. Provide repository access
4. Clean up after tests

```typescript
beforeEach(async () => {
    await testHelper.setupTestDB()
})

afterEach(async () => {
    await testHelper.teardownTestDB()
})
```

### Assertion Examples

**Reservation Status**:
```typescript
expect(reservation.status).toBe(ReservationStatus.LOCKED)
```

**Check-in Verification**:
```typescript
expect(checkedIn.isCheckedIn).toBe(true)
expect(checkedIn.status).toBe(ReservationStatus.CHECKED_IN)
```

**Duration Limits**:
```typescript
const daysDiff = Math.ceil((expiresAt - reservationDate) / (1000 * 60 * 60 * 24))
expect(daysDiff).toBe(30) // Manager
expect(daysDiff).toBeLessThanOrEqual(9) // Employee
```

## Key Test Scenarios

### 1. Normal Reservation Flow
```
Create user → Create place → Reserve → Check-in → Verify status
```

### 2. Conflict Resolution
```
User A reserves spot → User B tries same spot → Expect error
```

### 3. Expiration Handling
```
Create reservation → Set past expiration → Run expiration logic → Verify NO_SHOW
```

### 4. Analytics Calculation
```
Create reservations with various statuses → Calculate analytics → Verify rates
```

## Test Coverage Goals

- **Core Logic**: 100% coverage of reservation service
- **Business Rules**: All duration rules and check-in logic
- **Edge Cases**: Empty databases, concurrent operations, expired data
- **Integration**: Complete user journeys from start to finish

## Continuous Integration

Tests should be run:
- Before every commit
- In CI/CD pipeline
- Before deployment
- After dependency updates

## Future Test Enhancements

- [ ] API endpoint integration tests
- [ ] Load testing for concurrent users
- [ ] Security testing (SQL injection, XSS)
- [ ] Performance benchmarks
- [ ] Mock queue service tests
- [ ] Frontend unit tests
- [ ] E2E browser tests
