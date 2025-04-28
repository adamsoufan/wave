import cv2
import mediapipe as mp

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,         # Only detect one hand (you can set more)
    min_detection_confidence=0.9,
    min_tracking_confidence=0.5
)

# Drawing utility
mp_drawing = mp.solutions.drawing_utils

# Start webcam
cap = cv2.VideoCapture(0)

def is_thumbs_up(landmarks):
    """Basic thumbs-up detection based on landmark positions."""
    thumb_tip = landmarks[4]    # Tip of the thumb
    thumb_ip = landmarks[3]     # Near tip of thumb
    thumb_p = landmarks[2]      # Base of thumb 

    index_tip = landmarks[8]    # Tip of index finger
    middle_tip = landmarks[12]  # Tip of middle finger
    ring_tip = landmarks[16]    # Tip of ring finger
    pinky_tip = landmarks[20]   # Tip of pinky finger

    # Thumb tip must be higher (lower y in image coordinates) than other fingers
    if (thumb_tip.y < index_tip.y and
        thumb_tip.y < middle_tip.y and
        thumb_tip.y < ring_tip.y and
        thumb_tip.y < pinky_tip.y and
        
        thumb_ip.y < index_tip.y and
        thumb_ip.y < middle_tip.y and
        thumb_ip.y < ring_tip.y and
        thumb_ip.y < pinky_tip.y and

        thumb_p.y < index_tip.y and
        thumb_p.y < middle_tip.y and
        thumb_p.y < ring_tip.y and
        thumb_p.y < pinky_tip.y
        ):
        return True
    return False

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("Ignoring empty camera frame.")
        continue

    # Flip and convert image for MediaPipe
    image = cv2.flip(image, 1)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Process the frame
    results = hands.process(rgb_image)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Draw hand landmarks
            mp_drawing.draw_landmarks(
                image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Get landmark coordinates
            landmarks = hand_landmarks.landmark

            # Detect simple thumbs-up gesture
            if is_thumbs_up(landmarks):
                cv2.putText(image, "Thumbs Up!", (50, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Show the output
    cv2.imshow('Hand Gesture Detection', image)

    if cv2.waitKey(5) & 0xFF == 27:  # Press ESC to quit
        break

cap.release()
cv2.destroyAllWindows()
