-- Enforce "no duplicate" workload rows at DB level (complements API checks)
-- Group-scoped items: one row per (year, subject offering, group, workload type)
CREATE UNIQUE INDEX IF NOT EXISTS "workload_items_dedup_group_uq"
ON "workload_items" ("academicYearId", "subjectOfferingId", "groupId", "workloadType")
WHERE "groupId" IS NOT NULL AND "subjectOfferingId" IS NOT NULL;

-- Stream-level items (lecture / control) without a group id
CREATE UNIQUE INDEX IF NOT EXISTS "workload_items_dedup_stream_uq"
ON "workload_items" ("academicYearId", "lectureStreamId", "workloadType")
WHERE "lectureStreamId" IS NOT NULL
  AND "groupId" IS NULL;
