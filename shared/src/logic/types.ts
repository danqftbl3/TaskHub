export interface Step { id: string; title: string; minutes: number; day: string | null; done: boolean; doneAt: string | null }
export interface Assignment { id: string; title: string; description: string; due: string; created: string; steps: Step[]; rescheduleFrom?: string }
export interface Term { term: string; line: number; def: string; mention?: boolean; example: string; analogy: string; academic: string }
export interface Alert { text: string; emphasis: 1 | 2 | 3; line: number }
export interface GuideCard { q: string; a: string; line: number }
export interface Guide {
  id: string; noteId?: string; title: string; subject: string; generated?: boolean; demo?: boolean; teacher: string;
  source: { name: string; lines: string[] };
  takeaways: { text: string; line: number }[];
  notes: { heading: string; line: number; body: string; why: string }[];
  terms: Term[]; alerts: Alert[]; mistakes: { text: string; line: number }[];
  beyond: { text: string }[]; cards: GuideCard[];
}
export interface Note { id: string; title: string; subject: string; kind: string; text: string; fileName: string; added: number }
export interface RefusalStep { title: string; body?: string; items?: string[]; question?: string }
export interface Refusal { refused: true; topic: string; intro: string; steps: RefusalStep[] }
