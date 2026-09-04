from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.jobs import jobs_bp
from routes.auth import auth_bp
import os
from dotenv import load_dotenv
from datetime import timedelta


load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

JWTManager(app)

app.register_blueprint(jobs_bp, url_prefix="/api/jobs")
app.register_blueprint(auth_bp, url_prefix="/api/auth")

if __name__ == "__main__":
    app.run(debug=True, port=5000)