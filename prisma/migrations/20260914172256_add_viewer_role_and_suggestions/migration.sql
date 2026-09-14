-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isViewer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NameSuggestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "meaning" TEXT,
    "gender" "Gender" NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "NameSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NameSuggestion_status_idx" ON "NameSuggestion"("status");

-- AddForeignKey
ALTER TABLE "NameSuggestion" ADD CONSTRAINT "NameSuggestion_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

