const client =
  require("./client");

async function extractJob(
  payload
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
                You are an AI system that extracts
                structured job information from
                WhatsApp job posts.

                Rules:
                - Return ONLY valid JSON
                - Never explain anything
                - Never use markdown
                - Normalize messy text
                - If not a job:
                {
                  "is_job": false
                }

                Important Rules:
                - If contact number exists in message, use it
                - Otherwise use sender_phone
                - Use locationData.location_text if available
                - Use locationData.coordinates if available
                - salary should be NUMBER ONLY
                - confidence should be between 0 and 1
                - Most daily jobs expire within 24 hours
                - If work date exists, use intelligent expiry
                - always use null if something is not in the message

                salary_type values:
                - daily
                - hourly
                - monthly
                - weekly
                - fixed

                status values:
                - active
                - expired
                - hidden

                Required JSON fields:
                - is_job
                - title
                - salary
                - salary_type
                - workers_needed
                - gender_requirement
                - age_requirement
                - contact
                - description
                - confidence

                Do NOT generate these fields:
                - source
                - source_group
                - raw_message
                - message_id
                - created_at
                - status
                -location_source
                `,
            },

            {
              role: "user",

              content:
                JSON.stringify(
                  payload,
                  null,
                  2
                ),
            },
          ],
        }
      );

    const content =
      completion.choices[0]
        .message.content;

    const parsed =
      JSON.parse(content);

    const finalJob = {
      ...parsed,

      source:
        "whatsapp_group",

      source_group:
        payload.group_name,

      raw_message:
        payload.raw_message,

      message_id:
        payload.message_id,

      created_at:
        payload.timestamp,

      location_text: payload.locationData.location_text,

      location_source: payload.locationData.location_source,

      coordinates: payload.locationData.coordinates,

      sender_phone: payload.sender_phone,

      work_time: payload.work_time,

      work_date: payload.work_date,

      job_expire_time: payload.job_expire_time,

      status:
        "active",
    };

    return finalJob;
  } catch (err) {
    console.error(
      "[LLM ERROR]",
      err.response?.data ||
        err.message
    );

    return null;
  }
}

module.exports =
  extractJob;
