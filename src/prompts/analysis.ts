import { JOB_ANALYSIS_PROMPTS } from './jobAnalysis';
import { COVER_LETTER_PROMPTS } from './coverLetter';
import { CAREER_PROMPTS } from './career';
import { EDUCATION_PROMPTS } from './education';

/**
 * @deprecated Use individual prompt objects from their respective files
 * (jobAnalysis.ts, coverLetter.ts, career.ts, education.ts)
 */
export const ANALYSIS_PROMPTS = {
  ...JOB_ANALYSIS_PROMPTS,
  ...COVER_LETTER_PROMPTS,
  ...CAREER_PROMPTS,
  ...EDUCATION_PROMPTS,
};
