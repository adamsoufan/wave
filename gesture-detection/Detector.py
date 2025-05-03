# detector.py  –– minimal runtime version (only emits real gestures)

import cv2
import mediapipe as mp
import numpy as np
import pickle
import time
import json
# import socket  # ←‑ uncomment if you want TCP streaming

# ─────────────── configuration ────────────────
MODEL_PATH   = 'hand_gesture_knn_model.pkl'
THRESHOLD    = 0.5          # > THRESHOLD  ⇒ "unknown"
COOLDOWN_SEC = 0.75         # debounce period
PORT         = 5050         # TCP port (if socket used)
HEADLESS     = True         # False shows a debug window
# ───────────────────────────────────────────────

# Optional socket setup
# sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# sock.connect(("127.0.0.1", PORT))

# Load trained KNN model
with open(MODEL_PATH, 'rb') as f:
    knn = pickle.load(f)

# MediaPipe Hands
mp_hands = mp.solutions.hands
hands    = mp_hands.Hands(max_num_hands=2,
                          min_detection_confidence=0.7,
                          min_tracking_confidence=0.5)

GESTURE_LABELS = {0: "open_hand", 1: "fist", 2: "thumbs_up"}

# Webcam
cap = cv2.VideoCapture(0)
last_sent, last_time = None, 0.0

while cap.isOpened():
    ok, frame = cap.read()
    if not ok:
        break

    frame = cv2.flip(frame, 1)
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res   = hands.process(rgb)

    if res.multi_hand_landmarks and res.multi_hand_world_landmarks:
        for lm_img, lm_world in zip(res.multi_hand_landmarks,
                                    res.multi_hand_world_landmarks):

            # Extract & normalize 21×(x,y,z) landmarks
            landmarks = np.array([[p.x, p.y, p.z] for p in lm_world.landmark])
            center    = landmarks.mean(axis=0)
            landmarks -= center
            max_dist  = np.linalg.norm(landmarks, axis=1).max()
            if max_dist > 0:
                landmarks /= max_dist
            vec = landmarks.flatten()

            # Predict
            pred        = knn.predict([vec])
            dist, _     = knn.kneighbors([vec])
            nearest_dist = dist[0][0]

            gesture = "unknown"
            if nearest_dist <= THRESHOLD:
                gesture_id = int(pred[0])
                gesture    = GESTURE_LABELS.get(gesture_id, "unknown")

            # Emit only non‑unknown gestures, debounced
            now = time.time()
            if gesture != "unknown" and gesture != last_sent and (now - last_time) > COOLDOWN_SEC:
                last_sent, last_time = gesture, now
                print(f"[GESTURE] {gesture}")  # stdout route
                # sock.sendall((json.dumps({"gesture": gesture}) + "\n").encode())

            # Optional debug window
            if not HEADLESS:
                mp.solutions.drawing_utils.draw_landmarks(
                    frame, lm_img, mp_hands.HAND_CONNECTIONS)
                cv2.putText(frame, gesture, (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    if not HEADLESS:
        cv2.imshow("Gesture Detector", frame)
        if cv2.waitKey(1) & 0xFF == 27:   # ESC
            break

cap.release()
if not HEADLESS:
    cv2.destroyAllWindows()
# sock.close()   # if socket streaming is enabled

