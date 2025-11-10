import type { questions } from './generated/prisma';

/**
 * Creates a single, rich text document from a Question object
 * including ALL metadata for embedding.
 * @param {object} question - The Question object from Prisma
 */
export function createFusedDocument(question: questions): string {
  // Format options
  const options: string[] = [];
  if (question.option_a_html) options.push(`- A: ${question.option_a_html}`);
  if (question.option_b_html) options.push(`- B: ${question.option_b_html}`);
  if (question.option_c_html) options.push(`- C: ${question.option_c_html}`);
  if (question.option_d_html) options.push(`- D: ${question.option_d_html}`);
  if (question.option_e_html) options.push(`- E: ${question.option_e_html}`);
  
  const optionsString = options.length > 0 ? options.join('\n') : 'N/A';

  // Combine ALL fields into a single string.
  // Labels help the model understand the context of the words.
  const fusedDoc = `
    Question ID: ${question.question_id || 'N/A'}
    Set ID: ${question.set_id || 'N/A'}
    Source: ${question.source || 'N/A'}
    Year: ${question.year || 'N/A'}
    Slot: ${question.slot || 'N/A'}
    Section: ${question.section || 'N/A'}
    Topic: ${question.topic || 'General'}
    Subtopic: ${question.subtopic || 'N/A'}
    Question Type: ${question.question_type || 'N/A'}
    ---
    Set Context (Passage/Common Content): ${question.set_html || ''}
    ---
    Question Text: ${question.question_html || ''}
    ---
    Options:
    ${optionsString}
    ---
    Correct Answer: ${question.answer || 'N/A'}
    ---
    Explanation: ${question.explanation_html || 'N/A'}
    Video Explanation: ${question.video_explanation_link || 'N/A'}
  `;

  // Clean up whitespace but preserve structure
  return fusedDoc.replace(/\n\s*\n/g, '\n').trim();
}

