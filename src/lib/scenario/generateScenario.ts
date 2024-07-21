import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const UserResponseSchema = z
  .object({
    responseContent: z.string().describe("The user's response to the question"),
    responseTimeSeconds: z
      .number()
      .describe("Time taken by the user to respond, in seconds"),
    targetLanguageTextShown: z
      .boolean()
      .describe("Whether the question text was shown in the target language"),
    nativeLanguageTextShown: z
      .boolean()
      .describe(
        "Whether the question text was shown in the user's native language"
      ),
    submittedAt: z
      .number()
      .describe("Timestamp of when the response was submitted"),
  })
  .describe("User's response to a language learning question");

const QuestionSchema = z
  .object({
    questionText: z
      .string()
      .describe("The text of the question posed to the user"),
    userResponse: UserResponseSchema,
  })
  .describe("A question and the user's response to it");

const UserScenarioSchema = z
  .object({
    scenarioContent: z
      .string()
      .describe(
        "The full text of the language learning scenario presented to the user"
      ),
    questions: z
      .array(QuestionSchema)
      .describe("List of questions and responses related to this scenario"),
    seenAt: z
      .number()
      .describe("Timestamp of when the scenario was presented to the user"),
  })
  .describe(
    "A complete language learning scenario, including content, questions, and user responses"
  );

const CEFRLevelSchema = z
  .enum(["A1", "A2", "B1", "B2", "C1", "C2"])
  .describe(
    "CEFR (Common European Framework of Reference for Languages) proficiency level"
  );

export const GenerateScenarioInputSchema = z
  .object({
    language: z.string().describe("The target language for learning"),
    currentLevel: CEFRLevelSchema,
    userHistory: z
      .array(UserScenarioSchema)
      .describe("History of user's previous scenarios"),
    nativeLanguage: z.string().describe("The user's native language"),
  })
  .describe("Input data for generating a language learning scenario");

export type GenerateScenarioInput = z.infer<typeof GenerateScenarioInputSchema>;

const GeneratedQuestionSchema = z
  .object({
    questionText: z
      .string()
      .describe("The text of a generated question for the learning scenario"),
  })
  .describe("A generated question for language learning");

export const GenerateScenarioOutputSchema = z
  .object({
    scenarioContent: z
      .string()
      .describe("The full text of the generated language learning scenario"),
    questions: z
      .array(GeneratedQuestionSchema)
      .min(2, "At least two questions must be generated")
      .max(4, "No more than four questions should be generated")
      .describe("List of 2-4 generated questions for this scenario"),
  })
  .describe("Output data from the language learning scenario generator");

export type GenerateScenarioOutput = z.infer<
  typeof GenerateScenarioOutputSchema
>;

export const generateScenario = async (
  input: GenerateScenarioInput,
  options?: {
    onFinish?: (data: GenerateScenarioOutput) => void;
    onError?: (error: unknown) => void;
  }
) => {
  const currentTime = Date.now();

  // Calculate time differences
  const scenariosWithTimeDiff = input.userHistory.map((scenario) => {
    const timeSinceScenario =
      (currentTime - scenario.seenAt) / (1000 * 60 * 60 * 24); // Convert to days
    const questionsWithTimeDiff = scenario.questions.map((question) => {
      const timeSinceResponse =
        (currentTime - question.userResponse.submittedAt) /
        (1000 * 60 * 60 * 24); // Convert to days
      return { ...question, timeSinceResponse };
    });
    return { ...scenario, questions: questionsWithTimeDiff, timeSinceScenario };
  });

  const prompt = `
  You are a language learning content creator specializing in ${
    input.language
  }. Your task is to create a language learning scenario for a learner at CEFR level ${
    input.currentLevel
  }. The learner's native language is ${input.nativeLanguage}.
  
  ${
    scenariosWithTimeDiff.length > 0
      ? `Time since last scenario: ${scenariosWithTimeDiff[
          scenariosWithTimeDiff.length - 1
        ].timeSinceScenario.toFixed(2)} days`
      : "This is the learner's first scenario"
  }
  
  Generate a continuous piece of text in ${
    input.language
  } appropriate for CEFR level ${
    input.currentLevel
  }. This should be a monologue or a prose passage. The content should be 10-15 sentences long and include vocabulary and grammar structures typical for this level. Ensure the text has a clear theme, context, and flow.
  
  Topics can include personal experiences, descriptions of events or places, explanations of concepts, or narratives. Ensure the content is engaging and relevant to learners at the ${
    input.currentLevel
  } level.
  
  After the scenario, generate 2-4 questions in ${
    input.language
  } that test comprehension and language skills at level ${input.currentLevel}. 
  
  ${
    scenariosWithTimeDiff.length > 0
      ? `
  Consider the following user history when creating the content and questions:
  ${scenariosWithTimeDiff
    .map(
      (scenario, index) => `
  Scenario ${index + 1} (${scenario.timeSinceScenario.toFixed(2)} days ago):
  Content: ${scenario.scenarioContent}
  ${scenario.questions
    .map(
      (q, qIndex) => `
  Question ${qIndex + 1}: ${q.questionText}
  User Response: ${q.userResponse.responseContent}
  Response time: ${q.userResponse.responseTimeSeconds} seconds
  Target language text shown: ${q.userResponse.targetLanguageTextShown}
  Native language text shown: ${q.userResponse.nativeLanguageTextShown}
  Time since response: ${q.timeSinceResponse.toFixed(2)} days
  `
    )
    .join("")}
  `
    )
    .join("")}
  
  Analyze these scenarios to determine:
  1. The user's learning style (e.g., if they often need text shown, or if they respond quickly)
  2. Patterns in response content that might indicate areas of strength or weakness
  3. Topics or grammatical structures the user seems comfortable or uncomfortable with
  
  Adjust the difficulty, focus, and style of the content and questions based on this analysis, the time since each scenario was presented, and the time since each response.
  `
      : `As there is no user history, create a balanced set of content and questions covering various aspects of language competency for level ${input.currentLevel}.`
  }
  
  Incorporate cultural references, idiomatic expressions, or cultural practices relevant to ${
    input.language
  }-speaking regions, ensuring these elements are appropriate for the ${
    input.currentLevel
  } level of proficiency.
  
  Provide the scenario content followed by the questions, all in ${
    input.language
  }.
  `;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4-turbo"),
      schema: GenerateScenarioOutputSchema,
      prompt: prompt,
    });

    options?.onFinish?.(object);
  } catch (error) {
    options?.onError?.(error);
  }
};
