from flask import Flask
from flask_cors import CORS
from routes.sms_routes import sms_bp
from routes.agent_routes import agent_bp
from routes.rooms import rooms_bp
from routes.shifts import shifts_bp
from routes.video_routes import video_bp, start_stream_thread


def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

    # app.register_blueprint(sms_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(shifts_bp)
    app.register_blueprint(video_bp)

    start_stream_thread()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, threaded=True, use_reloader=False)
