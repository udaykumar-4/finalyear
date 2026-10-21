import { PrakritiQuestion } from '../types/prakriti';

export const PRAKRITI_THEME = {
  // Backgrounds & Warm Ivory
  ivoryBg: '#FAF7F2',
  ivorySurface: '#FDFBF7',
  ivoryCard: '#FFFFFF',

  // Greens & Accents
  sageBorder: '#D1E0D1',
  sageLight: '#EBF2EB',
  sageDark: '#5C7C5D',
  forestGreen: '#1E3F2B',
  forestGreenHover: '#163121',

  // Dosha-specific hues
  vata: {
    primary: '#7C3AED',
    light: '#F3E8FF',
    border: '#DDD6FE',
    name: 'Vata (Air & Space)',
  },
  pitta: {
    primary: '#EA580C',
    light: '#FFEDD5',
    border: '#FED7AA',
    name: 'Pitta (Fire & Water)',
  },
  kapha: {
    primary: '#059669',
    light: '#D1FAE5',
    border: '#A7F3D0',
    name: 'Kapha (Earth & Water)',
  },
};

export const DEFAULT_QUESTIONS: PrakritiQuestion[] = [
  {
    id: 'body_frame',
    category: 'Physical Frame (Sharira Rachana)',
    title: 'Body Frame & Skeletal Build',
    description: 'Consider your natural lifelong bone structure and weight tendency since youth.',
    options: [
      {
        dosha: 'vata',
        label: 'Slender, light, or narrow bone frame. Joints and veins tend to be prominent. Naturally difficult to gain weight.',
      },
      {
        dosha: 'pitta',
        label: 'Medium, proportionate, symmetrical frame. Moderate athletic build with average muscle definition. Steady weight.',
      },
      {
        dosha: 'kapha',
        label: 'Broad, sturdy, solid bone frame. Well-developed chest and limbs. Gains weight easily, takes effort to lose weight.',
      },
    ],
  },
  {
    id: 'skin_texture',
    category: 'Skin Characteristics (Tvacha)',
    title: 'Natural Skin Texture & Moisture',
    description: 'Observe your baseline skin tendencies across seasons without heavy cosmetic lotions.',
    options: [
      {
        dosha: 'vata',
        label: 'Dry, thin, rough, or easily cracked. Feels naturally cool to touch, prone to chapping in cold or windy climates.',
      },
      {
        dosha: 'pitta',
        label: 'Warm, soft, sensitive, easily flushed or pinkish. Prone to moles, freckles, rashes, or early sunburn.',
      },
      {
        dosha: 'kapha',
        label: 'Thick, smooth, soft, supple, naturally hydrated and oily. Remains cool, rarely cracks or irritates.',
      },
    ],
  },
  {
    id: 'hair_quality',
    category: 'Hair Characteristics (Kesha)',
    title: 'Hair Thickness & Texture',
    description: 'Your baseline hair quality before salon treatments or chemical changes.',
    options: [
      {
        dosha: 'vata',
        label: 'Dry, thin, coarse, dull, curly, or frizzy. Tends to have split ends or breaks easily.',
      },
      {
        dosha: 'pitta',
        label: 'Fine, silky, straight, moderate thickness. Tendency toward reddish/blonde tones, early thinning, or premature graying.',
      },
      {
        dosha: 'kapha',
        label: 'Thick, abundant, glossy, dark, wavy, deeply rooted and naturally oily or lustrous.',
      },
    ],
  },
  {
    id: 'appetite_digestion',
    category: 'Metabolic Fire (Agni & Koshta)',
    title: 'Appetite & Digestion Patterns',
    description: 'How your hunger behaves on regular days without travel stress.',
    options: [
      {
        dosha: 'vata',
        label: 'Vishama Agni: Irregular and unpredictable. Sometimes very hungry, other times forget meals. Prone to bloating or gas.',
      },
      {
        dosha: 'pitta',
        label: 'Tikshna Agni: Sharp, intense, and punctual. Irritable or faint if meals are delayed. Fast digestion, occasional acidity.',
      },
      {
        dosha: 'kapha',
        label: 'Manda Agni: Slow, steady, and low hunger. Can comfortably skip meals without distress. Digestion feels heavy after eating.',
      },
    ],
  },
  {
    id: 'temperature_preference',
    category: 'Thermal Sensitivity (Ritu Sahanam)',
    title: 'Weather & Temperature Preferences',
    description: 'Which weather or climate conditions make you feel most comfortable versus uncomfortable.',
    options: [
      {
        dosha: 'vata',
        label: 'Averse to cold and dry winds. Craves warm, sunny, cozy environments and hot drinks/soups.',
      },
      {
        dosha: 'pitta',
        label: 'Averse to heat and direct sun. Craves cool air, shaded rooms, refreshing ventilation, and cool refreshments.',
      },
      {
        dosha: 'kapha',
        label: 'Averse to damp, chilly, rainy weather. Tolerates heat well and thrives in warm, dry climates.',
      },
    ],
  },
  {
    id: 'sleep_pattern',
    category: 'Sleep Patterns (Nidra)',
    title: 'Sleep Depth & Duration',
    description: 'Your natural nocturnal sleep characteristics.',
    options: [
      {
        dosha: 'vata',
        label: 'Light, restless, easily disturbed by faint sounds. Averages 5–6 hours; dreams are flying, fast, or anxious.',
      },
      {
        dosha: 'pitta',
        label: 'Sound, moderate (6–7 hours). Wakes feeling sharp and alert. Dreams are colorful, passionate, or problem-solving.',
      },
      {
        dosha: 'kapha',
        label: 'Deep, heavy, continuous (8+ hours). Difficult to get out of bed in the morning, prone to daytime drowsiness.',
      },
    ],
  },
  {
    id: 'energy_pace',
    category: 'Energy & Stamina (Bala & Gati)',
    title: 'Physical Activity & Pace of Movement',
    description: 'How you naturally pace your tasks and your endurance levels.',
    options: [
      {
        dosha: 'vata',
        label: 'Fast-moving, walks quickly, talks animatedly. Intense bursts of energy followed by quick exhaustion. Low endurance.',
      },
      {
        dosha: 'pitta',
        label: 'Purposeful, decisive, moderate-to-high stamina. Competitive, energetic, excels in goal-oriented endurance.',
      },
      {
        dosha: 'kapha',
        label: 'Calm, methodical, steady pace. Slower to initiate action, but has great reserves of long-term physical stamina.',
      },
    ],
  },
  {
    id: 'mental_temperament',
    category: 'Mental Nature (Manasa Prakriti)',
    title: 'Emotional Temperament & Stress Response',
    description: 'Your characteristic psychological response when encountering new environments or stress.',
    options: [
      {
        dosha: 'vata',
        label: 'Quick learner, enthusiastic, highly creative. Under stress, tends to experience worry, anxiety, or racing thoughts.',
      },
      {
        dosha: 'pitta',
        label: 'Sharp intellect, logical, courageous. Under stress, tends toward impatience, perfectionism, irritation, or anger.',
      },
      {
        dosha: 'kapha',
        label: 'Calm, patient, supportive, loyal, forgiving. Under stress, tends toward stubbornness, resistance to change, or withdrawal.',
      },
    ],
  },
];

export const CLINICAL_DISCLAIMER =
  'This assessment provides educational insights into Ayurvedic constitutional typology (Prakriti) based on classical texts. It is not a medical diagnosis or a substitute for professional clinical evaluation. For personalized health advice and Panchakarma treatment planning, consult a certified Ayurvedic physician.';
