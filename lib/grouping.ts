// Define a clear Question type
type Question = {
    question_id: string;
    set_id: string | null;
    [key: string]: string | null | undefined; // Allow other properties
  };
  
  /**
   * Groups a list of questions into sets.
   * Standalone questions (like QA or VA) are returned as sets of 1.
   * @param questions - An array of question objects.
   * @returns An array of arrays, where each inner array is a set of questions.
   */
  export const groupQuestionsBySet = (questions: Question[]): Question[][] => {
    const uniqueSets: Record<string, Question[]> = {};
    const standaloneQuestions: Question[][] = [];
  
    questions.forEach(q => {
      // Use set_id (which is shared by LRDI and VARC's passage_id)
      const setId = q.set_id; 
  
      if (setId && setId !== 'N/A') {
        if (!uniqueSets[setId]) {
          uniqueSets[setId] = [];
        }
        uniqueSets[setId].push(q);
      } else {
        // Standalone question (like QA or VA)
        standaloneQuestions.push([q]);
      }
    });
  
    // Sort questions within each set by their ID to ensure correct order
    for (const setId in uniqueSets) {
      uniqueSets[setId].sort((a, b) => a.question_id.localeCompare(b.question_id));
    }
    
    // Combine sets and standalone questions
    return [...Object.values(uniqueSets), ...standaloneQuestions];
  };