-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'family_member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "pricePerSqm" INTEGER,
    "rooms" INTEGER,
    "area" REAL,
    "address" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "type" TEXT NOT NULL,
    "landlordType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "url" TEXT NOT NULL,
    "availableFrom" DATETIME,
    "leaseType" TEXT NOT NULL DEFAULT 'long_term',
    "leaseLength" INTEGER,
    "hasKitchen" BOOLEAN NOT NULL DEFAULT false,
    "hasFurnished" BOOLEAN NOT NULL DEFAULT false,
    "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
    "petFriendly" BOOLEAN NOT NULL DEFAULT false,
    "listedAt" DATETIME NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SearchFilter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minRooms" INTEGER,
    "maxRooms" INTEGER,
    "minArea" REAL,
    "maxArea" REAL,
    "areas" TEXT,
    "types" TEXT,
    "petFriendly" BOOLEAN,
    "furnished" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewListings" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userWhoApplied" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested',
    "appliedAt" DATETIME,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_userWhoApplied_fkey" FOREIGN KEY ("userWhoApplied") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "notes" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailFrequency" TEXT NOT NULL DEFAULT 'daily',
    "dailyDigestTime" TEXT NOT NULL DEFAULT '08:00',
    "notifyNewListings" BOOLEAN NOT NULL DEFAULT true,
    "notifyPriceDrop" BOOLEAN NOT NULL DEFAULT false,
    "notifyStatusChange" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApiPoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "listingsFound" INTEGER NOT NULL,
    "newListings" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "polledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextPollAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_familyId_idx" ON "User"("familyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Family_adminId_idx" ON "Family"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_url_key" ON "Listing"("url");

-- CreateIndex
CREATE INDEX "Listing_isActive_createdAt_idx" ON "Listing"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_address_idx" ON "Listing"("address");

-- CreateIndex
CREATE INDEX "Listing_price_idx" ON "Listing"("price");

-- CreateIndex
CREATE INDEX "Listing_rooms_idx" ON "Listing"("rooms");

-- CreateIndex
CREATE INDEX "Listing_source_idx" ON "Listing"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_externalId_source_key" ON "Listing"("externalId", "source");

-- CreateIndex
CREATE INDEX "SearchFilter_userId_idx" ON "SearchFilter"("userId");

-- CreateIndex
CREATE INDEX "Application_familyId_idx" ON "Application"("familyId");

-- CreateIndex
CREATE INDEX "Application_listingId_idx" ON "Application"("listingId");

-- CreateIndex
CREATE INDEX "Application_userWhoApplied_idx" ON "Application"("userWhoApplied");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Application_familyId_listingId_key" ON "Application"("familyId", "listingId");

-- CreateIndex
CREATE INDEX "ApplicationHistory_applicationId_idx" ON "ApplicationHistory"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationHistory_changedBy_idx" ON "ApplicationHistory"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");
