import dotenv from "dotenv";
import {
  generateScenario,
  GenerateScenarioInput,
  GenerateScenarioOutput,
  GenerateScenarioOutputSchema,
} from "./generateScenario";

dotenv.config();

// Make sure to set your OpenAI API key in your environment variables
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set in the environment variables.");
}

describe("generateScenario Integration Tests", () => {
  // Increase the test timeout as API calls might take longer
  jest.setTimeout(30000);

  async function runScenarioTest(
    input: GenerateScenarioInput
  ): Promise<GenerateScenarioOutput> {
    return new Promise((resolve, reject) => {
      generateScenario(input, {
        onFinish: (data) => {
          resolve(data);
        },
        onError: (error) => {
          reject(error);
        },
      }).catch((error) => {
        reject(error);
      });
    });
  }

  it("should generate a scenario for a new A2 Spanish learner without history", async () => {
    const input: GenerateScenarioInput = {
      language: "Spanish",
      currentLevel: "A2",
      nativeLanguage: "English",
      userHistory: [],
    };

    const output = await runScenarioTest(input);

    expect(() => GenerateScenarioOutputSchema.parse(output)).not.toThrow();
    expect(output.scenarioContent).toBeTruthy();
    expect(output.questions.length).toBeGreaterThanOrEqual(2);
    expect(output.questions.length).toBeLessThanOrEqual(4);
  });

  it("should generate a scenario for a B1 Spanish learner with history", async () => {
    const input: GenerateScenarioInput = {
      language: "Spanish",
      currentLevel: "B1",
      nativeLanguage: "English",
      userHistory: [
        {
          scenarioContent:
            "El verano pasado, María fue de vacaciones a la playa con su familia. Nadaron en el mar y tomaron el sol todos los días.",
          questions: [
            {
              questionText: "¿Adónde fue María de vacaciones?",
              userResponse: {
                responseContent: "María fue de vacaciones a la playa.",
                responseTimeSeconds: 8,
                targetLanguageTextShown: false,
                nativeLanguageTextShown: false,
                submittedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
              },
            },
            {
              questionText: "¿Qué actividades hicieron en la playa?",
              userResponse: {
                responseContent: "Nadaron en el mar y tomaron el sol.",
                responseTimeSeconds: 12,
                targetLanguageTextShown: false,
                nativeLanguageTextShown: false,
                submittedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
              },
            },
          ],
          seenAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        },
      ],
    };

    const output = await runScenarioTest(input);

    expect(() => GenerateScenarioOutputSchema.parse(output)).not.toThrow();
    expect(output.scenarioContent).toBeTruthy();
    expect(output.questions.length).toBeGreaterThanOrEqual(2);
    expect(output.questions.length).toBeLessThanOrEqual(4);
    expect(output.scenarioContent).not.toContain("María fue de vacaciones");
  });

  it("should generate a scenario for a C1 French learner without history", async () => {
    const input: GenerateScenarioInput = {
      language: "French",
      currentLevel: "C1",
      nativeLanguage: "English",
      userHistory: [],
    };

    const output = await runScenarioTest(input);

    expect(() => GenerateScenarioOutputSchema.parse(output)).not.toThrow();
    expect(output.scenarioContent).toBeTruthy();
    expect(output.questions.length).toBeGreaterThanOrEqual(2);
    expect(output.questions.length).toBeLessThanOrEqual(4);
  });

  it("should generate a scenario for a B2 German learner with history", async () => {
    const input: GenerateScenarioInput = {
      language: "German",
      currentLevel: "B2",
      nativeLanguage: "English",
      userHistory: [
        {
          scenarioContent:
            "Letztes Jahr besuchte Max seine Großeltern auf dem Land. Sie gingen oft im Wald spazieren und sammelten Pilze.",
          questions: [
            {
              questionText: "Wen besuchte Max letztes Jahr?",
              userResponse: {
                responseContent: "Max besuchte seine Großeltern.",
                responseTimeSeconds: 10,
                targetLanguageTextShown: false,
                nativeLanguageTextShown: false,
                submittedAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
              },
            },
            {
              questionText: "Was machten sie oft im Wald?",
              userResponse: {
                responseContent: "Sie gingen spazieren und sammelten Pilze.",
                responseTimeSeconds: 15,
                targetLanguageTextShown: false,
                nativeLanguageTextShown: false,
                submittedAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
              },
            },
          ],
          seenAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
        },
      ],
    };

    const output = await runScenarioTest(input);

    expect(() => GenerateScenarioOutputSchema.parse(output)).not.toThrow();
    expect(output.scenarioContent).toBeTruthy();
    expect(output.questions.length).toBeGreaterThanOrEqual(2);
    expect(output.questions.length).toBeLessThanOrEqual(4);
    expect(output.scenarioContent).not.toContain("Max besuchte seine Großeltern");
  });

  it("should generate a scenario for a A1 Italian learner without history", async () => {
    const input: GenerateScenarioInput = {
      language: "Italian",
      currentLevel: "A1",
      nativeLanguage: "English",
      userHistory: [],
    };

    const output = await runScenarioTest(input);

    expect(() => GenerateScenarioOutputSchema.parse(output)).not.toThrow();
    expect(output.scenarioContent).toBeTruthy();
    expect(output.questions.length).toBeGreaterThanOrEqual(2);
    expect(output.questions.length).toBeLessThanOrEqual(4);
  });
});
