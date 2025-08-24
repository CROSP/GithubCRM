-- CreateTable
CREATE TABLE "public"."github_repositories" (
    "id" TEXT NOT NULL,
    "githubPath" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncAt" TIMESTAMP(3),
    "syncError" TEXT,
    "addedByUserId" TEXT NOT NULL,
    "createdAtGitHub" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_githubPath_key" ON "public"."github_repositories"("githubPath");

-- AddForeignKey
ALTER TABLE "public"."github_repositories" ADD CONSTRAINT "github_repositories_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
