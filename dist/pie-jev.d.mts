import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
//#region src/jev.d.ts
type JevQuestionType = 'noul' | 'choice' | 'score';
type JevQuestion = {
  type: JevQuestionType;
  instructions: string;
  criteria: unknown;
};
type JevRequestControl = {
  signal?: AbortSignal;
  timeoutMs?: number;
};
type JevAnswer = {
  type: JevQuestionType;
  [key: string]: unknown;
};
type JevResponse = {
  model: string;
  answers: Record<string, JevAnswer>;
  usage: unknown;
  id: string;
  provider: string;
};
declare const JEV_MODEL = "typesafe/jev-1.13";
declare const JEV_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
declare const DEFAULT_JEV_TIMEOUT_MS = 90000;
declare function askJev(state: string, questions: Record<string, JevQuestion>, control?: JevRequestControl): Promise<JevResponse>;
//#endregion
//#region src/index.d.ts
declare function pieJevExtension(pi: ExtensionAPI): void;
//#endregion
export { DEFAULT_JEV_TIMEOUT_MS, JEV_ENDPOINT, JEV_MODEL, type JevAnswer, type JevQuestion, type JevQuestionType, type JevRequestControl, type JevResponse, askJev, pieJevExtension as default };