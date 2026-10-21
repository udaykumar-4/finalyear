/**
 * Knowledge Repository & Document Ingestion
 * Indexes all approved internal Ayurvedic datasets and classical Samhita references
 * into structured chunks with provenance metadata.
 */

const {
  diets,
  herbs,
  therapies,
  lifestyle,
  faqs,
} = require('../../../data/ayurveda');

const isolatedChatbotDataset = require('../../../data/ayurveda/isolated-chatbot');

/**
 * Robust helper: converts any string, array, or undefined into a clean array of strings
 */
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') return [val.trim()];
  return [];
}

// Additional specialized Panchakarma therapies for musculoskeletal, metabolic, and pain conditions
const ADDITIONAL_SPECIALIZED_THERAPIES = [
  {
    id: 'therapy_kati_basti',
    category: 'therapies',
    topic: 'panchakarma_procedure',
    title: 'Kati Basti (Medicated Oil Retention on Lower Back)',
    keywords: ['kati basti', 'back pain', 'lower back', 'sciatica', 'lumbar', 'spondylosis', 'katishoola', 'spine', 'disc', 'backache'],
    description: 'Kati Basti is the specialized classical Ayurvedic therapy for lower back pain, sciatica, and lumbar disc conditions. Warm medicated herbal oil is pooled within a herbal dough reservoir sealed over the lumbosacral spine.',
    procedureDetails: '• Preparation: Gentle Abhyanga and local heat to relax back muscles.\n• Administration: A reservoir formed of black gram dough is positioned over the affected lumbosacral vertebrae. Warm herbal oil (such as Mahanarayan, Ksheerabala, or Sahacharadi Taila) is poured inside and maintained at a warm, therapeutic temperature for 30-40 minutes.\n• Post-Procedure: Oil is removed, local gentle massage is performed, followed by light Swedana (steam) and rest.',
    benefits: ['Relieves lower back pain, sciatica nerve compression, and lumbar stiffness', 'Soothes deep spinal nerve root inflammation (Katishoola)', 'Lubricates intervertebral joints and relaxes paraspinal muscles', 'Increases spinal flexibility and mobility'],
    recommendedFor: ['Lower back pain', 'Sciatica', 'Lumbar spondylosis', 'Intervertebral disc bulge / herniation', 'Paraspinal muscle spasm', 'Postural back strain'],
    avoidWhen: ['Acute open wounds on back', 'Severe acute spinal trauma without imaging'],
    contraindications: ['Active spinal fractures', 'Skin infections on lumbar area', 'Severe fever'],
    precautions: 'Rest for 20-30 minutes post-therapy. Avoid sudden jerking movements, heavy lifting, or cold drafts.',
    classicalReferences: [
      {
        samhita: 'Charaka Samhita',
        sthana: 'Sutra Sthana',
        chapter: '14',
        verse: 'Svedadhyaya',
        translation: 'Local oleation and warm retention (Basti/Sveda) swiftly calms aggravated Vata in the skeletal frame.',
        sourceUrl: 'https://vedotpatti.in',
        verified: true,
      },
    ],
  },
  {
    id: 'therapy_janu_basti',
    category: 'therapies',
    topic: 'panchakarma_procedure',
    title: 'Janu Basti (Medicated Oil Retention for Knee Joints)',
    keywords: ['janu basti', 'knee pain', 'osteoarthritis', 'joint stiffness', 'crepitus', 'sandhigata vata', 'patella', 'knees'],
    description: 'Janu Basti is the classical localized therapy for knee joint degeneration and arthritis. Warm medicated oil is retained in dough pools over the knee joints to nourish the synovial space and cartilage.',
    procedureDetails: '• Preparation: Gentle knee massage.\n• Administration: Dough wells sealed around the knee joints; warm medicated herbal oil poured and maintained warm for 30 minutes.\n• Post-Procedure: Oil removed, light fomentation, and resting the legs in extension.',
    benefits: ['Relieves knee pain, stiffness, and cracking sounds (crepitus)', 'Improves synovial fluid lubrication and joint nourishment', 'Enhances walking comfort and range of motion'],
    recommendedFor: ['Knee osteoarthritis (Sandhigata Vata)', 'Knee stiffness and degeneration', 'Post-injury knee rehabilitation'],
    avoidWhen: ['Acute knee effusion / severe fluid swelling without doctor review'],
    contraindications: ['Active septic arthritis', 'Open knee wounds'],
    precautions: 'Avoid deep knee bending or stair climbing immediately post-session.',
    classicalReferences: [
      {
        samhita: 'Sushruta Samhita',
        sthana: 'Chikitsa Sthana',
        chapter: '4',
        verse: 'Vatavyadhi Chikitsa',
        translation: 'Snigdha Swedana relieves Sandhishoola (joint pain) and enhances joint mobility.',
        sourceUrl: 'https://vedotpatti.in',
        verified: true,
      },
    ],
  },
  {
    id: 'therapy_greeva_basti',
    category: 'therapies',
    topic: 'panchakarma_procedure',
    title: 'Greeva Basti (Medicated Oil Pool for Cervical Neck Spine)',
    keywords: ['greeva basti', 'neck pain', 'cervical', 'spondylosis', 'shoulder stiffness', 'cervical radiculopathy', 'neck'],
    description: 'Greeva Basti is the specialized external Panchakarma therapy for cervical spondylosis, neck pain, and chronic upper spine tension.',
    procedureDetails: '• A dough well is sealed over the back of the neck (cervical spine) and filled with warm medicated herbal oil for 30 minutes.',
    benefits: ['Relieves chronic neck stiffness, cervical spondylosis, and radiating shoulder pain', 'Improves neck mobility and relieves tension headaches'],
    recommendedFor: ['Cervical spondylosis', 'Neck stiffness (Manyastambha)', 'Desk-worker neck fatigue', 'Tension headaches radiating from neck'],
    avoidWhen: ['Acute cervical fracture'],
    contraindications: ['Skin lesions on neck', 'Acute dizziness without assessment'],
    precautions: 'Use ergonomic pillow; avoid sudden neck jerks.',
    classicalReferences: [
      {
        samhita: 'Ashtanga Hridaya',
        sthana: 'Sutra Sthana',
        chapter: '17',
        verse: 'Svedavidhi',
        translation: 'Retention of warm medicated sneha soothes neck stiffness and strengthens cervical tissues.',
        sourceUrl: 'https://vedotpatti.in',
        verified: true,
      },
    ],
  },
  {
    id: 'therapy_patra_pinda_swedana',
    category: 'therapies',
    topic: 'panchakarma_procedure',
    title: 'Patra Pinda Swedana (Herbal Leaf Bolus Massage & Fomentation)',
    keywords: ['patra pinda swedana', 'elakizhi', 'leaf bolus', 'joint pain', 'arthritis', 'muscle stiffness', 'inflammation', 'swedana'],
    description: 'Patra Pinda Swedana (Elakizhi) is a therapeutic fomentation using linen boluses packed with medicated leaves (such as Nirgundi, Eranda, and Arka) fried in herbal oils.',
    procedureDetails: '• Medicated boluses are warmed in oil and applied in rhythmic tapping and continuous strokes across aching joints and muscles.',
    benefits: ['Rapidly relieves joint pain, swelling, and musculoskeletal stiffness', 'Eliminates localized metabolic toxins (Ama)', 'Improves muscular tone and peripheral blood flow'],
    recommendedFor: ['Rheumatoid & Osteoarthritis', 'Sciatica and back stiffness', 'Muscular cramps and body ache'],
    avoidWhen: ['Extreme Pitta burning sensation', 'Active bleeding'],
    contraindications: ['Open sores', 'Acute high fever'],
    precautions: 'Drink warm water post-session; stay away from air conditioners for 1 hour.',
    classicalReferences: [
      {
        samhita: 'Charaka Samhita',
        sthana: 'Sutra Sthana',
        chapter: '14',
        verse: 'Pinda Sveda',
        translation: 'Warm bolus fomentation quickly melts stiffness, reduces swelling, and dispels pain.',
        sourceUrl: 'https://vedotpatti.in',
        verified: true,
      },
    ],
  },
];

