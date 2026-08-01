import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getQuestionMetadata, searchQuestionsBySubtopic } from '@/lib/embeddings';
import { getUserProgressStats, updateUserProgress } from '@/lib/progress';
import prisma from '@/lib/prisma';
import type { questions } from '@/lib/generated/prisma';

interface ChatMessage {
  role: string;
  content?: string;
  type?: string;
  questionData?: questions;
  questionsData?: questions[];
}

const EXAM_DATE = new Date('2025-11-30');
const TODAY = new Date();
const DAYS_REMAINING = Math.ceil((EXAM_DATE.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    if (!userId) {
      console.error('[Chat API] User ID not found in session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: (session?.user as { id?: string })?.id,
      });
      
      // Try to fetch user by email as fallback
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          });
          if (dbUser) {
            // Update session user ID for this request
            (session.user as { id?: string }).id = dbUser.id;
            const fallbackUserId = dbUser.id;
            console.log('[Chat API] Found user by email, using ID:', fallbackUserId);
            // Continue with fallbackUserId
            return await handleChatRequest(fallbackUserId, request);
          }
        } catch (error) {
          console.error('[Chat API] Error fetching user by email:', error);
        }
      }
      
      return NextResponse.json({ error: 'User ID not found. Please sign out and sign in again.' }, { status: 400 });
    }
    
    return await handleChatRequest(userId, request);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request. Please try again.' },
      { status: 500 }
    );
  }
}

