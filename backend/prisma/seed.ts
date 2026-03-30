import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FamilyOS database...');

  // ---------------------------------------------------------------------------
  // Family members
  // ---------------------------------------------------------------------------
  await prisma.familyMember.upsert({
    where: { id: 'mother' },
    update: {},
    create: { id: 'mother', name: 'Mama', color: '#ec4899' },
  });
  await prisma.familyMember.upsert({
    where: { id: 'father' },
    update: {},
    create: { id: 'father', name: 'Papa', color: '#3b82f6' },
  });
  console.log('  ✓ Family members');

  // ---------------------------------------------------------------------------
  // Task definitions (recurring household tasks)
  // ---------------------------------------------------------------------------
  const tasks = [
    {
      id: 'task-laundry-hang',
      title: 'Wäsche aufhängen',
      type: 'recurring',
      category: 'household',
      effort: 'light',
      durationMinutes: 15,
      recurrence: 'daily',
      fairnessPoints: 2,
      dependsOn: [],
      recurrenceDays: [],
    },
    {
      id: 'task-laundry-fold',
      title: 'Wäsche zusammenlegen',
      type: 'recurring',
      category: 'household',
      effort: 'passive',
      durationMinutes: 20,
      preferredAssigneeId: 'mother',
      recurrence: 'daily',
      fairnessPoints: 2,
      dependsOn: ['task-laundry-hang'],
      recurrenceDays: [],
    },
    {
      id: 'task-laundry-put-away',
      title: 'Wäsche wegräumen',
      type: 'recurring',
      category: 'household',
      effort: 'light',
      durationMinutes: 10,
      assignedToId: 'father',
      recurrence: 'daily',
      fairnessPoints: 2,
      dependsOn: ['task-laundry-fold'],
      recurrenceDays: [],
    },
    {
      id: 'task-dishwasher-unload',
      title: 'Spülmaschine ausräumen',
      type: 'recurring',
      category: 'household',
      effort: 'light',
      durationMinutes: 10,
      recurrence: 'daily',
      fairnessPoints: 2,
      dependsOn: [],
      recurrenceDays: [],
    },
    {
      id: 'task-cat-feeding',
      title: 'Katzen füttern',
      description: 'Morgens und abends',
      type: 'recurring',
      category: 'pets',
      effort: 'light',
      durationMinutes: 5,
      recurrence: 'daily',
      fairnessPoints: 2,
      dependsOn: [],
      recurrenceDays: [],
    },
    {
      id: 'task-cat-litter',
      title: 'Katzenklo reinigen',
      type: 'recurring',
      category: 'pets',
      effort: 'moderate',
      durationMinutes: 10,
      recurrence: 'biweekly',
      fairnessPoints: 5,
      dependsOn: [],
      recurrenceDays: [],
    },
    {
      id: 'task-cat-supplies',
      title: 'Katzenbedarf prüfen',
      description: 'Futter, Streu, Zubehör checken und ggf. bestellen',
      type: 'mental-load',
      category: 'pets',
      effort: 'passive',
      durationMinutes: 10,
      recurrence: 'weekly',
      fairnessPoints: 2,
      dependsOn: [],
      recurrenceDays: [],
    },
    {
      id: 'task-cash-cleaning-lady',
      title: 'Bargeld für Putzfrau bereitlegen',
      type: 'mental-load',
      category: 'admin',
      effort: 'passive',
      durationMinutes: 5,
      recurrence: 'weekly',
      fairnessPoints: 2,
      dependsOn: [],
      recurrenceDays: [2], // Tuesday
    },
    {
      id: 'task-meal-planning',
      title: 'Wochenplan Essen',
      description: 'Mahlzeiten für die Woche planen und Einkaufsliste erstellen',
      type: 'mental-load',
      category: 'food',
      effort: 'passive',
      durationMinutes: 30,
      recurrence: 'weekly',
      fairnessPoints: 3,
      dependsOn: [],
      recurrenceDays: [0], // Sunday
    },
    {
      id: 'task-kindergarten-board',
      title: 'Elternbeirat Kindergarten',
      description: 'Organisatorische Aufgaben für den Elternbeirat',
      type: 'mental-load',
      category: 'childcare',
      effort: 'passive',
      durationMinutes: 60,
      assignedToId: 'mother',
      recurrence: 'weekly',
      fairnessPoints: 5,
      dependsOn: [],
      recurrenceDays: [],
    },
    {
      id: 'task-training-prep-tue',
      title: 'Trainingsvorbereitung Dienstag',
      description: 'Judo-Training am Dienstag vorbereiten',
      type: 'mental-load',
      category: 'personal',
      effort: 'passive',
      durationMinutes: 15,
      assignedToId: 'mother',
      recurrence: 'weekly',
      fairnessPoints: 1,
      dependsOn: [],
      recurrenceDays: [1, 2], // Monday or Tuesday
    },
    {
      id: 'task-training-prep-fri',
      title: 'Trainingsvorbereitung Freitag',
      description: 'Judo-Training am Freitag vorbereiten',
      type: 'mental-load',
      category: 'personal',
      effort: 'passive',
      durationMinutes: 15,
      assignedToId: 'mother',
      recurrence: 'weekly',
      fairnessPoints: 1,
      dependsOn: [],
      recurrenceDays: [4, 5], // Thursday or Friday
    },
  ];

  for (const task of tasks) {
    await prisma.taskDefinition.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }
  console.log(`  ✓ ${tasks.length} task definitions`);

  // ---------------------------------------------------------------------------
  // Calendar events
  // ---------------------------------------------------------------------------
  const events = [
    // Mother's work schedule
    { id: 'work-mother-mon', title: 'Arbeit', dayOfWeek: 1, startTime: '08:00', endTime: '14:00', ownerId: 'mother', type: 'work' },
    { id: 'work-mother-tue', title: 'Arbeit', dayOfWeek: 2, startTime: '08:00', endTime: '12:00', ownerId: 'mother', type: 'work' },
    { id: 'work-mother-wed', title: 'Arbeit (Büro)', dayOfWeek: 3, startTime: '08:00', endTime: '16:00', ownerId: 'mother', type: 'work' },
    { id: 'work-mother-thu', title: 'Arbeit', dayOfWeek: 4, startTime: '08:00', endTime: '14:00', ownerId: 'mother', type: 'work' },
    { id: 'work-mother-fri', title: 'Arbeit', dayOfWeek: 5, startTime: '08:00', endTime: '14:00', ownerId: 'mother', type: 'work' },

    // Father's work schedule
    { id: 'work-father-mon', title: 'Arbeit', dayOfWeek: 1, startTime: '09:00', endTime: '15:00', ownerId: 'father', type: 'work' },
    { id: 'work-father-tue', title: 'Arbeit', dayOfWeek: 2, startTime: '09:00', endTime: '15:00', ownerId: 'father', type: 'work' },
    { id: 'work-father-wed', title: 'Arbeit', dayOfWeek: 3, startTime: '08:00', endTime: '12:00', ownerId: 'father', type: 'work' },
    { id: 'work-father-thu', title: 'Arbeit (Büro)', dayOfWeek: 4, startTime: '08:00', endTime: '18:00', ownerId: 'father', type: 'work' },
    { id: 'work-father-fri', title: 'Arbeit', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', ownerId: 'father', type: 'work' },

    // Mother's activities
    { id: 'event-mother-judo-tue', title: 'Judo unterrichten', dayOfWeek: 2, startTime: '16:30', endTime: '21:00', ownerId: 'mother', type: 'activity', color: '#ec4899' },
    { id: 'event-mother-judo-fri', title: 'Judo unterrichten', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', ownerId: 'mother', type: 'activity', color: '#ec4899' },
    { id: 'event-mother-training-wed', title: 'Eigenes Training', dayOfWeek: 3, startTime: '18:30', endTime: '21:30', ownerId: 'mother', type: 'personal', color: '#ec4899' },

    // Father's activities
    { id: 'event-father-gaming-mon', title: 'Gaming', dayOfWeek: 1, startTime: '21:00', endTime: '24:00', ownerId: 'father', type: 'personal', color: '#3b82f6' },
    { id: 'event-father-gaming-thu', title: 'Gaming', dayOfWeek: 4, startTime: '21:00', endTime: '24:00', ownerId: 'father', type: 'personal', color: '#3b82f6' },

    // Child logistics (Mon-Fri)
    ...([1, 2, 3, 4, 5] as number[]).flatMap((day) => {
      const isWed = day === 3;
      return [
        { id: `event-child-dropoff-${day}`, title: 'Kind bringen', dayOfWeek: day, startTime: '07:30', endTime: '08:00', ownerId: isWed ? 'mother' : 'father', type: 'childcare' },
        { id: `event-child-pickup-${day}`, title: 'Kind abholen', dayOfWeek: day, startTime: '14:30', endTime: '15:00', ownerId: isWed ? 'father' : 'mother', type: 'childcare' },
      ];
    }),

    // Household
    { id: 'event-cleaning-lady-wed', title: 'Putzfrau', dayOfWeek: 3, startTime: '09:00', endTime: '12:00', ownerId: null, ownerType: 'household', type: 'household' },
  ];

  for (const event of events) {
    await prisma.calendarEvent.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        title: event.title,
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
        ownerId: event.ownerId,
        ownerType: event.ownerId ? 'member' : (event as Record<string, unknown>).ownerType as string || 'member',
        type: event.type,
        color: (event as Record<string, unknown>).color as string | undefined,
        isRecurring: true,
      },
    });
  }
  console.log(`  ✓ ${events.length} calendar events`);

  // ---------------------------------------------------------------------------
  // Meals
  // ---------------------------------------------------------------------------
  const meals = [
    { id: 'meal-1', name: 'Pasta mit Tomatensoße', difficulty: 'easy', prepTimeMinutes: 5, cookTimeMinutes: 15, servings: 4, tags: ['quick', 'kids-favorite', 'vegetarian'], ingredients: [] },
    { id: 'meal-2', name: 'Brot mit Aufschnitt', difficulty: 'easy', prepTimeMinutes: 10, cookTimeMinutes: 0, servings: 4, tags: ['quick', 'cold'], ingredients: [] },
    { id: 'meal-3', name: 'Würstchen mit Kartoffelsalat', difficulty: 'easy', prepTimeMinutes: 10, cookTimeMinutes: 15, servings: 4, tags: ['quick', 'kids-favorite'], ingredients: [] },
    { id: 'meal-4', name: 'Pfannkuchen', difficulty: 'easy', prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 4, tags: ['kids-favorite', 'vegetarian'], ingredients: [] },
    { id: 'meal-5', name: 'Tiefkühlpizza', difficulty: 'easy', prepTimeMinutes: 2, cookTimeMinutes: 15, servings: 4, tags: ['quick', 'kids-favorite'], ingredients: [] },
    { id: 'meal-6', name: 'Gemüsesuppe', difficulty: 'medium', prepTimeMinutes: 15, cookTimeMinutes: 30, servings: 4, tags: ['healthy', 'thermomix'], ingredients: [] },
    { id: 'meal-7', name: 'Hähnchen mit Reis', difficulty: 'medium', prepTimeMinutes: 10, cookTimeMinutes: 35, servings: 4, tags: ['protein', 'kids-favorite'], ingredients: [] },
    { id: 'meal-8', name: 'Fischstäbchen mit Kartoffelpüree', difficulty: 'medium', prepTimeMinutes: 10, cookTimeMinutes: 25, servings: 4, tags: ['kids-favorite', 'fish'], ingredients: [] },
    { id: 'meal-9', name: 'Bolognese', difficulty: 'medium', prepTimeMinutes: 15, cookTimeMinutes: 40, servings: 4, tags: ['kids-favorite', 'thermomix', 'batch-cook'], ingredients: [] },
    { id: 'meal-10', name: 'Gemüse-Curry', difficulty: 'medium', prepTimeMinutes: 15, cookTimeMinutes: 25, servings: 4, tags: ['vegetarian', 'healthy', 'thermomix'], ingredients: [] },
    { id: 'meal-11', name: 'Lasagne', difficulty: 'complex', prepTimeMinutes: 30, cookTimeMinutes: 45, servings: 6, tags: ['batch-cook', 'kids-favorite', 'thermomix'], ingredients: [] },
    { id: 'meal-12', name: 'Sonntagsbraten', difficulty: 'complex', prepTimeMinutes: 20, cookTimeMinutes: 120, servings: 6, tags: ['weekend', 'traditional'], ingredients: [] },
    { id: 'meal-13', name: 'Sushi', difficulty: 'complex', prepTimeMinutes: 45, cookTimeMinutes: 30, servings: 4, tags: ['special', 'fish'], ingredients: [] },
    { id: 'meal-14', name: 'Pizza selbstgemacht', difficulty: 'complex', prepTimeMinutes: 30, cookTimeMinutes: 20, servings: 4, tags: ['kids-favorite', 'weekend', 'fun'], ingredients: [] },
  ];

  for (const meal of meals) {
    await prisma.meal.upsert({
      where: { id: meal.id },
      update: {},
      create: meal,
    });
  }
  console.log(`  ✓ ${meals.length} meals`);

  // ---------------------------------------------------------------------------
  // Resources
  // ---------------------------------------------------------------------------
  await prisma.resource.upsert({
    where: { id: 'resource-car-tesla' },
    update: {},
    create: {
      id: 'resource-car-tesla',
      type: 'car',
      name: 'Tesla',
      status: 'available',
      metadata: {
        chargeLevel: 80,
        needsChargeBefore: [3, 4],
        isAvailable: true,
      },
    },
  });
  console.log('  ✓ Resources');

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
