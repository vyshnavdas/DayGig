from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
from db import db

auth_bp = Blueprint("auth", __name__)
users_collection = db["users"]

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password required"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"success": False, "error": "Email already exists"}), 409

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users_collection.insert_one({
        "email": email,
        "password": hashed,
        "role": "poster",
    })

    return jsonify({"success": True, "message": "Account created"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    user = users_collection.find_one({"email": email})

    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    token = create_access_token(identity=email)

    return jsonify({"success": True, "token": token}), 200