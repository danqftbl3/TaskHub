/**
 * Academic-integrity guardrail. Enforced in code BEFORE any model (or offline coach) is consulted.
 * If isHomeworkRequest() is true, the app never asks a model to produce answer text.
 */

const norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();

const WORK = '(?:homework|home work|assignment|essay|paper|worksheet|report|dbq|thesis|paragraph|paragraphs|conclusion|introduction|intro|answers?|questions?|summary|reflection|lab report|discussion post|short answer|response|take home|test|quiz|exam|problem set|project)';
const DO_VERB = '(?:do|write|complete|finish|solve|answer|draft|compose|generate|make|create|produce|type|fill in|fill out|knock out|handle|redo|rewrite|rephrase|paraphrase)';

const STRONG = [
  new RegExp(`\\b${DO_VERB}\\b.{0,40}\\b(?:my|this|the|our|these|that|a|an|me a)\\b.{0,30}\\b${WORK}\\b`),
  new RegExp(`\\b${DO_VERB}\\b.{0,25}\\b${WORK}\\b.{0,20}\\bfor me\\b`),
  /\b(?:do|write|finish|complete|solve|answer) (?:it|this|that|them|these) for me\b/,
  /\bfor me\b.{0,25}\b(?:homework|essay|paper|assignment|answers?)\b/,
  /\b(?:just )?(?:give|tell|send|show) me (?:the |all the |all of the )?(?:answers?|solutions?|final answer|answer key)\b/,
  /\bwhat (?:should|do) i (?:write|put|say) (?:for|in|as)\b.{0,40}\b(?:answer|essay|paper|question|paragraph)/,
  /\b(?:i can|i could|i'?ll|to|that i can|so i can|so i could|ready to) (?:just )?(?:copy|paste|copy and paste|copy paste|submit|turn in|hand in|upload)\b/,
  /\bcopy (?:and|&) paste\b|\bcopy[- ]paste\b/,
  /\b(?:ready|good) to (?:submit|turn in|hand in)\b/,
  /\b(?:finished|final|complete|full|polished|ready made|ready-made) (?:version|draft|essay|paper|answer|answers|paragraph)\b/,
  /\bwrite (?:it|this|that) (?:all )?(?:out )?for me\b/,
  /\bwithout (?:me )?(?:having to )?(?:think|doing any|writing)\b/,
  /\bpretend (?:you(?:'re| are)|to be) me\b.{0,40}\b(?:write|answer|essay)\b/,
  /\bhomework (?:for me|answers)\b/,
];

// Genuine learning requests are allowed unless a disguise marker is also present.
const LEARNING = /^(?:how (?:do|can|should|would|to)|what (?:is|are|was|were|does|did)|why|who|when|where|explain|can you explain|help me (?:understand|learn|study)|tell me about|teach me|quiz me|what's|whats)\b/;
const DISGUISE = /\bfor me\b|\bcopy\b|\bpaste\b|\bsubmit\b|\bturn in\b|\bhand in\b|\bgive me (?:a|an|the) (?:\w+ ){0,3}(?:paragraph|essay|answer|paper)\b/;

export function isHomeworkRequest(text) {
  const t = norm(text);
  if (!t) return false;
  const hit = STRONG.some((re) => re.test(t)) || /\bgive me (?:a|an|the|my) (?:\w+ ){0,4}(?:paragraph|essay|paper|answers?)\b/.test(t) && DISGUISE.test(t);
  if (!hit) return false;
  if (LEARNING.test(t) && !DISGUISE.test(t)) return false;
  return true;
}

export function detectTopic(text) {
  const t = norm(text);
  if (/\bcold war\b/.test(t)) return 'Cold War';
  const m = t.match(/\b(?:my|this|the)\s+([a-z0-9 ]{3,30}?)\s+(?:homework|assignment|essay|paper|worksheet|report|project)\b/);
  if (m && !/^(?:homework|history|own)$/.test(m[1])) return m[1].replace(/\b\w/g, (c) => c.toUpperCase());
  return '';
}

export const refusalIntro = (topic) =>
  `I can't write your ${topic ? topic + ' ' : ''}homework for you, but I can guide you through it step by step so you understand the concepts and can complete it on your own. Let's tackle it together!`;

/** Three-step scaffold: context (2 sentences), structural outline (no finished prose), one Socratic question. */
export function buildRefusal(text) {
  const topic = detectTopic(text);
  if (topic === 'Cold War') {
    return {
      refused: true, topic, intro: refusalIntro(topic),
      steps: [
        { title: 'Step 1: Historical context', body: 'After World War II the United States and the Soviet Union emerged as rival superpowers with opposing systems: capitalism and democracy versus communism. Neither side fought the other directly, so the "cold" war played out through alliances, aid, an arms race and proxy conflicts.' },
        { title: 'Step 2: Structural outline (you fill in the content)', items: [
          'Intro: context in one line, then your own thesis [your claim about what drove the rivalry]',
          'Body 1: Origins, [one cause + your evidence from class notes]',
          'Body 2: Containment, [one example + how it worked + why it mattered]',
          'Body 3: A flashpoint, [Berlin or Cuba: what happened + what it shows]',
          'Conclusion: [what your evidence says about your thesis, in your own words]',
        ] },
        { title: 'Step 3: Your turn to think', question: 'Looking at your teacher\'s notes, which single event best shows how the superpowers competed without fighting each other directly, and what does it prove?' },
      ],
    };
  }
  return {
    refused: true, topic, intro: refusalIntro(topic),
    steps: [
      { title: 'Step 1: Context', body: 'Strong work starts by pinning down exactly what the task asks and what evidence you have. Your teacher\'s notes in the Study Vault are the best place to find that evidence.' },
      { title: 'Step 2: Structural outline (you fill in the content)', items: [
        'Opening: [restate the task in your own words + your main claim]',
        'Point 1: [claim + evidence from your notes + why it matters]',
        'Point 2: [claim + evidence from your notes + why it matters]',
        'Closing: [what your points add up to]',
      ] },
      { title: 'Step 3: Your turn to think', question: 'In one sentence of your own, what is the main thing this task is asking you to show?' },
    ],
  };
}

export const SYSTEM_PROMPT = `You are TaskHub, a supportive, encouraging Socratic tutor for students.
RULES (non-negotiable): Never write, complete or rewrite a student's homework, essay, paragraph, answers or any text intended to be submitted. Never give final answers to assignment questions. Teach concepts step by step, ask one guiding question at a time, and give outlines only as structure with no finished prose. Anchor claims to the teacher's uploaded notes when provided; label anything else "Beyond your teacher's notes". If the notes do not cover a topic, say so; never invent teacher content. Keep replies under 180 words.`;
