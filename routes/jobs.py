from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import jobs_collection
from datetime import datetime
import uuid

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/", methods=["GET"])
def get_active_jobs():
    try:
        jobs = list(jobs_collection.find(
            {"status": "active"},
            {"_id": 0}
        ))
        return jsonify({"success": True, "count": len(jobs), "jobs": jobs})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@jobs_bp.route("/post", methods=["POST"])
@jwt_required()
def post_job():
    try:
        poster_email = get_jwt_identity()
        data = request.get_json()

        # Basic validation
        if not data.get("title"):
            return jsonify({"success": False, "error": "Title is required"}), 400
        if not data.get("location_text"):
            return jsonify({"success": False, "error": "Location is required"}), 400

        job = {
            "message_id": uuid.uuid4().hex.upper(),
            "title": data.get("title"),
            "salary": data.get("salary"),
            "salary_type": data.get("salary_type", "daily"),
            "workers_needed": data.get("workers_needed"),
            "gender_requirement": data.get("gender_requirement", ""),
            "age_requirement": data.get("age_requirement", ""),
            "work_date": data.get("work_date"),
            "work_time": data.get("work_time"),
            "location_text": data.get("location_text"),
            "coordinates": data.get("coordinates"),
            "contact": data.get("contact"),
            "description": data.get("description", ""),
            "source": "manual",
            "poster_email": poster_email,
            "created_at": datetime.utcnow(),
            "job_expire_time": datetime.fromisoformat(data.get("job_expire_time")) if data.get("job_expire_time") else None,
            "status": "active",
            "is_job": True,
            "confidence": 1.0,
        }

        jobs_collection.insert_one(job)

        return jsonify({"success": True, "message": "Job posted"}), 201

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500