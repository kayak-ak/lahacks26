import threading

import cv2
import mediapipe as mp
from flask import Blueprint, Response, jsonify

video_bp = Blueprint("video", __name__, url_prefix="/api")

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils

CURL_THRESHOLD = 6.0

KEY_LANDMARKS = [
    mp_pose.PoseLandmark.NOSE,
    mp_pose.PoseLandmark.LEFT_SHOULDER,
    mp_pose.PoseLandmark.RIGHT_SHOULDER,
    mp_pose.PoseLandmark.LEFT_HIP,
    mp_pose.PoseLandmark.RIGHT_HIP,
    mp_pose.PoseLandmark.LEFT_KNEE,
    mp_pose.PoseLandmark.RIGHT_KNEE,
    mp_pose.PoseLandmark.LEFT_ANKLE,
    mp_pose.PoseLandmark.RIGHT_ANKLE,
]

outputFrame = None
lock = threading.Lock()
latest_detection = {"personDetected": False, "status": "NONE", "landmarks": []}
detection_lock = threading.Lock()
_stream_thread_started = False


def _get_detection(landmarks) -> dict:
    points = [(landmarks[lm.value].x, landmarks[lm.value].y) for lm in KEY_LANDMARKS]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    bbox_area = (max(xs) - min(xs)) * (max(ys) - min(ys))
    ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    shoulder_width = ((ls.x - rs.x) ** 2 + (ls.y - rs.y) ** 2) ** 0.5
    if shoulder_width > 1e-6 and (bbox_area / shoulder_width**2) < CURL_THRESHOLD:
        status = "ALERT"
    else:
        status = "NORMAL"
    return {
        "personDetected": True,
        "status": status,
        "landmarks": [
            {
                "x": round(lm.x, 4),
                "y": round(lm.y, 4),
                "z": round(lm.z, 4),
                "visibility": round(lm.visibility, 4),
            }
            for lm in KEY_LANDMARKS
        ],
    }


def _capture_loop():
    global outputFrame, _stream_thread_started

    cap = cv2.VideoCapture(0)
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    try:
        while True:
            success, img = cap.read()
            if not success:
                continue

            img = cv2.flip(img, 1)
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)

            if results.pose_landmarks:
                mp_draw.draw_landmarks(
                    img, results.pose_landmarks, mp_pose.POSE_CONNECTIONS
                )
                detection = _get_detection(results.pose_landmarks.landmark)
            else:
                detection = {"personDetected": False, "status": "NONE", "landmarks": []}

            with detection_lock:
                latest_detection.update(detection)

            with lock:
                outputFrame = img.copy()
    finally:
        _stream_thread_started = False
        cap.release()
        pose.close()


def generate():
    global outputFrame, lock
    while True:
        with lock:
            if outputFrame is None:
                continue
            (flag, encodedImage) = cv2.imencode(".jpg", outputFrame)
            if not flag:
                continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + bytearray(encodedImage) + b"\r\n"
        )


@video_bp.route("/video_feed")
def video_feed():
    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


@video_bp.route("/detection_status")
def detection_status():
    with detection_lock:
        return jsonify(latest_detection)


def start_stream_thread():
    global _stream_thread_started
    if not _stream_thread_started:
        _stream_thread_started = True
        t = threading.Thread(target=_capture_loop)
        t.daemon = True
        t.start()
