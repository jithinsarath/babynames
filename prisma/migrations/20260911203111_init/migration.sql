-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('BOY', 'GIRL');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('YES', 'NO', 'MAYBE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Name" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Name_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Name_gender_idx" ON "Name"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "Name_normalizedText_gender_key" ON "Name"("normalizedText", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_nameId_key" ON "Vote"("userId", "nameId");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_userId_nameId_key" ON "Ranking"("userId", "nameId");

-- AddForeignKey
ALTER TABLE "Name" ADD CONSTRAINT "Name_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Name"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Name"("id") ON DELETE CASCADE ON UPDATE CASCADE;
