/*
  Warnings:

  - You are about to drop the `tempCommits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "tempCommits";

-- CreateTable
CREATE TABLE "TempCommits" (
    "id" SERIAL NOT NULL,
    "SHA" TEXT NOT NULL,

    CONSTRAINT "TempCommits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempCommits_SHA_key" ON "TempCommits"("SHA");
