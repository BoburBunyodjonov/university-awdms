ALTER TABLE "lecture_streams" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
CREATE INDEX "lecture_streams_name_idx" ON "lecture_streams"("name");
