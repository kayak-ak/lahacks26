import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils

pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

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


def is_curled_up(landmarks):
    points = [(landmarks[lm.value].x, landmarks[lm.value].y) for lm in KEY_LANDMARKS]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    bbox_area = (max(xs) - min(xs)) * (max(ys) - min(ys))

    ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    shoulder_width = ((ls.x - rs.x) ** 2 + (ls.y - rs.y) ** 2) ** 0.5

    if shoulder_width < 1e-6:
        return False

    normalized_spread = bbox_area / (shoulder_width**2)
    return normalized_spread < CURL_THRESHOLD


cap = cv2.VideoCapture(1)

while cap.isOpened():
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    pose_results = pose.process(img_rgb)

    if pose_results.pose_landmarks:
        mp_draw.draw_landmarks(
            img,
            pose_results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
        )

        if is_curled_up(pose_results.pose_landmarks.landmark):
            label = "ALERT"
            color = (0, 0, 255)
        else:
            label = "NORMAL"
            color = (0, 255, 0)

        cv2.putText(img, label, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
    else:
        label = "VACANT"
        color = (128, 128, 128)
        cv2.putText(img, label, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)

    cv2.imshow("Pose Detection - Alert", img)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
