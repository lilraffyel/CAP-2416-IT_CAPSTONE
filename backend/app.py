import os
from flask import Flask, request, jsonify,
from flask_session import Session
from flask_cors import CORS
from auth_routes import auth_bp
from student_routes import student_bp 
from teacher_routes import teacher_routes
from user_routes import user_routes
from admin_routes import admin_routes


# Import the prerequisite blueprint
from prerequisite.prerequisite_api import prereq_bp

app = Flask(__name__)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-super-secret-key-for-dev')

# Session Cookie Configs
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'

Session(app)

app.secret_key = 'your-secret-key'
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": [FRONTEND_URL]}}) 


# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(student_bp, url_prefix='/api/students')
app.register_blueprint(teacher_routes, url_prefix='/api/teacher')
app.register_blueprint(user_routes, url_prefix='/api/users')
app.register_blueprint(prereq_bp, url_prefix='/api')  # Register the prerequisite blueprint
app.register_blueprint(admin_routes, url_prefix='/api/admin')



#Run the Flask App
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(app.url_map)
    app.run(host="0.0.0.0", port=port, debug=False)