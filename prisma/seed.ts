import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Mantram360 database...')

  // ── Admin User ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Mantram@2024', 12)
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    create: { username: 'admin', email: 'admin@mantram360.com', password: adminPassword, role: 'super_admin' },
    update: {},
  })
  console.log('✓ Admin user created (admin / Mantram@2024)')

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    { id: 'cat-ayushya', slug: 'health-longevity', name: { en: 'Health & Longevity', te: 'ఆరోగ్యం & ఆయుష్షు' }, description: { en: 'Poojas for health, vitality and long life', te: 'ఆరోగ్యం, శక్తి మరియు దీర్ఘాయుష్షు కొరకు పూజలు' }, sort_order: 1 },
    { id: 'cat-prosperity', slug: 'prosperity-wealth', name: { en: 'Prosperity & Wealth', te: 'సంపద & సౌభాగ్యం' }, description: { en: 'Poojas for financial growth and abundance', te: 'సంపద, వ్యాపార వృద్ధి కొరకు పూజలు' }, sort_order: 2 },
    { id: 'cat-protection', slug: 'protection-harmony', name: { en: 'Protection & Harmony', te: 'రక్షణ & శాంతి' }, description: { en: 'Poojas for family protection and harmony', te: 'కుటుంబ రక్షణ మరియు శాంతి కొరకు పూజలు' }, sort_order: 3 },
    { id: 'cat-shanti', slug: 'dosha-nivarana', name: { en: 'Dosha Nivarana', te: 'దోష నివారణ' }, description: { en: 'Poojas for removing planetary and karmic afflictions', te: 'గ్రహ దోషాలు, కర్మ బాధల నివారణ కొరకు పూజలు' }, sort_order: 4 },
    { id: 'cat-occasion', slug: 'occasion-ceremony', name: { en: 'Occasion & Ceremony', te: 'సందర్భ పూజలు' }, description: { en: 'Poojas for specific life occasions', te: 'జీవిత సంఘటనలకు సంబంధించిన పూజలు' }, sort_order: 5 },
  ]
  for (const cat of categories) {
    await prisma.poojaCategory.upsert({ where: { id: cat.id }, create: cat as never, update: {} })
  }
  console.log('✓ Categories seeded')

  // ── Pooja Pass Config ───────────────────────────────────────────────────────
  await prisma.passConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      price: 1999,
      name: { en: 'Mantram360 Pooja Pass', te: 'మంత్రం360 పూజా పాస్' } as never,
      tagline: { en: 'Blessings for every sacred occasion, every month', te: 'ప్రతి నెలా, ప్రతి పర్వానికి దైవ ఆశీర్వాదం' } as never,
      description: { en: 'One-time purchase. No expiry. Save ₹200–₹500 on every booking.', te: 'ఒక్కసారి కొనుగోలు. గడువు లేదు. ప్రతి బుకింగ్‌పై ₹200–₹500 ఆదా చేయండి.' } as never,
      benefits_sequence: [
        { id: 'ben-1', benefitType: 'flat_discount', discountAmount: 500, applicableOn: 'one_to_one', label: { en: '₹500 off 1st One-to-One', te: '1వ వన్-టు-వన్‌పై ₹500 తగ్గింపు' }, description: { en: 'Flat ₹500 off your first One-to-One pooja booking', te: 'మీ మొదటి వన్-టు-వన్ పూజ బుకింగ్‌పై ₹500 నేరుగా తగ్గింపు' } },
        { id: 'ben-2', benefitType: 'flat_discount', discountAmount: 300, applicableOn: 'group', label: { en: '₹300 off 1st Group Pooja', te: '1వ సామూహిక పూజపై ₹300 తగ్గింపు' }, description: { en: 'Flat ₹300 off your first Group pooja', te: 'మీ మొదటి సామూహిక పూజపై ₹300 తగ్గింపు' } },
        { id: 'ben-3', benefitType: 'flat_discount', discountAmount: 400, applicableOn: 'one_to_one', label: { en: '₹400 off 2nd One-to-One', te: '2వ వన్-టు-వన్‌పై ₹400 తగ్గింపు' }, description: { en: '₹400 off your second One-to-One booking', te: 'మీ రెండవ వన్-టు-వన్ పూజపై ₹400 తగ్గింపు' } },
        { id: 'ben-4', benefitType: 'flat_discount', discountAmount: 250, applicableOn: 'group', label: { en: '₹250 off 2nd Group Pooja', te: '2వ సామూహిక పూజపై ₹250 తగ్గింపు' }, description: { en: '₹250 off your second Group pooja', te: 'మీ రెండవ సామూహిక పూజపై ₹250 తగ్గింపు' } },
        { id: 'ben-5', benefitType: 'flat_discount', discountAmount: 300, applicableOn: 'one_to_one', label: { en: '₹300 off 3rd One-to-One', te: '3వ వన్-టు-వన్‌పై ₹300 తగ్గింపు' }, description: { en: '₹300 off your third One-to-One', te: 'మీ మూడవ వన్-టు-వన్‌పై ₹300 తగ్గింపు' } },
      ] as never,
      recurring_benefit: { id: 'ben-rec', benefitType: 'flat_discount', discountAmount: 200, applicableOn: 'both', label: { en: '₹200 off every booking', te: 'ప్రతి బుకింగ్‌పై ₹200 తగ్గింపు' }, description: { en: '₹200 flat discount on every subsequent booking', te: 'తదుపరి ప్రతి బుకింగ్‌పై ₹200 నేరుగా తగ్గింపు' } } as never,
    },
    update: {},
  })
  console.log('✓ Pooja Pass config seeded')

  // ── One-to-One Poojas ───────────────────────────────────────────────────────
  const otoPooja1 = {
    id: 'pooja-maha-mrityunjaya',
    slug: 'maha-mrityunjaya-homam',
    category_id: 'cat-ayushya',
    title: { en: 'Maha Mrityunjaya Homam', te: 'మహా మృత్యుంజయ హోమం' },
    subtitle: { en: 'Potent Vedic invocation for health, longevity and vital immunity', te: 'దీర్ఘాయుష్షు, ఆరోగ్యం మరియు ఆపద నివారణ కొరకు పరమ పవిత్ర రుద్ర హోమం' },
    short_desc: { en: 'Dedicated to Lord Shiva (Mrityunjaya), chanted with pure Krishna Yajurveda mantras by trained Ghanapathis to overcome health afflictions and negative planetary influences.', te: 'కృష్ణ యజుర్వేద సాంప్రదాయంలో వేద పండితులచే శ్రీ మృత్యుంజయ స్వామిని ఆరాధిస్తూ సంపూర్ణ సంకల్పంతో జరిపించే విశేష హోమం.' },
    full_desc: { en: 'The Maha Mrityunjaya Homam is among the highest-order healing and protective ceremonies in the Vaidika tradition. Conducted with pure ghee, medicinal herbs and sacred samidhas, this ritual creates a profound vibrational sanctum for the devotee and family.', te: 'సమస్త రోగ నివారణ, శారీరక మానసిక స్వస్థత మరియు ఆయురారోగ్యాల కొరకు వేద మంత్రోచ్ఛారణలతో నిర్వహించబడే అత్యున్నత వైదిక క్రతువు ఇది.' },
    deity: { en: 'Lord Maha Mrityunjaya Shiva', te: 'శ్రీ మహా మృత్యుంజయ శివుడు' },
    tradition: { en: 'Krishna Yajurveda (Taittiriya Samhita)', te: 'కృష్ణ యజుర్వేదం (తైత్తిరీయ సంహిత)' },
    ideal_days: { en: 'Mondays, Masa Shivaratri, Janma Nakshatra, Pradosham', te: 'సోమవారాలు, మాస శివరాత్రి, జన్మ నక్షత్రం, ప్రదోష కాలం' },
    benefits: [{ en: 'Aids recovery from chronic ailments and enhances physical vitality', te: 'దీర్ఘకాలిక అనారోగ్యాల నుండి ఉపశమనం మరియు ప్రాణశక్తి పెంపు' }, { en: 'Shields from sudden accidents and negative karmic afflictions', te: 'ఆకస్మిక ప్రమాదాలు, గ్రహ పీడల నుండి దివ్య రక్షణ' }, { en: 'Imparts profound peace of mind to the family', te: 'కుటుంబానికి మనశ్శాంతి, ధైర్యం మరియు ప్రశాంతత లభించును' }],
    mode_available: 'both',
    min_lead_hours: 48,
    starting_price: 5100,
    image_url: '/assets/mrityunjaya-homam.jpg',
    faqs: [{ id: 'faq-mm-1', question: { en: 'How many participants can join?', te: 'ఎంత మంది పాల్గొనవచ్చు?' }, answer: { en: 'Up to 20 participants from your family can be included in the Sankalpam.', te: 'మీ కుటుంబం నుండి 20 మంది వరకు సంకల్పంలో చేర్చవచ్చు.' } }],
    deliverables: [{ en: 'High-definition recording of the full ceremony', te: 'సంపూర్ణ క్రతువు యొక్క హై-డెఫినిషన్ రికార్డింగ్' }, { en: 'Personalized completion certificate', te: 'వ్యక్తిగత పూర్తి సర్టిఫికెట్' }],
    is_flagship: true,
    occasion_ids: ['occ-birthday', 'occ-homams'],
    duration_range: '75 – 180 mins',
    is_active: true,
    sort_order: 1,
  }

  await prisma.oneToOnePooja.upsert({
    where: { id: 'pooja-maha-mrityunjaya' },
    create: otoPooja1 as never,
    update: {},
  })

  // Packages for Mrityunjaya
  const mrityunjayaPackages = [
    { id: 'pkg-mrityunjaya-prathama', pooja_id: 'pooja-maha-mrityunjaya', name: { en: 'Prathama Vidhi', te: 'ప్రథమ విధి' }, tagline: { en: 'Essential Homam', te: 'మూల హోమం' }, duration_mins: 75, pandits_count: 2, price: 5100, features: [{ en: '108 Mrityunjaya Ahutis', te: '108 మృత్యుంజయ ఆహుతులు' }, { en: 'Devotee Sankalpam', te: 'భక్తుని సంకల్పం' }], samagri: true, online_eligible: true, temple_eligible: true, is_popular: false, description: { en: 'Essential Maha Mrityunjaya Homam', te: 'ప్రాథమిక మహా మృత్యుంజయ హోమం' }, sort_order: 1 },
    { id: 'pkg-mrityunjaya-sampoorna', pooja_id: 'pooja-maha-mrityunjaya', name: { en: 'Sampoorna Ayushya Vidhi', te: 'సంపూర్ణ ఆయుష్య విధి' }, tagline: { en: 'Full Ceremony', te: 'సంపూర్ణ క్రతువు' }, duration_mins: 120, pandits_count: 3, price: 8100, features: [{ en: '1008 Mrityunjaya Ahutis', te: '1008 మృత్యుంజయ ఆహుతులు' }, { en: 'Full Veda Ashirvadam', te: 'సంపూర్ణ వేద ఆశీర్వాదం' }], samagri: true, online_eligible: true, temple_eligible: true, is_popular: true, description: { en: 'Complete Sampoorna Mrityunjaya Homam with full Veda Parayanam', te: 'సంపూర్ణ వేద మంత్రోచ్ఛారణతో మహా మృత్యుంజయ హోమం' }, sort_order: 2 },
    { id: 'pkg-mrityunjaya-maha', pooja_id: 'pooja-maha-mrityunjaya', name: { en: 'Maha Yajna Vidhi', te: 'మహా యజ్ఞ విధి' }, tagline: { en: 'Grand Ceremony', te: 'మహా క్రతువు' }, duration_mins: 180, pandits_count: 5, price: 15100, features: [{ en: '10008 Mrityunjaya Ahutis', te: '10008 మృత్యుంజయ ఆహుతులు' }, { en: 'Purnahuti & Sacred Ash distribution', te: 'పూర్ణాహుతి & విభూతి ప్రసాదం' }], samagri: true, online_eligible: false, temple_eligible: true, is_popular: false, description: { en: 'Grand Maha Yajna — only available at temple', te: 'మహా యజ్ఞం — ఆలయంలో మాత్రమే' }, sort_order: 3 },
  ]

  for (const pkg of mrityunjayaPackages) {
    await prisma.poojaPackage.upsert({ where: { id: pkg.id }, create: pkg as never, update: {} })
  }

  // Second OTO Pooja
  await prisma.oneToOnePooja.upsert({
    where: { id: 'pooja-satyanarayana' },
    create: {
      id: 'pooja-satyanarayana',
      slug: 'satyanarayana-swamy-vratam',
      category_id: 'cat-prosperity',
      title: { en: 'Sri Satyanarayana Swamy Vratam', te: 'శ్రీ సత్యనారాయణ స్వామి వ్రతం' },
      subtitle: { en: 'Sacred Vrata for fulfilment, abundance and gratitude', te: 'సమృద్ధి, కృతజ్ఞత మరియు ఇష్టసిద్ధి కొరకు పవిత్ర వ్రతం' },
      short_desc: { en: 'Sri Satyanarayana Swamy Vratam — a timeless Vaishnava ceremony performed with Panchamrutabhishekam, Vrata Katha narration and heartfelt offerings.', te: 'శ్రీ సత్యనారాయణ స్వామి వ్రతం — పంచామృత అభిషేకం, వ్రత కథా పారాయణం మరియు నైవేద్యాలతో జరిపించే పవిత్ర వైష్ణవ క్రతువు.' },
      full_desc: { en: 'One of the most beloved Vaishnava ceremonies in the Telugu tradition, the Sri Satyanarayana Swamy Vratam is traditionally performed to fulfil vows, celebrate new beginnings, and express gratitude. Our certified Pandits perform the complete vidhi including Panchamrutabhishekam, Vrata Katha (all five chapters), and Manngalaharathi.', te: 'తెలుగు వైష్ణవ సాంప్రదాయంలో అత్యంత ప్రియమైన వ్రతం. సంకల్ప నిర్వహణ, పంచామృత అభిషేకం, వ్రత కథా పారాయణం (ఐదు అధ్యాయాలు) మరియు మంగళహారతితో సంపూర్ణంగా నిర్వహిస్తారు.' },
      deity: { en: 'Lord Satyanarayana (Maha Vishnu)', te: 'శ్రీ సత్యనారాయణ స్వామి (మహా విష్ణువు)' },
      benefits: [{ en: 'Fulfilment of sincere vows and heartfelt intentions', te: 'మనఃపూర్వక వ్రత నిర్వహణ ద్వారా ఇష్ట సిద్ధి' }, { en: 'Abundant prosperity and financial clarity', te: 'సమృద్ధమైన ధన ఐశ్వర్యం మరియు ఆర్థిక స్పష్టత' }, { en: 'Joyful family unity and harmonious relationships', te: 'కుటుంబ ఐక్యత మరియు సంతోషకరమైన జీవనం' }],
      mode_available: 'both',
      min_lead_hours: 48,
      starting_price: 3500,
      image_url: '/assets/satyanarayana-vratam.jpg',
      faqs: [],
      deliverables: [{ en: 'Full HD recording', te: 'పూర్తి HD రికార్డింగ్' }, { en: 'Prasadam dispatch (on request)', te: 'ప్రసాదం (అభ్యర్థనపై)' }],
      is_flagship: false,
      is_active: true,
      sort_order: 2,
    } as never,
    update: {},
  })

  await prisma.poojaPackage.upsert({
    where: { id: 'pkg-satyanarayana-griha' },
    create: { id: 'pkg-satyanarayana-griha', pooja_id: 'pooja-satyanarayana', name: { en: 'Sampoorna Griha Vidhi', te: 'సంపూర్ణ గృహ విధి' }, tagline: { en: 'Complete Home Ceremony', te: 'సంపూర్ణ గృహ క్రతువు' }, duration_mins: 120, pandits_count: 2, price: 3500, features: [{ en: 'Panchamrutabhishekam', te: 'పంచామృత అభిషేకం' }, { en: 'Vrata Katha (5 chapters)', te: 'వ్రత కథ (5 అధ్యాయాలు)' }, { en: 'Manngalaharathi', te: 'మంగళహారతి' }], samagri: true, online_eligible: true, temple_eligible: true, is_popular: true, description: { en: 'Complete Satyanarayana Swamy Vratam', te: 'సంపూర్ణ సత్యనారాయణ స్వామి వ్రతం' }, sort_order: 1 } as never,
    update: {},
  })

  console.log('✓ One-to-One poojas seeded')

  // ── Group Poojas ────────────────────────────────────────────────────────────
  const groupPoojas = [
    {
      id: 'grp-masa-shivaratri',
      slug: 'masa-shivaratri-rudrabhishekam',
      title: { en: 'Masa Shivaratri Mahanyasa Rudrabhishekam', te: 'మాస శివరాత్రి మహాన్యాస పూర్వక ఏకాదశ రుద్రాభిషేకం' },
      subtitle: { en: 'Monthly Shiva night of liberation — Ekadasha Rudrabhishekam', te: 'మాసిక శివరాత్రి — మహాన్యాస పూర్వక ఏకాదశ రుద్రాభిషేకం' },
      deity: { en: 'Lord Shiva (Mahadeva / Rudra)', te: 'శ్రీ పరమేశ్వరుడు (రుద్రుడు)' },
      short_desc: { en: 'The most powerful monthly Shiva ceremony — Mahanyasa Poorvaka Ekadasha Rudrabhishekam performed on Krishna Chaturdashi with pure water, milk, honey and bilva leaves.', te: 'కృష్ణ చతుర్దశి నాడు నిర్వహించబడే మహాన్యాస పూర్వక ఏకాదశ రుద్రాభిషేకం — అత్యంత శక్తివంతమైన మాసిక శివ ఆరాధన.' },
      next_date: new Date('2026-11-08T17:30:00.000Z'),
      tithi_info: { en: 'Krishna Chaturdashi • Pradosha Kala Muhurtham', te: 'బహుళ చతుర్దశి • ప్రదోష కాల ముహూర్తం' },
      time_display: { en: '06:00 PM - 08:30 PM IST', te: 'సాయంత్రం 06:00 - 08:30 IST' },
      duration_mins: 150,
      frequency: { en: 'Monthly (Krishna Chaturdashi)', te: 'మాసికం (కృష్ణ చతుర్దశి)' },
      price_online: 700,
      price_offline: 1100,
      online_includes: [{ en: 'Individual Gotra-Nama Sankalpam in your name', te: 'మీ పేరు, గోత్రంతో వ్యక్తిగత సంకల్పం' }, { en: 'Private YouTube Live (4K HD)', te: 'ప్రైవేట్ యూట్యూబ్ లైవ్ (4K HD)' }, { en: 'HD Recording access (7 days)', te: 'HD రికార్డింగ్ (7 రోజులు)' }],
      offline_includes: [{ en: 'In-person Darshan at temple', te: 'ఆలయంలో ప్రత్యక్ష దర్శనం' }, { en: 'Panchamruta Prasadam', te: 'పంచామృత ప్రసాదం' }],
      deliverables: [{ en: 'HD recording link (shared via WhatsApp)', te: 'HD రికార్డింగ్ లింక్ (వాట్సాప్ ద్వారా)' }],
      image_url: '/assets/shivaratri-rudrabhishekam.jpg',
      faqs: [{ id: 'faq-msr-1', question: { en: 'When is the live stream available?', te: 'లైవ్ స్ట్రీమ్ ఎప్పుడు అందుబాటులో ఉంటుంది?' }, answer: { en: 'The private YouTube live link is shared via WhatsApp 2 hours before the ceremony.', te: 'ప్రైవేట్ యూట్యూబ్ లైవ్ లింక్ క్రతువుకు 2 గంటల ముందు వాట్సాప్ ద్వారా పంపబడుతుంది.' } }],
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'grp-sankatahara-ganapathi',
      slug: 'sankatahara-chaturthi-ganapathi-homam',
      title: { en: 'Sankatahara Chaturthi Maha Ganapathi Homam', te: 'సంకటహర చతుర్థి మహా గణపతి హోమం' },
      subtitle: { en: 'Monthly obstacle-destroying Ganesha fire ceremony', te: 'మాసిక విఘ్నహర గణపతి హోమం' },
      deity: { en: 'Lord Ganesha (Vighnaharta)', te: 'శ్రీ మహా గణపతి (విఘ్నహర్త)' },
      short_desc: { en: 'Powerful monthly Ganapathi Homam performed on Sankatahara Chaturthi with 108 Modaka Ahutis, removing obstacles and inviting divine grace into your endeavours.', te: 'సంకటహర చతుర్థి నాడు 108 మోదక ఆహుతులతో నిర్వహించబడే శక్తివంతమైన గణపతి హోమం.' },
      next_date: new Date('2026-11-17T08:30:00.000Z'),
      tithi_info: { en: 'Krishna Chaturthi • Sankatahara Muhurtham', te: 'బహుళ చతుర్థి • సంకటహర ముహూర్తం' },
      time_display: { en: '08:30 AM - 11:00 AM IST', te: 'ఉదయం 08:30 - 11:00 IST' },
      duration_mins: 150,
      frequency: { en: 'Monthly (Krishna Chaturthi)', te: 'మాసికం (కృష్ణ చతుర్థి)' },
      price_online: 751,
      price_offline: 1100,
      online_includes: [{ en: 'Individual Sankalpam for your family', te: 'కుటుంబ సంకల్పం' }, { en: 'Live Darshan (YouTube Private)', te: 'లైవ్ దర్శనం (యూట్యూబ్ ప్రైవేట్)' }],
      offline_includes: [{ en: 'Temple attendance', te: 'ఆలయ హాజరు' }, { en: 'Modaka Prasadam', te: 'మోదక ప్రసాదం' }],
      deliverables: [{ en: 'HD Recording (48 hours post ceremony)', te: 'HD రికార్డింగ్ (క్రతువు తర్వాత 48 గంటలలో)' }],
      image_url: '/assets/ganapathi-homam.jpg',
      faqs: [],
      is_active: true,
      sort_order: 2,
    },
    {
      id: 'grp-pournami-lalitha',
      slug: 'pournami-lalitha-sahasranama-kumkumarchana',
      title: { en: 'Pournami Lalitha Sahasranama Kumkumarchana', te: 'పౌర్ణమి లలిత సహస్రనామ కుంకుమార్చన' },
      subtitle: { en: 'Full moon sacred Devi worship with 1000 names of Lalitha', te: 'పౌర్ణమి నాడు లలిత సహస్రనామ కుంకుమార్చన' },
      deity: { en: 'Sri Lalitha Tripurasundari (Devi)', te: 'శ్రీ లలిత త్రిపురసుందరి (దేవి)' },
      short_desc: { en: 'Auspicious Pournami ceremony with 1008 Kumkum archana using Lalitha Sahasranama, invoking the grace of Devi Lalitha for prosperity, love and liberation.', te: 'లలిత సహస్రనామంతో 1008 కుంకుమార్చన — సమృద్ధి, ప్రేమ మరియు మోక్షం కొరకు దేవి ఆశీర్వాదం.' },
      next_date: new Date('2026-11-23T18:00:00.000Z'),
      tithi_info: { en: 'Purnima (Full Moon) • Devi Kala', te: 'పూర్ణిమ • దేవి కాల' },
      time_display: { en: '06:30 PM - 08:30 PM IST', te: 'సాయంత్రం 06:30 - 08:30 IST' },
      duration_mins: 120,
      frequency: { en: 'Monthly (Pournami)', te: 'మాసికం (పౌర్ణమి)' },
      price_online: 651,
      price_offline: 1001,
      online_includes: [{ en: 'Gotra-Nama archana in your name', te: 'గోత్ర-నామ అర్చన' }, { en: 'Live Darshan', te: 'లైవ్ దర్శనం' }],
      offline_includes: [{ en: 'Temple attendance with kumkuma prasadam', te: 'కుంకుమ ప్రసాదంతో ఆలయ హాజరు' }],
      deliverables: [{ en: 'HD Recording', te: 'HD రికార్డింగ్' }],
      image_url: '/assets/lalitha-kumkumarchana.jpg',
      faqs: [],
      is_active: true,
      sort_order: 3,
    },
  ]

  for (const gp of groupPoojas) {
    await prisma.groupPooja.upsert({ where: { id: gp.id }, create: gp as never, update: {} })
  }
  console.log('✓ Group poojas seeded')

  // ── Group Package ───────────────────────────────────────────────────────────
  await prisma.groupPackage.upsert({
    where: { id: 'pkg-3cycle-shiva-ganapathi' },
    create: {
      id: 'pkg-3cycle-shiva-ganapathi',
      slug: '3-cycle-shiva-ganapathi-package',
      name: { en: '3-Cycle Vighna Nivarana & Shiva Abhishekam Package', te: '3-దఫాల విఘ్న నివారణ & శివ అభిషేక సామూహిక ప్యాకేజీ' },
      description: { en: 'Continuous spiritual alignment across the next 3 Masa Shivaratri and 3 Sankatahara Chaturthi cycles.', te: 'రాబోవు 3 మాస శివరాత్రి మరియు 3 సంకష్ట చతుర్థి పర్వదినాల్లో నిరంతర పూజా భాగస్వామ్యం.' },
      cycle_count: 3,
      price_per_person: 4999,
      status: 'active',
      featured: true,
      mode: 'online',
      prasadam_enabled: true,
      prasadam_price: 650,
      annadanam_enabled: true,
      pass_eligible: false,
      display_order: 1,
      included_poojas: [
        { id: 'inc-p1', package_id: 'pkg-3cycle-shiva-ganapathi', recurring_pooja_id: 'grp-sankatahara-ganapathi', recurring_pooja_slug: 'sankatahara-chaturthi-ganapathi-homam', name: { en: 'Sankatahara Chaturthi Maha Ganapathi Homam', te: 'సంకష్టహర చతుర్థి మహా గణపతి హోమం' }, deity: { en: 'Lord Ganesha', te: 'శ్రీ మహా గణపతి' }, normal_price_per_person: 751, display_order: 1 },
        { id: 'inc-p2', package_id: 'pkg-3cycle-shiva-ganapathi', recurring_pooja_id: 'grp-masa-shivaratri', recurring_pooja_slug: 'masa-shivaratri-rudrabhishekam', name: { en: 'Masa Shivaratri Mahanyasa Rudrabhishekam', te: 'మాస శివరాత్రి మహాన్యాస పూర్వక ఏకాదశ రుద్రాభిషేకం' }, deity: { en: 'Lord Shiva', te: 'శ్రీ పరమేశ్వరుడు' }, normal_price_per_person: 700, display_order: 2 },
      ],
      benefits: [{ id: 'ben-1', benefit_text: { en: 'Individual Gotra-Nama Sankalpam in all 6 ceremonies', te: 'మొత్తం 6 క్రతువులలో ప్రతి వ్యక్తికి వ్యక్తిగత గోత్రనామ సంకల్పం' }, display_order: 1 }, { id: 'ben-2', benefit_text: { en: 'Save ₹2,506 vs booking individually', te: 'వ్యక్తిగతంగా బుక్ చేసిన దానికంటే ₹2,506 ఆదా' }, display_order: 2 }],
    } as never,
    update: {},
  })
  console.log('✓ Group package seeded')

  // ── FAQs ────────────────────────────────────────────────────────────────────
  const faqs = [
    { question: { en: 'How do I book a One-to-One pooja?', te: 'వన్-టు-వన్ పూజ ఎలా బుక్ చేయాలి?' }, answer: { en: 'Browse our One-to-One poojas, select your preferred ceremony, choose a package and time slot, complete payment, and our team will reach out to confirm Sankalpam details.', te: 'మా వన్-టు-వన్ పూజ జాబితా బ్రౌజ్ చేయండి, మీకు నచ్చిన క్రతువు ఎంచుకుని, ప్యాకేజీ మరియు సమయం నిర్ణయించి, చెల్లింపు పూర్తి చేయండి.' }, category: 'booking', sort_order: 1 },
    { question: { en: 'What is Sankalpam and why is it important?', te: 'సంకల్పం అంటే ఏమిటి, అది ఎందుకు ముఖ్యమైనది?' }, answer: { en: 'Sankalpam is the sacred intention-setting ritual where the Pandit chants your name, Gotram and Nakshatram to dedicate the ceremony specifically to you and your family.', te: 'సంకల్పం అంటే పండితుడు మీ పేరు, గోత్రం మరియు నక్షత్రాన్ని పఠించి క్రతువును మీకు అంకితం చేసే పవిత్ర సంకల్ప ప్రక్రియ.' }, category: 'general', sort_order: 2 },
    { question: { en: 'What is the minimum advance notice for One-to-One poojas?', te: 'వన్-టు-వన్ పూజకు కనీస ముందస్తు నోటీసు ఎంత?' }, answer: { en: 'A minimum of 48 hours advance booking is required. This ensures our Pandit team can observe proper Deeksha and procure pure Samagri.', te: 'కనీసం 48 గంటల ముందస్తు బుకింగ్ అవసరం. ఇది మా పండిత బృందం సరైన దీక్ష పాటించి స్వచ్ఛమైన సామగ్రి సమకూర్చుకోవడానికి వీలు కల్పిస్తుంది.' }, category: 'booking', sort_order: 3 },
    { question: { en: 'What is the Pooja Pass?', te: 'పూజా పాస్ అంటే ఏమిటి?' }, answer: { en: 'Pooja Pass is a one-time purchase subscription that gives you exclusive discounts on every pooja booking. It never expires and pays for itself after just 1-2 bookings.', te: 'పూజా పాస్ అనేది ఒక్కసారి కొనుగోలు చేసే సభ్యత్వం. ప్రతి పూజ బుకింగ్‌పై ప్రత్యేక తగ్గింపులు పొందవచ్చు. గడువు లేదు.' }, category: 'pass', sort_order: 4 },
  ]
  for (const faq of faqs) {
    await prisma.faq.create({ data: faq as never }).catch(() => {})
  }
  console.log('✓ FAQs seeded')

  // ── Settings ────────────────────────────────────────────────────────────────
  const settings = [
    { key: 'app_name', value: 'Mantram360' },
    { key: 'support_mobile', value: '+91 9876543210' },
    { key: 'support_email', value: 'support@mantram360.com' },
    { key: 'temple_name', value: 'Sri Kshetra Mantram360 Consecrated Sanctuary' },
    { key: 'temple_address', value: 'Mantram360 Sacred Temple, Hyderabad, Telangana' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, create: s, update: {} })
  }
  console.log('✓ Settings seeded')

  console.log('\n🎉 Seed complete!')
  console.log('Admin login: admin / Mantram@2024')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
