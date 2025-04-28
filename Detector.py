import cv2
import mediapipe as mp
import numpy as np
import pickle

# Load model
with open('hand_gesture_knn_model.pkl', 'rb') as f:
    knn = pickle.load(f)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.95,
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
threshold = 0.3

# Webcam
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            landmark_list = []
            for lm in hand_landmarks.landmark:
                landmark_list.append(lm.x)
                landmark_list.append(lm.y)

            # Predict Gesture
            prediction = knn.predict([landmark_list])
            distances, indices = knn.kneighbors([landmark_list])

            # Get the nearest distance (the first value in the distances array)
            nearest_distance = distances[0][0]

            # Check if the nearest distance is above the threshold
            if nearest_distance > threshold:
                predicted_label = -1  # Classify as "unknown"
                gesture_name = "unknown"
            else:
                predicted_label = int(prediction[0])
                gesture_name = gesture_labels[predicted_label]

            cv2.putText(frame, f'{gesture_name}', (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    cv2.imshow('Hand Gesture Recognition', frame)

    if cv2.waitKey(10) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
