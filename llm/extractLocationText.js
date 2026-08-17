const client =
  require("./client");

async function extractLocationText(
  rawMessage
) {
  try {
    const completion =
      await client.chat.completions.create(
        {
          model:
            "qwen/qwen3-32b",

          temperature: 0.1,

          response_format: {
            type: "json_object",
          },

          messages: [
            {
              role: "system",

              content: `
                You are an AI system that extracts ONLY the location name from WhatsApp job posts.
                Always include the area/neighborhood name for accuracy.

                Rules:
                - Return ONLY valid JSON
                - Never explain anything  
                - Never use markdown
                - Always be as specific as possible
                - Always add the city/area context if known
                - If location is in Ernakulam/Kochi area, add "Kochi" for clarity

                Examples:

                Input: "LOCATION: TOWNHALL"
                Output: { "location_text": "Townhall Kaloor Kochi" }

                Input: "Near Lulu backside"
                Output: { "location_text": "LuLu Mall Edappally Kochi" }

                Input: "Kalamassery medical college"
                Output: { "location_text": "Medical College Kalamassery Kochi" }

                Input: "Need workers at Kakkanad"
                Output: { "location_text": "Kakkanad Kochi" }

                If no location exists:
                { "location_text": null }
                `,
            },

            {
              role: "user",

              content:
                rawMessage,
            },
          ],
        }
      );

    const content =
      completion.choices[0]
        .message.content;

    const parsed =
      JSON.parse(content);

    return (
      parsed.location_text ||
      null
    );
  } catch (err) {
    console.error(
      "[LOCATION LLM ERROR]",
      err.response?.data ||
        err.message
    );

    return null;
  }
}

module.exports =
  extractLocationText;

