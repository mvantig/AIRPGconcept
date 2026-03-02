-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'fictional',
    "persona" TEXT NOT NULL,
    "gameState" TEXT NOT NULL,
    "chatHistory" TEXT NOT NULL,
    "storySummary" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "saveType" TEXT NOT NULL DEFAULT 'auto',
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameSession" ("chatHistory", "createdAt", "gameMode", "gameState", "id", "imageUrl", "persona", "storySummary", "universe", "updatedAt", "userId") SELECT "chatHistory", "createdAt", "gameMode", "gameState", "id", "imageUrl", "persona", "storySummary", "universe", "updatedAt", "userId" FROM "GameSession";
DROP TABLE "GameSession";
ALTER TABLE "new_GameSession" RENAME TO "GameSession";
CREATE INDEX "GameSession_userId_updatedAt_idx" ON "GameSession"("userId", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
