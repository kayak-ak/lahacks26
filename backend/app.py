from flask import Flask
from flask_cors import CORS
from routes.sms_routes import sms_bp
from routes.agent_routes import agent_bp
from routes.rooms import rooms_bp
from routes.shifts import shifts_bp


def create_app():
    app = Flask(__name__)
    CORS(
        app,
        resources={
            r"/*": { 
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    app.register_blueprint(sms_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(shifts_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
