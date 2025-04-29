import cv2
import mediapipe as mp
import numpy as np
import pickle
import os
import time

# Load model
with open('hand_gesture_knn_model.pkl', 'rb') as f:
    knn = pickle.load(f)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

# Gesture Labels
gesture_labels = {
    0: 'open_hand',
    1: 'fist',
    2: 'thumbs_up'
}

#threshold for "unknown" gesture detection
threshold = 0.5

# Webcam
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if results.multi_hand_landmarks and results.multi_hand_world_landmarks:
        for hand_lm, world_lm in zip(results.multi_hand_landmarks, results.multi_hand_world_landmarks):
            mp_drawing.draw_landmarks(frame, hand_lm, mp_hands.HAND_CONNECTIONS)

            # Extract world landmarks (x, y, z)
            landmark_array = np.array([[lm.x, lm.y, lm.z] for lm in world_lm.landmark])

            # Normalize (center + scale)
            center = np.mean(landmark_array, axis=0)
            landmark_array -= center
            max_dist = np.max(np.linalg.norm(landmark_array, axis=1))
            if max_dist > 0:
                landmark_array /= max_dist

            # Flatten
            input_vector = landmark_array.flatten()

            # Predict
            prediction = knn.predict([input_vector])
            distances, _ = knn.kneighbors([input_vector])

            nearest_distance = distances[0][0]
            if nearest_distance > threshold:
                gesture_name = "unknown"
            else:
                gesture_id = int(prediction[0])
                gesture_name = gesture_labels.get(gesture_id, "unknown")

            # Display gesture
            cv2.putText(frame, gesture_name, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)


    cv2.imshow('Hand Gesture Recognition', frame)

    if cv2.waitKey(10) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
