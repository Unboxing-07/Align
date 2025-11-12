-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "edges" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "nodes" JSONB NOT NULL DEFAULT '[]';
