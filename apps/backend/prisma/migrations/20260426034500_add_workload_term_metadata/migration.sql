ALTER TABLE "workload_items"
  ADD COLUMN IF NOT EXISTS "academicTerm" "AcademicTerm",
  ADD COLUMN IF NOT EXISTS "semesterNumber" INTEGER,
  ADD COLUMN IF NOT EXISTS "courseYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "level" "StudyLevel",
  ADD COLUMN IF NOT EXISTS "studyType" "StudyType";

UPDATE "workload_items" wi
SET
  "academicTerm" = COALESCE(wi."academicTerm", so."academicTerm"),
  "semesterNumber" = COALESCE(wi."semesterNumber", so."semesterNumber"),
  "courseYear" = COALESCE(wi."courseYear", so."courseYear"),
  "level" = COALESCE(wi."level", s."level"),
  "studyType" = COALESCE(wi."studyType", so."studyType")
FROM "subject_offerings" so
JOIN "subjects" s ON s.id = so."subjectId"
WHERE wi."subjectOfferingId" = so.id;

UPDATE "workload_items" wi
SET
  "academicTerm" = COALESCE(wi."academicTerm", g."academicTerm"),
  "semesterNumber" = COALESCE(wi."semesterNumber", g."semesterNumber"),
  "courseYear" = COALESCE(wi."courseYear", g."courseYear"),
  "level" = COALESCE(wi."level", g."level"),
  "studyType" = COALESCE(wi."studyType", g."studyType")
FROM "groups" g
WHERE wi."groupId" = g.id;
