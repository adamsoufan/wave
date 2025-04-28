import cv2
import mediapipe as mp
import pickle
import os
import time
import numpy as np

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

# Gesture labels
gesture_labels = {
    0: 'open_hand',
    1: 'fist',
    2: 'thumbs_up'
}

# Data collection
all_landmarks = []
all_labels = []
current_label = 0

# Sample counters
sample_counter = {label: 0 for label in gesture_labels.values()}

# Start capturing
cap = cv2.VideoCapture(0)

print("[INFO] Press 'n' to switch gesture label, 's' to save, 'ESC' to exit.")

while cap.isOpened():
    success, img = cap.read()
    if not success:
        break

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Collect landmarks
            landmark_list = []
            for lm in hand_landmarks.landmark:
                landmark_list.append(lm.x)
                landmark_list.append(lm.y)
            all_landmarks.append(landmark_list)
            all_labels.append(current_label)

            sample_counter[gesture_labels[current_label]] += 1

            # Draw landmarks
            mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    # Show label and sample count
    current_text = f"Collecting: {gesture_labels[current_label]} | Samples: {sample_counter[gesture_labels[current_label]]}"
    cv2.putText(img, current_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("Hand Gesture Collector", img)

    key = cv2.waitKey(1)
    if key == 27:  # ESC to exit
        break
    elif key == ord('n'):  # Next label
        current_label = (current_label + 1) % len(gesture_labels)
        print(f"[INFO] Now collecting for: {gesture_labels[current_label]}")
    elif key == ord('s'):  # Save collected data
        # Create filename based on timestamp
        timestamp = int(time.time())
        filename = f"hand_gesture_data_{timestamp}.pkl"
        with open(filename, 'wb') as f:
            pickle.dump({'landmarks': all_landmarks, 'labels': all_labels}, f)
        print(f"[SAVED] Data saved to {filename}")
        # Reset data for next session if needed
        all_landmarks = []
        all_labels = []
        sample_counter = {label: 0 for label in gesture_labels.values()}

cap.release()
cv2.destroyAllWindows()
