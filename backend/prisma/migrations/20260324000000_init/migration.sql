-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDefinition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "fairnessPoints" INTEGER NOT NULL,
    "assigned_to" TEXT,
    "preferred_assignee" TEXT,
    "recurrence" TEXT,
    "recurrenceDays" INTEGER[],
    "preferredStart" TEXT,
    "preferredEnd" TEXT,
    "dependsOn" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInstance" (
    "id" TEXT NOT NULL,
    "task_definition_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "task_instance_id" TEXT NOT NULL,
    "task_definition_id" TEXT NOT NULL,
    "completed_by" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fairnessPoints" INTEGER NOT NULL,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FairnessRecord" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "task_completion_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FairnessRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "owner_id" TEXT,
    "owner_type" TEXT NOT NULL DEFAULT 'member',
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prep_time_minutes" INTEGER NOT NULL,
    "cook_time_minutes" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "tags" TEXT[],
    "ingredients" TEXT[],
    "cookidoo_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "meal_id" TEXT,
    "assigned_to" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThankYou" (
    "id" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "task_id" TEXT,
    "message" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThankYou_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TakeOver" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TakeOver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StressMode" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "activated_by" TEXT NOT NULL,
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "StressMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskDefinition_category_idx" ON "TaskDefinition"("category");

-- CreateIndex
CREATE INDEX "TaskDefinition_type_idx" ON "TaskDefinition"("type");

-- CreateIndex
CREATE INDEX "TaskDefinition_isActive_idx" ON "TaskDefinition"("isActive");

-- CreateIndex
CREATE INDEX "TaskInstance_date_idx" ON "TaskInstance"("date");

-- CreateIndex
CREATE INDEX "TaskInstance_status_idx" ON "TaskInstance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskInstance_task_definition_id_date_key" ON "TaskInstance"("task_definition_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_task_instance_id_key" ON "TaskCompletion"("task_instance_id");

-- CreateIndex
CREATE INDEX "TaskCompletion_completed_by_idx" ON "TaskCompletion"("completed_by");

-- CreateIndex
CREATE INDEX "TaskCompletion_completedAt_idx" ON "TaskCompletion"("completedAt");

-- CreateIndex
CREATE INDEX "TaskCompletion_task_definition_id_idx" ON "TaskCompletion"("task_definition_id");

-- CreateIndex
CREATE INDEX "FairnessRecord_member_id_date_idx" ON "FairnessRecord"("member_id", "date");

-- CreateIndex
CREATE INDEX "FairnessRecord_date_idx" ON "FairnessRecord"("date");

-- CreateIndex
CREATE INDEX "CalendarEvent_day_of_week_idx" ON "CalendarEvent"("day_of_week");

-- CreateIndex
CREATE INDEX "MealPlanEntry_date_idx" ON "MealPlanEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlanEntry_date_meal_type_key" ON "MealPlanEntry"("date", "meal_type");

-- CreateIndex
CREATE INDEX "ThankYou_date_idx" ON "ThankYou"("date");

-- CreateIndex
CREATE INDEX "TakeOver_date_idx" ON "TakeOver"("date");

-- CreateIndex
CREATE INDEX "StressMode_active_idx" ON "StressMode"("active");

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_preferred_assignee_fkey" FOREIGN KEY ("preferred_assignee") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_task_definition_id_fkey" FOREIGN KEY ("task_definition_id") REFERENCES "TaskDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_task_instance_id_fkey" FOREIGN KEY ("task_instance_id") REFERENCES "TaskInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_task_definition_id_fkey" FOREIGN KEY ("task_definition_id") REFERENCES "TaskDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FairnessRecord" ADD CONSTRAINT "FairnessRecord_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThankYou" ADD CONSTRAINT "ThankYou_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThankYou" ADD CONSTRAINT "ThankYou_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThankYou" ADD CONSTRAINT "ThankYou_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TaskDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TakeOver" ADD CONSTRAINT "TakeOver_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TaskDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TakeOver" ADD CONSTRAINT "TakeOver_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TakeOver" ADD CONSTRAINT "TakeOver_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StressMode" ADD CONSTRAINT "StressMode_activated_by_fkey" FOREIGN KEY ("activated_by") REFERENCES "FamilyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

