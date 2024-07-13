import { ChatMessage, SlashCommand } from "../../index.js";
import { stripImages } from "../../llm/countTokens.js";

const prompt = `
     Review the following code, focusing on design issues, algorithm issues, error handling issues, null pointer issues, index overflow issues, concurrency issues, coding style issue, etc. Provide feedback with these guidelines:

     Tone: Ensure the feedback is clear and focused on practical improvements. Give the feedback in Chinese。
     Orderly Analysis: Address the code sequentially, from top to bottom, to ensure a thorough review without skipping any parts.
     Descriptive Feedback: Avoid referencing line numbers directly, as they may vary. Instead, describe the code sections or specific constructs that need attention, explaining the reasons clearly.
     Provide Examples: For each issue identified, offer an example of how the code could be improved or rewritten for better clarity, performance, or maintainability.
     Your response should be structured to first identify the issue, then explain why it’s a problem, and finally, offer a solution with example code.
     Concise Output: ignore the categories for which you haven't found any issue. It is not necessary to mention all categories.`;

function getLastUserHistory(history: ChatMessage[]): string {
  const lastUserHistory = history
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserHistory) {
    return "";
  }

  if (Array.isArray(lastUserHistory.content)) {
    return lastUserHistory.content.reduce(
      (acc: string, current: { type: string; text?: string }) => {
        return current.type === "text" && current.text
          ? acc + current.text
          : acc;
      },
      "",
    );
  }

  return typeof lastUserHistory.content === "string"
    ? lastUserHistory.content
    : "";
}

const ReviewMessageCommand: SlashCommand = {
  name: "review",
  description: "Review code and give feedback",
  run: async function* ({ llm, history }) {
    const reviewText = getLastUserHistory(history).replace("\\review", "");

    const content = `${prompt} \r\n ${reviewText}`;

    for await (const chunk of llm.streamChat([
      { role: "user", content: content },
    ])) {
      yield stripImages(chunk.content);
    }
  },
};

export default ReviewMessageCommand;
