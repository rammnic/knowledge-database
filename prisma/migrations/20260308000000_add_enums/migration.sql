-- Add PostgreSQL enum types for Prisma enums
-- This migration is idempotent - can be run multiple times without errors

-- Create enum types (idempotent - skip if already exists)
DO $$ BEGIN
    CREATE TYPE "NoteStatus" AS ENUM ('DRAFT', 'PUBLIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Maturity" AS ENUM ('SEED', 'SAPLING', 'EVERGREEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert existing TEXT columns to enum types (idempotent)
DO $$ BEGIN
    ALTER TABLE "Note" ALTER COLUMN "status" TYPE "NoteStatus" USING "status"::"NoteStatus";
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN invalid_column_definition THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Note" ALTER COLUMN "maturity" TYPE "Maturity" USING "maturity"::"Maturity";
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN invalid_column_definition THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN invalid_column_definition THEN null;
END $$;
