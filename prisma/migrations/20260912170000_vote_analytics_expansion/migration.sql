-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "flipCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deckPosition" INTEGER,
ADD COLUMN     "viaSearch" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ranking" ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VoteEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "decisionMs" INTEGER,
    "deckPosition" INTEGER,
    "viaSearch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoteEvent_userId_nameId_createdAt_idx" ON "VoteEvent"("userId", "nameId", "createdAt");

-- AddForeignKey
ALTER TABLE "VoteEvent" ADD CONSTRAINT "VoteEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteEvent" ADD CONSTRAINT "VoteEvent_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Name"("id") ON DELETE CASCADE ON UPDATE CASCADE;