async function handleChatRequest(userId: string, request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { message, history, questionAnswer } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // Get user progress stats
    const progressStats = await getUserProgressStats(userId);

    // Get question metadata (topics/subtopics structure)
    const questionMetadata = await getQuestionMetadata();

    // Get attempted question IDs
    const attemptedQuestions = await prisma.questionAttempt.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const attemptedQuestionIds = attemptedQuestions.map((a) => a.questionId);

    // Check if this is an answer to a question (single letter A-E)
    const isAnswerSubmission = /^[A-E]$/i.test(message.trim()) && !questionAnswer;

    // Build system prompt with context (needed for both answer submissions and regular chat)
    const systemPrompt = `You are an expert CAT (Common Admission Test) preparation assistant. Today is ${TODAY.toLocaleDateString()}, and the CAT exam is on November 30, 2025 (${DAYS_REMAINING} days remaining).

USER PROGRESS:
- Kaksha Score: ${progressStats.kakshaScore}%
- Total Attempts: ${progressStats.totalAttempts}
- Total Correct: ${progressStats.totalCorrect}
- Strengths (top performing areas): ${progressStats.strengths.join(', ') || 'None yet'}
- Weaknesses (areas needing improvement): ${progressStats.weaknesses.join(', ') || 'None yet'}

AVAILABLE TOPICS AND SUBTOPICS:
${JSON.stringify(questionMetadata, null, 2)}

INSTRUCTIONS:
1. When the user EXPLICITLY wants to practice, asks for a question, or requests a new problem, use the [ASK_QUESTION] function to get questions from the database.
2. DO NOT automatically ask questions after providing feedback on an answer. Only ask questions when the user explicitly requests them or indicates they want to continue practicing.
3. When asking a question, provide context like "Let's practice arithmetic. Here's a classic shopkeeper problem:" then show the question.
4. Use explanations from the database when available, but explain them clearly.
5. Adapt difficulty based on user performance.
6. You can switch topics based on user request or if they're strong in current topic.
7. Prioritize syllabus coverage based on days remaining until exam.
8. Be encouraging and supportive.
9. After providing feedback on an answer, wait for the user to respond or ask for another question before asking a new one.

QUESTION SELECTION:
- To ask a question, respond with: [ASK_QUESTION:section=<section>,topic=<topic>,subtopic=<subtopic>]
- The system will provide you with 5-10 question objects
- Select one appropriate question and present it to the user
- Each question object contains: question_id, question_html, option_a_html, option_b_html, option_c_html, option_d_html, option_e_html, answer, explanation_html, topic, subtopic, section

Remember: Always use questions from the database. Never make up questions.`;

    // Check if user is submitting an answer to a question (old format with questionAnswer object)
    if (questionAnswer) {
      console.log('[Chat API] Processing answer submission:', questionAnswer);
      
      // Get the question to provide explanation - fetch fresh from database
      const question = await prisma.questions.findUnique({
        where: { question_id: questionAnswer.questionId },
      });

      if (!question) {
        console.error('[Chat API] Question not found:', questionAnswer.questionId);
        return NextResponse.json(
          { error: 'Question not found', message: 'Question not found in database' },
          { status: 404 }
        );
      }

      // Provide feedback and explanation
      const isCorrect = question.answer?.trim().toUpperCase() === questionAnswer.answer.trim().toUpperCase();
      
      // Build conversation history including ALL messages (including questions) for full context
      const chatHistory = (history || []).slice(-15); // Get more history for better context

      // Convert history to Gemini format, including question context
      const historyForGemini = chatHistory.map((msg: ChatMessage) => {
        // If this is a question message, include the question context in the assistant's message
        if (msg.role === 'assistant' && (msg.type === 'question' || msg.type === 'set')) {
          const questionData = msg.questionsData?.[0] || msg.questionData;
          if (questionData) {
            // Build a natural description of the question
            const questionText = questionData.set_html 
              ? `I presented you with a passage and question:\n\n[Passage]\n${questionData.set_html}\n\n[Question]\n${questionData.question_html}`
              : `I asked you this question:\n${questionData.question_html || ''}`;
            
            const introText = msg.content || 'Here\'s a question for you to practice:';
            return {
              role: 'model',
              parts: [{ text: `${introText}\n\n${questionText}` }],
            };
          }
        }
        // For regular text messages, include them as-is
        if (msg.content) {
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          };
        }
        // Skip messages without content
        return null;
      }).filter((msg: { role: string; parts: Array<{ text: string }> } | null): msg is { role: string; parts: Array<{ text: string }> } => msg !== null);

      // Build enhanced prompt that references the conversation history
      const answerContextPrompt = `The user just submitted their answer: "${questionAnswer.answer}".

${isCorrect ? '✅ Their answer is CORRECT!' : `❌ Their answer is INCORRECT. The correct answer is ${question.answer}.`}

Here's the explanation from the database to help you provide context:
${question.explanation_html || 'No explanation available in database.'}

IMPORTANT: This is just feedback on their answer. DO NOT ask a new question automatically. Only provide feedback and explanation. Wait for the user to explicitly ask for another question or indicate they want to continue practicing. Respond naturally, acknowledging their answer. If they were correct, congratulate them and reinforce the concept. If they were wrong, help them understand why and explain the correct approach. Use the explanation from the database as context, but explain it in your own words in a clear, encouraging way. Keep your response conversational and helpful (2-4 sentences). DO NOT include [ASK_QUESTION] or ask another question unless the user explicitly requests it.`;

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Use chat API with history to maintain context
        const chat = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
            {
              role: 'model',
              parts: [{ text: 'I understand. I\'m ready to help you with CAT preparation.' }],
            },
            ...historyForGemini,
          ],
        });

        // Add the user's answer message and context
        const userAnswerMessage = `I selected: ${questionAnswer.answer}`;
        const result = await chat.sendMessage(`${userAnswerMessage}\n\n${answerContextPrompt}`);
        const response = await result.response;
        const explanation = response.text();

        console.log('[Chat API] Generated explanation with context, isCorrect:', isCorrect);

        return NextResponse.json({
          message: explanation,
          text: explanation, // Also include as 'text' for compatibility
          isCorrect,
          correctAnswer: question.answer,
        });
      } catch (error) {
        console.error('[Chat API] Error generating explanation:', error);
        // Fallback response
        return NextResponse.json({
          message: isCorrect 
            ? `Great job! Your answer "${questionAnswer.answer}" is correct. ${question.explanation_html || 'Well done!'}`
            : `Not quite. The correct answer is ${question.answer}. ${question.explanation_html || 'Keep practicing!'}`,
          text: isCorrect 
            ? `Great job! Your answer "${questionAnswer.answer}" is correct. ${question.explanation_html || 'Well done!'}`
            : `Not quite. The correct answer is ${question.answer}. ${question.explanation_html || 'Keep practicing!'}`,
          isCorrect,
          correctAnswer: question.answer,
        });
      }
    }

    // Check if message contains explicit question request pattern
    // Make it more specific to avoid triggering on vague messages
    const questionRequestPattern = /\[ASK_QUESTION\]|(ask|give|show|want|need).*(question|problem|practice|test|another|more|next)|let.*practice|test.*me|practice.*now|give.*another/i;
    const isQuestionRequest = questionRequestPattern.test(message) && 
      !message.match(/what|why|how|when|where|who|which|explain|help|understand|confused/i); // Exclude questions/confusion

    // Build conversation history - include ALL messages including questions
    const chatHistory = (history || []).slice(-15);

    // Convert history to Gemini format, including question context
    const historyForGemini = chatHistory.map((msg: ChatMessage) => {
      // Include question data in the assistant's message
      if (msg.role === 'assistant' && (msg.type === 'question' || msg.type === 'set')) {
        const questionData = msg.questionsData?.[0] || msg.questionData;
        if (questionData) {
          const questionText = questionData.set_html 
            ? `[Passage]\n${questionData.set_html}\n\nQuestion: ${questionData.question_html}\nOptions:\nA: ${questionData.option_a_html || ''}\nB: ${questionData.option_b_html || ''}\nC: ${questionData.option_c_html || ''}\nD: ${questionData.option_d_html || ''}${questionData.option_e_html ? `\nE: ${questionData.option_e_html}` : ''}`
            : `Question: ${questionData.question_html || ''}\nOptions:\nA: ${questionData.option_a_html || ''}\nB: ${questionData.option_b_html || ''}\nC: ${questionData.option_c_html || ''}\nD: ${questionData.option_d_html || ''}${questionData.option_e_html ? `\nE: ${questionData.option_e_html}` : ''}`;
          
          const introText = msg.content || 'Here\'s a question for you:';
          return {
            role: 'model',
            parts: [{ text: `${introText}\n\n${questionText}` }],
          };
        }
      }
      // For regular messages, include them as-is
      if (msg.content) {
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        };
      }
      return null;
      }).filter((msg: { role: string; parts: Array<{ text: string }> } | null): msg is { role: string; parts: Array<{ text: string }> } => msg !== null);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Check if AI wants to ask a question
    if (isQuestionRequest || message.includes('[ASK_QUESTION]')) {
      // Extract subtopic/topic from message or use weak areas
      let targetSubtopic = '';
      let targetTopic = '';
      let targetSection = '';

      // Try to extract from message
      const subtopicMatch = message.match(/subtopic[:\s]+([^,\n]+)/i);
      const topicMatch = message.match(/topic[:\s]+([^,\n]+)/i);
      const sectionMatch = message.match(/section[:\s]+([^,\n]+)/i);

      if (subtopicMatch) targetSubtopic = subtopicMatch[1].trim();
      if (topicMatch) targetTopic = topicMatch[1].trim();
      if (sectionMatch) targetSection = sectionMatch[1].trim();

      // If no specific request, use weak areas
      if (!targetSubtopic && progressStats.weaknesses.length > 0) {
        const weakness = progressStats.weaknesses[0];
        const parts = weakness.split(' > ');
        if (parts.length === 3) {
          targetSection = parts[0];
          targetTopic = parts[1];
          targetSubtopic = parts[2];
        }
      }

      // Search for questions
      if (targetSubtopic || targetTopic || targetSection) {
        try {
          const questions = await searchQuestionsBySubtopic(
            targetSubtopic || targetTopic || '',
            targetSection || undefined,
            targetTopic || undefined,
            attemptedQuestionIds,
            10
          );

          if (questions.length > 0) {
            // Randomly select one question ID
            const selectedQuestionId = questions[Math.floor(Math.random() * questions.length)].question_id;

            // Fetch the question fresh from PostgreSQL by ID to ensure we have all fields
            const selectedQuestion = await prisma.questions.findUnique({
              where: { question_id: selectedQuestionId },
            });

            if (!selectedQuestion) {
              throw new Error(`Question ${selectedQuestionId} not found in database`);
            }

            // Check if this question belongs to a set
            let questionsToReturn = [selectedQuestion];
            if (selectedQuestion.set_id && selectedQuestion.set_id !== 'N/A') {
              // Fetch all questions from the same set
              const setQuestions = await prisma.questions.findMany({
                where: {
                  set_id: selectedQuestion.set_id,
                },
                orderBy: {
                  question_id: 'asc',
                },
              });
              
              if (setQuestions.length > 0) {
                questionsToReturn = setQuestions;
              }
            }

            // Let AI provide context before the question
            const contextPrompt = `${systemPrompt}

You found ${questions.length} questions. Here's one to ask the user:

Question ID: ${selectedQuestion.question_id}
Section: ${selectedQuestion.section}
Topic: ${selectedQuestion.topic}
Subtopic: ${selectedQuestion.subtopic}
${selectedQuestion.set_id && selectedQuestion.set_id !== 'N/A' ? `Set ID: ${selectedQuestion.set_id} (This is part of a set with ${questionsToReturn.length} questions)` : ''}
Question: ${selectedQuestion.question_html}
Options:
A: ${selectedQuestion.option_a_html || ''}
B: ${selectedQuestion.option_b_html || ''}
C: ${selectedQuestion.option_c_html || ''}
D: ${selectedQuestion.option_d_html || ''}
E: ${selectedQuestion.option_e_html || ''}

Provide a brief introduction (1-2 sentences) before presenting this question. Then respond with [QUESTION_READY] to indicate you're ready to show the question.`;

            const chat = model.startChat({
              history: [
                {
                  role: 'user',
                  parts: [{ text: systemPrompt }],
                },
                {
                  role: 'model',
                  parts: [{ text: 'I understand. I\'m ready to help with CAT preparation.' }],
                },
                ...historyForGemini,
              ],
            });

            const result = await chat.sendMessage(contextPrompt);
            const response = await result.response;
            const introText = response.text();

            // Build the full question text to include in the message
            const questionText = questionsToReturn.length > 1
              ? `${selectedQuestion.set_html ? `[Passage]\n${selectedQuestion.set_html}\n\n` : ''}${questionsToReturn.map((q, idx) => `Question ${idx + 1}:\n${q.question_html}\nOptions:\nA: ${q.option_a_html || ''}\nB: ${q.option_b_html || ''}\nC: ${q.option_c_html || ''}\nD: ${q.option_d_html || ''}${q.option_e_html ? `\nE: ${q.option_e_html}` : ''}`).join('\n\n')}`
              : `${selectedQuestion.set_html ? `[Passage]\n${selectedQuestion.set_html}\n\n` : ''}Question: ${selectedQuestion.question_html}\nOptions:\nA: ${selectedQuestion.option_a_html || ''}\nB: ${selectedQuestion.option_b_html || ''}\nC: ${selectedQuestion.option_c_html || ''}\nD: ${selectedQuestion.option_d_html || ''}${selectedQuestion.option_e_html ? `\nE: ${selectedQuestion.option_e_html}` : ''}`;

            return NextResponse.json({
              message: `${introText}\n\n${questionText}`,
              question: selectedQuestion,
              questions: questionsToReturn.length > 1 ? questionsToReturn : undefined, // Include all set questions if it's a set
            });
          }
        } catch (error) {
          console.error('Error searching questions:', error);
        }
      }
    }

    // If this looks like an answer (single letter A-E), find the question from history and provide feedback
    if (isAnswerSubmission) {
      // Find the most recent question in the history
      let questionToCheck: questions | null = null;
      for (let i = chatHistory.length - 1; i >= 0; i--) {
        const msg = chatHistory[i];
        if (msg.role === 'assistant' && (msg.type === 'question' || msg.type === 'set')) {
          questionToCheck = msg.questionsData?.[0] || msg.questionData;
          break;
        }
      }

      if (questionToCheck) {
        // Record the attempt
        const isCorrect = questionToCheck.answer?.trim().toUpperCase() === message.trim().toUpperCase();
        
        try {
          await prisma.questionAttempt.create({
            data: {
              userId,
              questionId: questionToCheck.question_id,
              userAnswer: message.trim(),
              isCorrect,
              source: 'chat',
            },
          });
          await updateUserProgress(userId, questionToCheck.question_id, isCorrect);
        } catch (error) {
          console.error('[Chat API] Error recording attempt:', error);
        }

        // Provide feedback with context
        const feedbackPrompt = `The user just answered "${message.trim()}" to the question you asked them.

${isCorrect ? '✅ Their answer is CORRECT!' : `❌ Their answer is INCORRECT. The correct answer is ${questionToCheck.answer}.`}

Question details:
- Question: ${questionToCheck.question_html || ''}
${questionToCheck.set_html ? `- Passage: ${questionToCheck.set_html.substring(0, 300)}...` : ''}
- Explanation: ${questionToCheck.explanation_html || 'No explanation available.'}

Respond naturally to the user, acknowledging their answer. If correct, congratulate them and reinforce the concept. If incorrect, help them understand why and explain the correct approach. Use the explanation as context but explain it clearly. Keep it conversational (2-4 sentences). DO NOT automatically ask a new question - wait for the user to request one.`;

        try {
          const chat = model.startChat({
            history: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }],
              },
              {
                role: 'model',
                parts: [{ text: 'I understand. I\'m ready to help you with CAT preparation.' }],
              },
              ...historyForGemini.slice(0, -1), // All history except the answer
            ],
          });

          const result = await chat.sendMessage(feedbackPrompt);
          const response = await result.response;
          const feedback = response.text();

          return NextResponse.json({
            message: feedback,
            text: feedback,
            isCorrect,
            correctAnswer: questionToCheck.answer,
          });
        } catch (error) {
          console.error('[Chat API] Error generating feedback:', error);
          // Fallback
          return NextResponse.json({
            message: isCorrect 
              ? `Great job! Your answer "${message.trim()}" is correct. ${questionToCheck.explanation_html || 'Well done!'}`
              : `Not quite. The correct answer is ${questionToCheck.answer}. ${questionToCheck.explanation_html || 'Keep practicing!'}`,
            text: isCorrect 
              ? `Great job! Your answer "${message.trim()}" is correct. ${questionToCheck.explanation_html || 'Well done!'}`
              : `Not quite. The correct answer is ${questionToCheck.answer}. ${questionToCheck.explanation_html || 'Keep practicing!'}`,
            isCorrect,
            correctAnswer: questionToCheck.answer,
          });
        }
      }
    }

    // Regular chat response
    try {
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I\'m ready to help you with CAT preparation.' }],
          },
          ...historyForGemini,
        ],
      });

      // Add reminder if this is a follow-up after an answer submission
      const lastMessage = historyForGemini[historyForGemini.length - 1];
      const isAfterAnswer = lastMessage?.parts[0]?.text?.includes('I selected:');
      const enhancedMessage = isAfterAnswer 
        ? `${message}\n\n(Note: Only ask a new question if the user explicitly requests it. Otherwise, just respond to their message naturally.)`
        : message;

      const result = await chat.sendMessage(enhancedMessage);
      const response = await result.response;
      const text = response.text();

      // Check if AI wants to ask a question (response contains [ASK_QUESTION])
      if (text.includes('[ASK_QUESTION')) {
        // Extract parameters and search for questions
        const paramsMatch = text.match(/\[ASK_QUESTION[:\s]+([^\]]+)\]/);
        if (paramsMatch) {
          const params = paramsMatch[1];
          const sectionMatch = params.match(/section=([^,]+)/);
          const topicMatch = params.match(/topic=([^,]+)/);
          const subtopicMatch = params.match(/subtopic=([^,]+)/);

          const questions = await searchQuestionsBySubtopic(
            subtopicMatch?.[1]?.trim() || topicMatch?.[1]?.trim() || '',
            sectionMatch?.[1]?.trim() || undefined,
            topicMatch?.[1]?.trim() || undefined,
            attemptedQuestionIds,
            10
          );

          if (questions.length > 0) {
            // Randomly select one question ID
            const selectedQuestionId = questions[Math.floor(Math.random() * questions.length)].question_id;

            // Fetch the question fresh from PostgreSQL by ID to ensure we have all fields
            const selectedQuestion = await prisma.questions.findUnique({
              where: { question_id: selectedQuestionId },
            });

            if (!selectedQuestion) {
              throw new Error(`Question ${selectedQuestionId} not found in database`);
            }
            
            // Check if this question belongs to a set
            let questionsToReturn = [selectedQuestion];
            if (selectedQuestion.set_id && selectedQuestion.set_id !== 'N/A') {
              // Fetch all questions from the same set
              const setQuestions = await prisma.questions.findMany({
                where: {
                  set_id: selectedQuestion.set_id,
                },
                orderBy: {
                  question_id: 'asc',
                },
              });
              
              if (setQuestions.length > 0) {
                questionsToReturn = setQuestions;
              }
            }
            
            return NextResponse.json({
              message: text.replace(/\[ASK_QUESTION[^\]]+\]/, '').trim(),
              question: selectedQuestion,
              questions: questionsToReturn.length > 1 ? questionsToReturn : undefined, // Include all set questions if it's a set
            });
          }
        }
      }

      return NextResponse.json({ message: text });
    } catch (chatError) {
      // Fallback to generateContent
      console.log('Chat API failed, using generateContent fallback:', chatError);

      const promptWithContext = chatHistory.length > 0
        ? `${systemPrompt}\n\nPrevious conversation:\n${chatHistory.map((msg: { role: string; content?: string }) =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content || ''}`
          ).join('\n')}\n\nUser: ${message}\nAssistant:`
        : `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

      const result = await model.generateContent(promptWithContext);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({ message: text });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI. Please try again.' },
      { status: 500 }
    );
  }
}
