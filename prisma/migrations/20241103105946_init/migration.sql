/*
  Warnings:

  - You are about to drop the `TempCommits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TempCommits";

-- CreateTable
CREATE TABLE "Tempcommits" (
    "id" SERIAL NOT NULL,
    "SHA" TEXT NOT NULL,

    CONSTRAINT "Tempcommits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tempcommits_SHA_key" ON "Tempcommits"("SHA");
