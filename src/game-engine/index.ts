export * from './types';
export * from './utils/deck';
export * from './utils/shuffle';
export {
  CourtPieceEngine,
  courtPieceEngine,
  type StagedDealResult,
  type CompleteDealResult,
} from './court-piece/CourtPieceEngine';
export { DemoTrickTakingEngine } from './demo/DemoTrickTakingEngine';

import { courtPieceEngine } from './court-piece/CourtPieceEngine';
export const defaultEngine = courtPieceEngine;
