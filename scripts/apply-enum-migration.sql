-- ===========================================
-- Apply enum types migration
-- Run this script directly in PostgreSQL to fix missing enum types
-- ===========================================

-- Create enum types
CREATE TYPE "NoteStatus" AS ENUM ('DRAFT', 'PUBLIC');
CREATE TYPE "Maturity" AS ENUM ('SEED', 'SAPLING', 'EVERGREEN');
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Convert existing TEXT columns to enum types
ALTER TABLE "Note" ALTER COLUMN "status" TYPE "NoteStatus" USING "status"::"NoteStatus";
ALTER TABLE "Note" ALTER COLUMN "maturity" TYPE "Maturity" USING "maturity"::"Maturity";
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";