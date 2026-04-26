import asyncio
import time

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


def _generate_placeholder_frame(text: str) -> bytes:
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(img, text, (80, 250), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (200, 200, 200), 2)
    _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return buffer.tobytes()


async def capture_loop():
    global latest_frame_bytes, latest_status, cap

    while True:
        for idx in (1, 0):
            cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                break
            cap.release()
        if cap.isOpened():
            break
        print(
            "Waiting for camera permission... (grant access in System Settings > Privacy & Security > Camera)"
        )
        latest_frame_bytes = _generate_placeholder_frame(
            "Waiting for camera permission..."
        )
        await asyncio.sleep(2)

    print("Camera opened successfully. Streaming frames...")

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        while cap.isOpened():
            success, img = cap.read()
            if not success:
                await asyncio.sleep(0.1)
                continue

            img = cv2.flip(img, 1)
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
                    color = (0, 0, 255)
                else:
                    label = "NORMAL"
                    color = (0, 255, 0)

                cv2.putText(
                    img, label, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3
                )
            else:
                label = "VACANT"
                color = (128, 128, 128)
                cv2.putText(
                    img, label, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3
                )

            _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
            latest_frame_bytes = buffer.tobytes()
            latest_status = label

            await asyncio.sleep(0.01)

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
