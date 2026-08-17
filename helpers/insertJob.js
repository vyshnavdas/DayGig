const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  is_job: Boolean,
  title: String,
  salary: Number,
  salary_type: String,
  workers_needed: Number,
  gender_requirement: String,
  age_requirement: String,
  contact: String,
  description: String,
  confidence: Number,
  source: String,
  source_group: String,
  raw_message: String,
  message_id: { type: String, unique: true },
  created_at: Date,
  location_text: String,
  location_source: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  sender_phone: String,
  work_time: String,
  work_date: String,
  job_expire_time: { type: Date, index: true },
  status: String,
});

// TTL index — MongoDB auto-deletes document when job_expire_time is reached
jobSchema.index({ job_expire_time: 1 }, { expireAfterSeconds: 0 });

const Job = mongoose.model("Job", jobSchema);

async function insertJob(jobData) {
  try {
    const job = new Job({
      ...jobData,
      created_at: new Date(jobData.created_at),
      job_expire_time: new Date(jobData.job_expire_time),
    });
    await job.save();
    console.log("[✓] Job inserted:", jobData.title);
  } catch (err) {
    if (err.code === 11000) {
      console.log("[!] Duplicate message — skipped");
    } else {
      console.error("[✗] Insert error:", err.message);
    }
  }
}

module.exports = { Job, insertJob };