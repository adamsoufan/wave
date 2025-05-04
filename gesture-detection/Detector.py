# detector.py  –– minimal runtime version (only emits real gestures)

import cv2
import mediapipe as mp
import numpy as np
import pickle
import time
import json
import socket  # Uncommented for TCP streaming
import os
import sys

# ─────────────── configuration ────────────────
MODEL_PATH   = os.path.join(os.path.dirname(__file__), 'hand_gesture_knn_model.pkl')
THRESHOLD    = 0.5          # > THRESHOLD  ⇒ "unknown"
COOLDOWN_SEC = 0.75         # debounce period
PORT         = 5050         # TCP port (if socket used)
HEADLESS     = True         # False shows a debug window
# ───────────────────────────────────────────────

try:
    # Socket setup
    print("Connecting to socket...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(("127.0.0.1", PORT))
    print("Socket connected successfully")

    # Load trained KNN model
    print(f"Loading model from {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        sys.exit(1)
        
    with open(MODEL_PATH, 'rb') as f:
        knn = pickle.load(f)
    print("Model loaded successfully")

    # MediaPipe Hands
    print("Initializing MediaPipe Hands...")
    mp_hands = mp.solutions.hands
    hands    = mp_hands.Hands(max_num_hands=2,
                            min_detection_confidence=0.7,
                            min_tracking_confidence=0.5)
    print("MediaPipe Hands initialized")

    GESTURE_LABELS = {0: "open_hand", 1: "fist", 2: "thumbs_up"}

    # Try different camera indices
    print("Opening webcam...")
    cap = None
    for i in range(4):  # Try indices 0-3
        print(f"Trying camera index {i}...")
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            print(f"Successfully opened camera at index {i}")
            break
        cap.release()

    if not cap or not cap.isOpened():
        print("Error: Could not open any camera")
        sys.exit(1)

    print("Webcam opened successfully")
    last_sent, last_time = None, 0.0

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            print("Error: Could not read frame from webcam")
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

                # Emit only non‑unknown gestures, debounced by cooldown timer
                now = time.time()
                if gesture != "unknown" and (now - last_time) > COOLDOWN_SEC:
                    last_sent, last_time = gesture, now
                    print(f"[GESTURE] {gesture}")  # stdout route
                    sock.sendall((json.dumps({"gesture": gesture}) + "\n").encode())

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

except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)
finally:
    if 'cap' in locals() and cap:
        cap.release()
    if not HEADLESS and 'cv2' in locals():
        cv2.destroyAllWindows()
    if 'sock' in locals():
        sock.close()   # if socket streaming is enabled

