import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const INITIAL_EXERCISES = [
  {
    name: 'Flat Bench Press',
    category: 'CHEST',
    description:
      'Compound barbell press for pectoral, anterior deltoid, and tricep development.',
    instructions:
      'Lie on bench, retract scapula, grip bar slightly wider than shoulder width, lower bar to mid-chest with control, and press upward.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 1,
    isActive: true,
  },
  {
    name: 'Incline DB Press',
    category: 'CHEST',
    description:
      'Incline dumbbell press targeting upper clavicular pectorals and shoulders.',
    instructions:
      'Set bench to 30-45 degrees, press dumbbells overhead with control, lower until elbows are at ~90 degrees.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 2,
    isActive: true,
  },
  {
    name: 'Pec Dec Fly',
    category: 'CHEST',
    description:
      'Machine chest fly for targeted pectoral isolation and horizontal adduction.',
    instructions:
      'Adjust seat so handles align with mid-chest. Keep slight bend in elbows and squeeze chest at center.',
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 15,
    orderIndex: 3,
    isActive: true,
  },
  {
    name: 'Dips',
    category: 'CHEST',
    description:
      'Bodyweight or weighted compound exercise for lower chest, triceps, and shoulders.',
    instructions:
      'Support body on parallel bars, lean forward slightly for chest focus, lower until elbows reach 90 degrees, and push back up.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 4,
    isActive: true,
  },
  {
    name: 'Lat Pulldowns',
    category: 'BACK',
    description:
      'Vertical pulling machine movement for latissimus dorsi and upper back width.',
    instructions:
      'Grip bar wide with overhand grip, sit with thighs secured under pads, pull bar down towards upper chest while arching back slightly.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 5,
    isActive: true,
  },
  {
    name: 'Seated Rows',
    category: 'BACK',
    description:
      'Horizontal cable row for mid-back thickness, rhomboids, and lower traps.',
    instructions:
      'Sit upright with feet on footplates, pull handle to abdomen while retracting shoulder blades, and control the return.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 6,
    isActive: true,
  },
  {
    name: 'Bent Over Rows',
    category: 'BACK',
    description:
      'Barbell or dumbbell free-weight rowing for total posterior chain and back strength.',
    instructions:
      'Hinge at hips with flat back at 45 degrees, row bar to lower ribcage, squeezing lats and upper back at peak contraction.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 7,
    isActive: true,
  },
  {
    name: 'Shoulder Press',
    category: 'SHOULDERS',
    description:
      'Overhead pressing movement for anterior and lateral deltoid mass.',
    instructions:
      'Press dumbbells or barbell overhead from shoulder height until arms are fully extended without locking elbows hard.',
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    orderIndex: 8,
    isActive: true,
  },
  {
    name: 'Lateral Raise',
    category: 'SHOULDERS',
    description:
      'Isolation exercise targeting lateral deltoids for shoulder width.',
    instructions:
      'Hold dumbbells at sides with slight elbow bend, raise arms out to sides until parallel with floor, then lower under control.',
    defaultSets: 3,
    defaultRepsMin: 12,
    defaultRepsMax: 15,
    orderIndex: 9,
    isActive: true,
  },
  {
    name: 'Reverse Fly',
    category: 'SHOULDERS',
    description: 'Targeted rear deltoid and upper back isolation movement.',
    instructions:
      'Hinge forward or use rear pec-dec machine, fly arms outward horizontally, squeezing posterior deltoids.',
    defaultSets: 3,
    defaultRepsMin: 12,
    defaultRepsMax: 15,
    orderIndex: 10,
    isActive: true,
  },
  {
    name: 'Shrug',
    category: 'SHOULDERS',
    description:
      'Heavy barbell or dumbbell movement for upper trapezius development.',
    instructions:
      'Hold heavy weights at sides, elevate shoulders towards ears in a straight vertical path, pause at top, and lower with control.',
    defaultSets: 3,
    defaultRepsMin: 12,
    defaultRepsMax: 15,
    orderIndex: 11,
    isActive: true,
  },
  {
    name: 'Skull Crusher',
    category: 'ARMS',
    description:
      'Lying triceps extension with EZ-bar or dumbbells targeting the long and medial triceps heads.',
    instructions:
      'Lie on flat bench, extend arms upward with EZ-bar, bend elbows to lower bar towards forehead/crown, and extend back to start.',
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    orderIndex: 12,
    isActive: true,
  },
  {
    name: 'Biceps Curl',
    category: 'ARMS',
    description:
      'Standard barbell or dumbbell supinated curl for bicep hypertrophy.',
    instructions:
      'Stand tall with shoulders pinned, curl weight upward with supinated palms, squeezing biceps at top.',
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    orderIndex: 13,
    isActive: true,
  },
  {
    name: 'Hammer Curl',
    category: 'ARMS',
    description:
      'Neutral-grip dumbbell curl targeting brachialis and brachioradialis forearm muscles.',
    instructions:
      'Hold dumbbells with neutral palms facing each other, curl upward while maintaining neutral wrist alignment.',
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    orderIndex: 14,
    isActive: true,
  },
  {
    name: 'Squat',
    category: 'LEGS',
    description:
      'Primary compound lower body barbell exercise for quadriceps, glutes, hamstrings, and core.',
    instructions:
      'Rest bar across upper traps/rear delts, descend by breaking at hips and knees until thighs are at or below parallel, drive through mid-foot.',
    defaultSets: 4,
    defaultRepsMin: 6,
    defaultRepsMax: 10,
    orderIndex: 15,
    isActive: true,
  },
  {
    name: 'Leg Extension',
    category: 'LEGS',
    description:
      'Machine isolation exercise for quadriceps development and knee extension.',
    instructions:
      'Sit in machine with pad resting on lower shins, extend legs until almost straight, hold peak contraction for 1 second, and lower slowly.',
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 15,
    orderIndex: 16,
    isActive: true,
  },
  {
    name: 'Leg Curl',
    category: 'LEGS',
    description:
      'Lying or seated hamstring machine curl for knee flexion and hamstring development.',
    instructions:
      'Align knee joint with machine pivot point, curl heels towards glutes smoothly, and control the eccentric return.',
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 15,
    orderIndex: 17,
    isActive: true,
  },
  {
    name: 'Calf Raises',
    category: 'LEGS',
    description:
      'Standing or seated calf raise for gastrocnemius and soleus hypertrophy.',
    instructions:
      'Place balls of feet on elevated block, drop heels for deep stretch, press up onto toes fully, and hold peak contraction.',
    defaultSets: 4,
    defaultRepsMin: 12,
    defaultRepsMax: 20,
    orderIndex: 18,
    isActive: true,
  },
  {
    name: 'Leg Raises',
    category: 'CORE',
    description:
      'Hanging or captain chair leg raise targeting lower rectus abdominis and hip flexors.',
    instructions:
      'Hang from bar or support forearms on captain chair, raise legs straight or bent towards chest without swinging torso.',
    defaultSets: 3,
    defaultRepsMin: 12,
    defaultRepsMax: 15,
    orderIndex: 19,
    isActive: true,
  },
  {
    name: 'Russian Twist',
    category: 'CORE',
    description:
      'Rotational core exercise targeting internal and external obliques.',
    instructions:
      'Sit with knees bent and feet elevated, lean back slightly, rotate torso side to side touching hands or weight to the floor.',
    defaultSets: 3,
    defaultRepsMin: 15,
    defaultRepsMax: 20,
    orderIndex: 20,
    isActive: true,
  },
  {
    name: 'Plank',
    category: 'CORE',
    description:
      'Isometric core stabilization exercise for transverse abdominis, rectus abdominis, and lower back.',
    instructions:
      'Hold prone forearm plank position with body in straight line from head to heels, bracing core and glutes firmly.',
    defaultSets: 3,
    defaultRepsMin: 30,
    defaultRepsMax: 60,
    orderIndex: 21,
    isActive: true,
  },
];
export const INITIAL_MEAL_PLAN = {
  name: 'Standard 4-Meal Plan',
  description: 'Balanced muscle building & recovery daily nutrition plan',
  meals: [
    {
      name: 'Meal 1',
      orderIndex: 1,
      items: [
        {
          name: 'Whole Egg',
          quantity: 4,
          unit: 'pcs',
          displayQuantity: '4 Whole Egg',
          orderIndex: 1,
        },
        {
          name: 'Oats',
          quantity: 40,
          unit: 'g',
          displayQuantity: '40g Oats',
          orderIndex: 2,
        },
        {
          name: 'Peanuts',
          quantity: 10,
          unit: 'g',
          displayQuantity: '10g Peanuts',
          orderIndex: 3,
        },
        {
          name: 'Banana',
          quantity: 100,
          unit: 'g',
          displayQuantity: '100g Banana',
          orderIndex: 4,
        },
      ],
    },
    {
      name: 'Meal 2',
      orderIndex: 2,
      items: [
        {
          name: 'Chicken Breast',
          quantity: 150,
          unit: 'g',
          displayQuantity: '150g Chicken Breast',
          orderIndex: 1,
        },
        {
          name: 'Rice',
          quantity: 50,
          unit: 'g',
          displayQuantity: '50g Rice',
          orderIndex: 2,
        },
        {
          name: 'Mixed Veg',
          quantity: 150,
          unit: 'g',
          displayQuantity: '150g Mixed Veg',
          orderIndex: 3,
        },
      ],
    },
    {
      name: 'Meal 3',
      orderIndex: 3,
      items: [
        {
          name: 'Curd',
          quantity: 150,
          unit: 'g',
          displayQuantity: '150g Curd',
          orderIndex: 1,
        },
        {
          name: 'Apple',
          quantity: 50,
          unit: 'g',
          displayQuantity: '50g Apple',
          orderIndex: 2,
        },
        {
          name: 'Peanut Butter',
          quantity: 10,
          unit: 'g',
          displayQuantity: '10g Peanut Butter',
          orderIndex: 3,
        },
      ],
    },
    {
      name: 'Meal 4',
      orderIndex: 4,
      items: [
        {
          name: 'Chicken Breast',
          quantity: 150,
          unit: 'g',
          displayQuantity: '150g Chicken Breast',
          orderIndex: 1,
        },
        {
          name: 'Rotis/Chappati',
          quantity: 2,
          unit: 'pcs',
          displayQuantity: '2 Rotis/Chappati',
          orderIndex: 2,
        },
        {
          name: 'Spinach',
          quantity: 100,
          unit: 'g',
          displayQuantity: '100g Spinach',
          orderIndex: 3,
        },
        {
          name: 'Butter',
          quantity: 5,
          unit: 'g',
          displayQuantity: '5g Butter',
          orderIndex: 4,
        },
      ],
    },
  ],
};
async function seedMealPlans() {
  console.log('Seeding initial 4-meal plan for users...');
  const users = await prisma.user.findMany();
  for (const user of users) {
    const existingPlan = await prisma.mealPlan.findFirst({
      where: { userId: user.id },
      include: { meals: { include: { items: true } } },
    });
    if (!existingPlan) {
      await prisma.mealPlan.create({
        data: {
          userId: user.id,
          name: INITIAL_MEAL_PLAN.name,
          description: INITIAL_MEAL_PLAN.description,
          isActive: true,
          meals: {
            create: INITIAL_MEAL_PLAN.meals.map((m) => ({
              name: m.name,
              orderIndex: m.orderIndex,
              items: {
                create: m.items.map((it) => ({
                  name: it.name,
                  quantity: it.quantity,
                  unit: it.unit,
                  displayQuantity: it.displayQuantity,
                  orderIndex: it.orderIndex,
                })),
              },
            })),
          },
        },
      });
      console.log(
        `[CREATED MEAL PLAN] Standard 4-Meal Plan for user ${user.email}`,
      );
    } else {
      console.log(
        `[SKIPPED] User ${user.email} already has meal plan: ${existingPlan.name}`,
      );
    }
  }
}
async function main() {
  console.log('Seeding initial exercise library into database...');
  for (const exercise of INITIAL_EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: { equals: exercise.name, mode: 'insensitive' } },
    });
    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          category: exercise.category,
          description: exercise.description,
          instructions: exercise.instructions,
          defaultSets: exercise.defaultSets,
          defaultRepsMin: exercise.defaultRepsMin,
          defaultRepsMax: exercise.defaultRepsMax,
          orderIndex: exercise.orderIndex,
          isActive: exercise.isActive,
        },
      });
      console.log(`[UPDATED] ${exercise.name} (${exercise.category})`);
    } else {
      await prisma.exercise.create({
        data: exercise,
      });
      console.log(`[CREATED] ${exercise.name} (${exercise.category})`);
    }
  }
  const count = await prisma.exercise.count();
  console.log(
    `Successfully seeded exercise library! Total exercises in database: ${count}`,
  );
  await seedMealPlans();
}
main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
//# sourceMappingURL=seed.js.map
