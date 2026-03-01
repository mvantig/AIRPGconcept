-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'fictional',
    "persona" TEXT NOT NULL,
    "gameState" TEXT NOT NULL,
    "chatHistory" TEXT NOT NULL,
    "storySummary" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GameSession_userId_updatedAt_idx" ON "GameSession"("userId", "updatedAt");