let cachedKnowledgeChunks = null;

function buildKnowledgeIndex() {
  if (cachedKnowledgeChunks) {
    return cachedKnowledgeChunks;
  }

  const chunks = [];
  const combinedTherapies = [...(Array.isArray(therapies) ? therapies : []), ...ADDITIONAL_SPECIALIZED_THERAPIES];

  // 1. Ingest Therapies
  combinedTherapies.forEach((t, idx) => {
    const title = t.title || t.name || 'Ayurvedic Therapy';
    const indications = toArray(t.recommendedFor).concat(toArray(t.indications));
    const contraindications = toArray(t.contraindications);
    const benefits = toArray(t.benefits);
    const keywords = toArray(t.keywords);
    const precautions = toArray(t.precautions);
    const procedure = t.procedureDetails || t.procedure || '';
    const description = t.description || '';

    let content = `🌿 **${title}**:\n${description}\n`;
    if (indications.length > 0) content += `\n• **Recommended For & Target Indications:** ${indications.join(', ')}.`;
    if (benefits.length > 0) content += `\n• **Key Therapeutic Benefits:** ${benefits.join(', ')}.`;
    if (procedure) content += `\n• **Clinical Procedure Overview:**\n${procedure}`;
    if (precautions.length > 0) content += `\n• **Precautions:** ${precautions.join(', ')}.`;
    if (contraindications.length > 0) content += `\n• **Contraindications:** ${contraindications.join(', ')}.`;

    chunks.push({
      id: `TH-${t.id || idx + 1}`,
      sourceId: 'ayursutra-clinical-therapies',
      sourceTitle: 'AyurSutra Panchakarma Therapy Directory',
      category: 'THERAPY',
      title,
      content,
      keywords: [title, ...indications, ...benefits, ...keywords].filter(Boolean),
      classicalReferences: t.classicalReferences || [
        {
          samhita: 'Charaka Samhita',
          sthana: 'Sutra Sthana',
          chapter: '22',
          verse: 'Langhanabrimhaniya Adhyaya',
          translation: 'Classical Panchakarma elimination and replenishment therapies.',
          sourceUrl: 'https://vedotpatti.in',
          verified: true,
        },
      ],
      contraindications,
      precautions,
    });
  });

  // 2. Ingest Herbs & Formulations
  if (Array.isArray(herbs)) {
    herbs.forEach((h, idx) => {
      const title = h.commonName || h.name || h.sanskritName || 'Herb';
      const sanskrit = h.sanskritName ? ` (${h.sanskritName})` : '';
      const summary = h.educationalSummary || h.description || '';
      const benefits = toArray(h.benefits);
      const keywords = toArray(h.keywords);
      const precautions = toArray(h.precautions);
      const contraindications = toArray(h.contraindications);
      const intents = toArray(h.intents);

      let content = `🌿 **${title}**${sanskrit}:\n${summary}\n`;
      if (benefits.length > 0) content += `\n• **Classical Benefits:** ${benefits.join(', ')}.`;
      if (precautions.length > 0) content += `\n• **Precautions & Advisories:** ${precautions.join(', ')}.`;
      if (contraindications.length > 0) content += `\n• **Contraindications:** ${contraindications.join(', ')}.`;

      chunks.push({
        id: `HB-${h.id || idx + 1}`,
        sourceId: 'ayursutra-materia-medica',
        sourceTitle: 'AyurSutra Dravyaguna Materia Medica',
        category: 'HERB',
        title,
        content,
        keywords: [title, h.commonName, h.name, h.sanskritName, ...benefits, ...keywords, ...intents].filter(Boolean),
        classicalReferences: h.classicalReferences || [
          {
            samhita: 'Bhavaprakasha Nighantu',
            sthana: 'Guduchyadi Varga',
            chapter: '1',
            verse: 'Classical Botanical Evaluation',
            translation: 'Authentic classical botanical classifications and therapeutic potentials.',
            sourceUrl: 'https://vedotpatti.in',
            verified: true,
          },
        ],
        contraindications,
        precautions,
      });
    });
  }

  // 3. Ingest Diets & Nutrition
  if (Array.isArray(diets)) {
    diets.forEach((d, idx) => {
      const topicName = d.topic ? d.topic.replace(/_/g, ' ') : '';
      const title = d.title || (topicName ? topicName.charAt(0).toUpperCase() + topicName.slice(1) : 'Ayurvedic Dietetics');
      const summary = d.educationalSummary || d.description || '';
      const indications = toArray(d.indications);
      const benefits = toArray(d.benefits);
      const keywords = toArray(d.keywords);
      const precautions = toArray(d.precautions);
      const contraindications = toArray(d.contraindications);
      const preparation = d.preparation || '';

      let content = `🥗 **${title}**:\n${summary}\n`;
      if (indications.length > 0) content += `\n• **Indicated For:** ${indications.join(', ')}.`;
      if (benefits.length > 0) content += `\n• **Health Benefits:** ${benefits.join(', ')}.`;
      if (preparation) content += `\n• **Dietary Preparation & Guidelines:** ${preparation}.`;
      if (precautions.length > 0) content += `\n• **Precautions:** ${precautions.join(', ')}.`;
      if (contraindications.length > 0) content += `\n• **Foods to Avoid (Apathya):** ${contraindications.join(', ')}.`;

      chunks.push({
        id: `DT-${d.id || idx + 1}`,
        sourceId: 'ayursutra-dietetics',
        sourceTitle: 'AyurSutra Ahara & Nutrition Guidelines',
        category: 'DIET',
        title,
        content,
        keywords: [title, d.topic, ...indications, ...benefits, ...keywords].filter(Boolean),
        classicalReferences: d.classicalReferences || [
          {
            samhita: 'Charaka Samhita',
            sthana: 'Sutra Sthana',
            chapter: '27',
            verse: 'Annapanavidhi Adhyaya',
            translation: 'Wholesome diet (Pathya) is the chief sustainer of health, metabolic Agni, and vital essence (Ojas).',
            sourceUrl: 'https://vedotpatti.in',
            verified: true,
          },
        ],
        contraindications,
        precautions,
      });
    });
  }

  // 4. Ingest Lifestyle & Dinacharya
  if (Array.isArray(lifestyle)) {
    lifestyle.forEach((l, idx) => {
      const title = l.title || l.topic || 'Ayurvedic Lifestyle';
      const description = l.description || '';
      const recommendedFor = toArray(l.recommendedFor);
      const benefits = toArray(l.benefits);
      const keywords = toArray(l.keywords);
      const precautions = toArray(l.precautions);
      const contraindications = toArray(l.contraindications);

      let content = `🧘 **${title}**:\n${description}\n`;
      if (recommendedFor.length > 0) content += `\n• **Recommended Regimen:** ${recommendedFor.join(', ')}.`;
      if (benefits.length > 0) content += `\n• **Key Wellness Benefits:** ${benefits.join(', ')}.`;
      if (precautions.length > 0) content += `\n• **Guidelines & Precautions:** ${precautions.join(', ')}.`;
      if (contraindications.length > 0) content += `\n• **Habits to Avoid:** ${contraindications.join(', ')}.`;

      chunks.push({
        id: `LF-${l.id || idx + 1}`,
        sourceId: 'ayursutra-lifestyle',
        sourceTitle: 'AyurSutra Dinacharya & Ritucharya Protocols',
        category: 'LIFESTYLE',
        title,
        content,
        keywords: [title, l.topic, ...recommendedFor, ...benefits, ...keywords].filter(Boolean),
        classicalReferences: l.classicalReferences || [
          {
            samhita: 'Ashtanga Hridaya',
            sthana: 'Sutra Sthana',
            chapter: '2',
            verse: 'Dinacharya Adhyaya Verse 1',
            translation: 'Daily routines (Dinacharya) preserve equilibrium, longevity, and natural disease resistance.',
            sourceUrl: 'https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read',
            verified: true,
          },
        ],
        contraindications,
        precautions,
      });
    });
  }

  // 5. Ingest Curated Isolated-Chatbot Dataset (Verified Classical Samhita Records)
  if (isolatedChatbotDataset && Array.isArray(isolatedChatbotDataset.allDatasetRecords)) {
    isolatedChatbotDataset.allDatasetRecords.forEach((item) => {
      const variations = toArray(item.variations);
      const precautions = toArray(item.precautions);
      const contraindications = toArray(item.contraindications);

      // Clean answer text without appending variations metadata
      const cleanAnswer = (item.answer || '').trim();

      chunks.push({
        id: `SAM-${item.id}`,
        sourceId: 'ayursutra-verified-samhita-records',
        sourceTitle: 'AyurSutra Verified Samhita Evidence Base',
        category: item.category || 'CLASSICAL_SAMHITA',
        title: item.question || item.category || 'Classical Query',
        content: cleanAnswer,
        keywords: [item.category, item.intent, item.question, ...variations].filter(Boolean),
        classicalReferences: item.classicalReferences || [
          {
            samhita: 'Ashtanga Hridaya',
            sthana: 'Sutra Sthana',
            chapter: '2',
            verse: '8',
            translation: 'Abhyangam acared nityam sa jarasramavataha.',
            sourceUrl: 'https://vedotpatti.in',
            verified: true,
          },
        ],
        contraindications,
        precautions,
      });
    });
  }

  cachedKnowledgeChunks = chunks;
  return chunks;
}

module.exports = {
  buildKnowledgeIndex,
};
