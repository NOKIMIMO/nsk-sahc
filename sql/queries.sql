-- Create tables (TypeORM handles this in dev with synchronize)
-- Useful raw queries for production DB setup

CREATE TABLE IF NOT EXISTS "user" (
  id serial PRIMARY KEY,
  "firstName" varchar NOT NULL,
  "lastName" varchar NOT NULL,
  status integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "place" (
  id serial PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "reservation" (
  id serial PRIMARY KEY,
  "placeId" integer NOT NULL REFERENCES "place" (id),
  "userId" integer NOT NULL REFERENCES "user" (id),
  status varchar NOT NULL,
  "createdAt" timestamp without time zone DEFAULT now(),
  "expiresAt" timestamp without time zone NOT NULL
);
