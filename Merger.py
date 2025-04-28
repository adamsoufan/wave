import os
import pickle

# Directory where your .pkl files are stored
pkl_dir = '.'  # <-- Change this to the folder where your pkl files are saved

# List all .pkl files in the directory
pkl_files = [f for f in os.listdir(pkl_dir) if f.endswith('.pkl')]

# Prepare lists to store all landmarks and labels
all_landmarks = []
all_labels = []

# Iterate through each .pkl file and merge
for file in pkl_files:
    file_path = os.path.join(pkl_dir, file)
    with open(file_path, 'rb') as f:
        data = pickle.load(f)
        
        # If the data is a dictionary
        if isinstance(data, dict):
            all_landmarks.extend(data['landmarks'])  # Append the landmarks
            all_labels.extend(data['labels'])        # Append the labels
        # If the data is a tuple, assume it is in (landmarks, labels) format
        elif isinstance(data, tuple) and len(data) == 2:
            all_landmarks.extend(data[0])  # Append the landmarks
            all_labels.extend(data[1])     # Append the labels
        else:
            print(f"[WARNING] Unexpected data format in {file}. Skipping.")

# Save the merged data into a new .pkl file
merged_filename = 'merged_hand_gesture_data.pkl'
with open(merged_filename, 'wb') as f:
    pickle.dump({'landmarks': all_landmarks, 'labels': all_labels}, f)

print(f"[INFO] Merged data saved to {merged_filename}")
