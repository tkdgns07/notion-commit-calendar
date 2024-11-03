/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "tempCommits" (
    "id" SERIAL NOT NULL,
    "SHA" TEXT NOT NULL,

    CONSTRAINT "tempCommits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tempCommits_SHA_key" ON "tempCommits"("SHA");
