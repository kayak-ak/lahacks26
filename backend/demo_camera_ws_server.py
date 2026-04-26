import asyncio
import os

import cv2
import mediapipe as mp
import numpy as np
import websockets

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils

CURL_THRESHOLD = 6.0

KEY_LANDMARK_INDICES = [
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


def is_curled_up(landmarks_list):
    points = [
        (landmarks_list[lm.value].x, landmarks_list[lm.value].y)
        for lm in KEY_LANDMARK_INDICES
    ]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    bbox_area = (max(xs) - min(xs)) * (max(ys) - min(ys))

    ls = landmarks_list[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    rs = landmarks_list[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    shoulder_width = ((ls.x - rs.x) ** 2 + (ls.y - rs.y) ** 2) ** 0.5

    if shoulder_width < 1e-6:
        return False

    normalized_spread = bbox_area / (shoulder_width**2)
    return normalized_spread < CURL_THRESHOLD


latest_frame_bytes: bytes | None = None
latest_status: str = "VACANT"
cap: cv2.VideoCapture | None = None

DEMO_VIDEO_PATH = os.environ.get(
    "DEMO_VIDEO_PATH", "demo_videos/patient_demo.mp4"
)


def _generate_placeholder_frame(text: str) -> bytes:
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(img, text, (80, 250), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (200, 200, 200), 2)
    _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return buffer.tobytes()


async def capture_loop():
    global latest_frame_bytes, latest_status, cap

    cap = cv2.VideoCapture(DEMO_VIDEO_PATH)
    if not cap.isOpened():
        print(f"ERROR: Could not open demo video at '{DEMO_VIDEO_PATH}'")
        latest_frame_bytes = _generate_placeholder_frame(
            f"Video not found: {DEMO_VIDEO_PATH}"
        )
        return

    print(f"Demo video opened: {DEMO_VIDEO_PATH}. Streaming frames...")

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        while True:
            success, img = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                await asyncio.sleep(0.1)
                continue

            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)

            if results.pose_landmarks:
                mp_draw.draw_landmarks(
                    img_rgb,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                )
                img = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

                if is_curled_up(results.pose_landmarks.landmark):
                    label = "ALERT"
                else:
                    label = "NORMAL"
            else:
                label = "VACANT"

            _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
            latest_frame_bytes = buffer.tobytes()
            latest_status = label

            await asyncio.sleep(0.033)

    cap.release()


async def stream_handler(websocket):
    print(f"Client connected: {websocket.remote_address}")
    try:
        while True:
            if latest_frame_bytes is not None:
                try:
                    await websocket.send('{"status":"' + latest_status + '"}')
                    await websocket.send(latest_frame_bytes)
                except websockets.exceptions.ConnectionClosed:
                    break
            await asyncio.sleep(0.033)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        print(f"Client disconnected: {websocket.remote_address}")


async def main():
    capture_task = asyncio.create_task(capture_loop())

    async with websockets.serve(stream_handler, "0.0.0.0", 8765):
        print("WebSocket server running on ws://0.0.0.0:8765")
        await asyncio.Future()

    capture_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
