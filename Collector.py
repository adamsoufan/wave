import cv2
import mediapipe as mp
import pickle
import os
import time
import numpy as np

# Initialize MediaPipe //////////////////////////////////////////
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1, 
    model_complexity=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
mp_draw = mp.solutions.drawing_utils

# gesture labels /////////////////////////////////////////////////
gesture_labels = {
    0: 'open_hand',
    1: 'pinched_fingers',
    2: 'ok',
    3: 'peace',
    4: 'point_up',
    5: 'point_down',
    6: 'thumbs_up',
    7: 'thumbs_down'

}

# Setup ///////////////////////////////////////////////////////////////////////////

# Data storage
all_landmarks = []
all_labels = []
current_label = 0
sample_counter = {label: 0 for label in gesture_labels.values()}

# Webcam
cap = cv2.VideoCapture(0)

print("[INFO] Press 'n' to switch gesture label, 's' to save, 'ESC' to exit.")

# collector loop ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

while cap.isOpened():
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    if results.multi_hand_landmarks and results.multi_hand_world_landmarks:
        for hand_landmarks, world_landmarks in zip(results.multi_hand_landmarks, results.multi_hand_world_landmarks):


            # Extract world landmark coordinates
            landmark_array = np.array([[lm.x, lm.y, lm.z] for lm in world_landmarks.landmark])

            # Normalize: center at mean and scale to max distance from center
            center = np.mean(landmark_array, axis=0)
            landmark_array -= center
            max_dist = np.max(np.linalg.norm(landmark_array, axis=1))
            if max_dist > 0:
                landmark_array /= max_dist

            # flatten and store
            all_landmarks.append(landmark_array.flatten().tolist())
            all_labels.append(current_label)
            sample_counter[gesture_labels[current_label]] += 1

            # display on screen
            mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)


    # UI  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    current_text = f"Collecting: {gesture_labels[current_label]} | Samples: {sample_counter[gesture_labels[current_label]]}"
    cv2.putText(img, current_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.imshow("Hand Gesture Collector", img)

    # key binding /////////////////////////////////////////////////////
    key = cv2.waitKey(1)

    if key == 27: 
        break
    elif key == ord('n'): #next gesture

        current_label = (current_label + 1) % len(gesture_labels)
        print(f"[INFO] Now collecting for: {gesture_labels[current_label]}")

    elif key == ord('s'): # save data collected for current gesture

        timestamp = int(time.time())
        filename = f"hand_gesture_data_{timestamp}.pkl"
        with open(filename, 'wb') as f:
            pickle.dump({'landmarks': all_landmarks, 'labels': all_labels}, f)
        print(f"[SAVED] Data saved to {filename}")
        all_landmarks = []
        all_labels = []
        sample_counter = {label: 0 for label in gesture_labels.values()}

cap.release()
cv2.destroyAllWindows()
