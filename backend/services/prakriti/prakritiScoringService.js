/**
 * Prakriti Assessment Questionnaire & Scoring Service
 * 
 * Based on classical Ayurvedic constitutional typologies from
 * Charaka Samhita (Sharira Sthana, Adhyaya 8) and Sushruta Samhita (Sharira Sthana, Adhyaya 4).
 * 
 * NOTE: This assessment evaluates innate baseline constitution (Prakriti),
 * not current temporary disease imbalances (Vikriti). It is informational and educational,
 * requiring review by a qualified Ayurvedic Vaidya / physician before clinical prescription.
 */

const QUESTIONNAIRE_VERSION = '1.0.0';
const METHODOLOGY_VERSION = 'classical-samhita-v1';

const QUESTIONS = [
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

/**
 * Classical Dosha Profiles & Guidance
 */
const CONSTITUTION_DETAILS = {
  'Vata Dominant': {
    type: 'Ekadoshaja',
    element: 'Air (Vayu) & Ether (Akasha)',
    qualities: 'Light, cold, dry, rough, subtle, mobile, clear.',
    summary: 'Your constitution reflects the kinetic energy of Air and Space. You possess quick comprehension, vivid imagination, flexibility, and infectious enthusiasm. You thrive best when maintaining warm, grounded, and consistent daily routines.',
    diet: [
      'Favor warm, nourishing, freshly cooked meals with healthy fats (ghee, sesame oil, olive oil).',
      'Emphasize sweet, sour, and salty tastes to ground kinetic Vata energy.',
      'Reduce raw salads, cold drinks, iced foods, and dry crackers.',
      'Enjoy soothing spices such as ginger, cumin, cardamom, and cinnamon.',
    ],
    lifestyle: [
      'Maintain regular times for waking, meals, and retiring to sleep.',
      'Daily Abhyanga (warm sesame oil self-massage) helps soothe the nervous system.',
      'Engage in grounding, mindful exercises like gentle Hatha yoga and breathwork (Nadi Shodhana).',
      'Protect yourself from cold drafts, windy conditions, and excessive sensory stimulation.',
    ],
    seasonal: 'Take extra care during late autumn and early winter (Hemanta Ritu) when cold, dry weather naturally aggravates Vata.',
  },
  'Pitta Dominant': {
    type: 'Ekadoshaja',
    element: 'Fire (Agni) & Water (Jala)',
    qualities: 'Hot, sharp, light, liquid, spreading, sour, oily.',
    summary: 'Your constitution embodies transformative Fire and Water energies. You are gifted with sharp intelligence, leadership, articulate speech, high vitality, and focused determination. Balancing internal heat with coolness and relaxation is your key to sustained health.',
    diet: [
      'Favor cooling, naturally sweet, bitter, and astringent foods.',
      'Incorporate cooling dairy or plant milks, basmati rice, cucumbers, and sweet juicy fruits.',
      'Moderate hot chilies, deep-fried foods, excess vinegar, alcohol, and very salty snacks.',
      'Cook with cooling herbs such as coriander, fennel, cilantro, and mint.',
    ],
    lifestyle: [
      'Avoid overworking during midday heat; allocate time for playful recreation.',
      'Practice cooling pranayama (Sheetali / Sitkari) and moonlit evening walks.',
      'Use coconut oil or sandalwood oil for cooling skin massages.',
      'Cultivate moderation, patience, and non-competitive creative pursuits.',
    ],
    seasonal: 'Take extra precautions during summer and early autumn (Grishma and Sharad Ritu) when external heat elevates Pitta.',
  },
  'Kapha Dominant': {
    type: 'Ekadoshaja',
    element: 'Water (Jala) & Earth (Prithvi)',
    qualities: 'Heavy, slow, cool, oily, smooth, dense, soft, stable.',
    summary: 'Your constitution represents structural cohesion, stability, and enduring vitality (Ojas). You are blessed with natural calm, deep compassion, excellent immunity, physical endurance, and loyalty. You thrive when stimulated by movement, variety, and invigorating warmth.',
    diet: [
      'Favor light, warm, dry, pungent, bitter, and astringent foods.',
      'Incorporate warm spiced lentils, steamed leafy greens, barley, and millet.',
      'Minimize heavy dairy, iced treats, sweet desserts, fried foods, and daytime napping.',
      'Emphasize warming, digestive spices like black pepper, ginger, mustard seeds, and turmeric.',
    ],
    lifestyle: [
      'Engage in brisk, vigorous daily exercise to stimulate circulation and metabolism.',
      'Wake early before sunrise (Brahma Muhurta or before 6:00 AM) to avoid morning sluggishness.',
      'Dry powder massage (Udvartana) helps invigorate tissues and clear lymphatic stagnation.',
      'Welcome spontaneity, dynamic hobbies, and progressive challenges into your schedule.',
    ],
    seasonal: 'Stay especially active during late winter and spring (Shishira and Vasanta Ritu) when dampness and thawing snow stimulate Kapha accumulation.',
  },
  'Vata-Pitta': {
    type: 'Dvandvaja',
    element: 'Air, Ether & Fire',
    qualities: 'Active, light, discerning, warm-sensitive yet easily chilled.',
    summary: 'A dual constitution combining the creative mobility of Vata with the focused intensity of Pitta. You are dynamic, quick-witted, perceptive, and ambitious. Balance comes from grounding warmth that avoids excessive internal heat.',
    diet: [
      'Eat freshly cooked, moderately warm, nourishing meals without pungent excesses.',
      'Balance sweet, bitter, and astringent tastes with healthy fats.',
      'Keep hydrated with lukewarm water and herbal teas (fennel, chamomile, licorice).',
    ],
    lifestyle: [
      'Guard against overcommitting or pushing beyond natural stamina reserves.',
      'Balance physical activity with calming, restorative meditation.',
      'Protect from intense sun and cold winds alike.',
    ],
    seasonal: 'Watch Vata in late autumn and winter; soothe Pitta during intense summer heat.',
  },
  'Pitta-Vata': {
    type: 'Dvandvaja',
    element: 'Fire, Air & Ether',
    qualities: 'Sharp, agile, decisive, high-metabolism.',
    summary: 'A dual constitution where Pitta leads with Vata secondary. Highly productive, visionary, and expressive. Essential to avoid burning the candle at both ends.',
    diet: [
      'Focus on cooling yet nourishing foods. Do not skip scheduled meals.',
      'Favor sweet, slightly bitter dishes cooked with ghee or coconut oil.',
    ],
    lifestyle: [
      'Structure regular resting pauses during high-intensity work.',
      'Practice cooling, centering yoga rather than exhausting competitive sports.',
    ],
    seasonal: 'Prioritize cooling measures in late summer, then ground yourself with warm food in late fall.',
  },
  'Pitta-Kapha': {
    type: 'Dvandvaja',
    element: 'Fire, Water & Earth',
    qualities: 'Strong constitution, high stamina, warm, solid.',
    summary: 'A robust dual constitution uniting Pitta’s sharp intellect with Kapha’s physical endurance and steady emotions. Highly capable and resilient, requiring a balance between challenge and lightness.',
    diet: [
      'Favor light, moderately spiced, cooling and astringent meals.',
      'Emphasize bitter greens, legumes, and lighter grains while minimizing heavy, oily sweets.',
    ],
    lifestyle: [
      'Engage in moderate-to-vigorous exercise in cool environments.',
      'Cultivate mindful contentment to temper competitive drive.',
    ],
    seasonal: 'Guard against heat in summer/early autumn, and damp congestion in spring.',
  },
  'Kapha-Pitta': {
    type: 'Dvandvaja',
    element: 'Earth, Water & Fire',
    qualities: 'Steadfast, calm, physically resilient, warm-hearted.',
    summary: 'A stable dual constitution led by Kapha’s grounding strength complemented by Pitta’s mental focus. Blessed with stamina and composure.',
    diet: [
      'Light, dry, warming meals with moderate pungent and bitter spices.',
      'Reduce excess oils, heavy creamy sauces, and refined sugars.',
    ],
    lifestyle: [
      'Maintain an active daily movement regimen.',
      'Rise early and stay engaged in stimulating intellectual and community pursuits.',
    ],
    seasonal: 'Invigorate body in spring, stay cool during the peak of summer.',
  },
  'Vata-Kapha': {
    type: 'Dvandvaja',
    element: 'Air, Ether, Water & Earth',
    qualities: 'Cool nature, fluctuating pace, creative endurance.',
    summary: 'A contrasting dual constitution sharing the common quality of coolness (Sheeta). You possess Vata’s creativity and Kapha’s loyalty. Warmth is your universal medicine.',
    diet: [
      'Always favor warm, cooked, lightly spiced, easily digestible meals.',
      'Drink warm water throughout the day; avoid cold and raw foods.',
    ],
    lifestyle: [
      'Keep your living and work spaces consistently warm and dry.',
      'Establish a steady daily routine with moderate daily activity.',
    ],
    seasonal: 'Take extra warmth and care across all cold seasons from autumn through late spring.',
  },
  'Kapha-Vata': {
    type: 'Dvandvaja',
    element: 'Earth, Water, Air & Ether',
    qualities: 'Solid foundation with imaginative adaptability.',
    summary: 'A dual constitution led by Kapha’s calm endurance with secondary Vata lightness. Grounded yet capable of spontaneous creativity.',
    diet: [
      'Warm, light, dry meals that stimulate metabolic digestion without depleting energy.',
      'Spices like ginger, cinnamon, and black pepper are highly beneficial.',
    ],
    lifestyle: [
      'Engage in regular warm indoor movement, walking, and dynamic yoga.',
      'Maintain an early morning wake routine.',
    ],
    seasonal: 'Counteract cold dampness in winter and spring with warming spices and dry heat.',
  },
  'Sama Prakriti (Tridoshic)': {
    type: 'Sama',
    element: 'Ether, Air, Fire, Water & Earth',
    qualities: 'Equilibrated, adaptable, harmonic.',
    summary: 'An exceptionally rare, balanced constitution where all three doshas exist in near-equal proportions. You adapt well to changes and possess natural resilience. Health is maintained by harmonizing with the shifting seasons.',
    diet: [
      'Eat wholesome, seasonal, freshly prepared foods according to current weather.',
      'Incorporate all six tastes (Shad Rasa) in balanced moderation.',
    ],
    lifestyle: [
      'Follow the classical Ayurvedic daily regimen (Dinacharya) and seasonal regimen (Ritucharya).',
      'Maintain moderation in all physical and mental activities.',
    ],
    seasonal: 'Adjust your food and habits adaptively as seasons change throughout the year.',
  },
};

const DISCLAIMER_TEXT =
  'This assessment provides educational insights into Ayurvedic constitutional typology (Prakriti) based on classical texts. It is not a medical diagnosis or a substitute for professional clinical evaluation. For personalized health advice and Panchakarma treatment planning, consult a certified Ayurvedic physician.';

/**
 * Score a completed assessment
 * @param {Array<{ questionId: string, selectedDosha: 'vata' | 'pitta' | 'kapha' }>} answers
 * @returns {Object} Scored results, percentage breakdown, and constitution profile
 */
function scoreAssessment(answers) {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error('Answers array is required to score assessment.');
  }

  const counts = { vata: 0, pitta: 0, kapha: 0 };

  answers.forEach((ans) => {
    const dosha = (ans.selectedDosha || '').toLowerCase();
    if (counts[dosha] !== undefined) {
      counts[dosha] += 1;
    }
  });

  const total = answers.length;
  if (total === 0) {
    throw new Error('No valid answers provided.');
  }

  // Calculate raw percentages
  let vataPct = Math.round((counts.vata / total) * 100);
  let pittaPct = Math.round((counts.pitta / total) * 100);
  let kaphaPct = Math.round((counts.kapha / total) * 100);

  // Normalize so percentages sum to 100
  const sum = vataPct + pittaPct + kaphaPct;
  if (sum !== 100 && sum > 0) {
    const diff = 100 - sum;
    // Add rounding correction to highest count
    if (counts.vata >= counts.pitta && counts.vata >= counts.kapha) {
      vataPct += diff;
    } else if (counts.pitta >= counts.vata && counts.pitta >= counts.kapha) {
      pittaPct += diff;
    } else {
      kaphaPct += diff;
    }
  }

  // Determine constitution typology
  const doshaEntries = [
    { name: 'Vata', count: counts.vata, pct: vataPct },
    { name: 'Pitta', count: counts.pitta, pct: pittaPct },
    { name: 'Kapha', count: counts.kapha, pct: kaphaPct },
  ].sort((a, b) => b.count - a.count);

  const top1 = doshaEntries[0];
  const top2 = doshaEntries[1];
  const top3 = doshaEntries[2];

  let dominantConstitution = 'Vata Dominant';
  let constitutionType = 'Ekadoshaja';

  // Rule 1: Tridoshaja / Sama Prakriti (if all within 5% or equal counts)
  if (
    Math.abs(vataPct - pittaPct) <= 10 &&
    Math.abs(pittaPct - kaphaPct) <= 10 &&
    Math.abs(vataPct - kaphaPct) <= 10
  ) {
    dominantConstitution = 'Sama Prakriti (Tridoshic)';
    constitutionType = 'Sama';
  }
  // Rule 2: Ekadoshaja (Dominant single dosha if top is >= 45% AND leads second by >= 15%)
  else if (top1.pct >= 45 && (top1.pct - top2.pct >= 15)) {
    dominantConstitution = `${top1.name} Dominant`;
    constitutionType = 'Ekadoshaja';
  }
  // Rule 3: Dvandvaja (Dual constitution)
  else {
    dominantConstitution = `${top1.name}-${top2.name}`;
    constitutionType = 'Dvandvaja';
  }

  const profile = CONSTITUTION_DETAILS[dominantConstitution] || CONSTITUTION_DETAILS['Vata Dominant'];

  return {
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    scoringMethodologyVersion: METHODOLOGY_VERSION,
    scores: {
      vata: vataPct,
      pitta: pittaPct,
      kapha: kaphaPct,
      rawCounts: {
        vata: counts.vata,
        pitta: counts.pitta,
        kapha: counts.kapha,
        total,
      },
    },
    dominantConstitution,
    constitutionType: profile.type || constitutionType,
    profile: {
      element: profile.element,
      qualities: profile.qualities,
      summary: profile.summary,
      diet: profile.diet,
      lifestyle: profile.lifestyle,
      seasonal: profile.seasonal,
    },
    disclaimer: DISCLAIMER_TEXT,
  };
}

module.exports = {
  QUESTIONNAIRE_VERSION,
  METHODOLOGY_VERSION,
  QUESTIONS,
  CONSTITUTION_DETAILS,
  DISCLAIMER_TEXT,
  scoreAssessment,
};
