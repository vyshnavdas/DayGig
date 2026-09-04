const client = require("./client");

function calculateExpireTime(work_date, work_time) {
  try {
    const endTime = work_time.split("-")[1]; // "22:00"
    const [hours, minutes] = endTime.split(":").map(Number);
    const expire = new Date(work_date);
    expire.setHours(hours, minutes, 0, 0);
    return expire.toISOString();
  } catch {
    return new Date(Date.now() + 86400 * 1000).toISOString();
  }
}

async function extractWorkDateTime(rawMessage) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const completion = await client.chat.completions.create({
      model: "qwen/qwen3-32b",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
            You are an AI that extracts work date and timing from a WhatsApp job post.
            Today is ${today}. Tomorrow is ${tomorrow}.
            Rules:
            - Return ONLY valid JSON, no markdown, no explanation
            - work_date must be YYYY-MM-DD
            - work_time must be HH:MM-HH:MM in 24 hour format
            - If date says "today" or "TODAY" use ${today}
            - If date says "tomorrow" or "TOMORROW" use ${tomorrow}
            - If date is DD/MM/YYYY convert to YYYY-MM-DD
            - If time is "10-7" treat as 10:00-19:00
            - If time is "10AM TO 5.30 PM" treat as 10:00-17:30
            - If no date mentioned assume ${today}
            - If no time mentioned set work_time to null
            Examples:
            Input: "10-7(10slots)"
            Output: { "work_date": "${today}", "work_time": "10:00-19:00" }
            Input: "DATE: 15/06/2026, TIME: 10AM TO 5.30 PM"
            Output: { "work_date": "2026-06-15", "work_time": "10:00-17:30" }
            Input: "TOMORROW, 8AM-5PM"
            Output: { "work_date": "${tomorrow}", "work_time": "08:00-17:00" }
            Input: "urgent need workers"
            Output: { "work_date": "${today}", "work_time": null }
            `,
        },
        {
          role: "user",
          content: rawMessage,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);

    const work_date = parsed.work_date || today;
    const work_time = parsed.work_time || null;
    const job_expire_time = calculateExpireTime(work_date, work_time);

    return {
      work_date,
      work_time,
      job_expire_time,
    };
  } catch (err) {
    console.error("[WORK DATETIME LLM ERROR]", err.response?.data || err.message);
    const today = new Date().toISOString().split("T")[0];
    return {
      work_date: today,
      work_time: null,
      job_expire_time: new Date(Date.now() + 86400 * 1000).toISOString(),
    };
  }
}

module.exports = extractWorkDateTime;