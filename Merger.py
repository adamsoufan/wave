import os
import pickle

# Directory 
pkl_dir = '.'  

# List all .pkl files in the directory
pkl_files = [f for f in os.listdir(pkl_dir) if f.endswith('.pkl')]

all_landmarks = []
all_labels = []

# Iterate through each .pkl file and merge
for file in pkl_files:
    file_path = os.path.join(pkl_dir, file)

    with open(file_path, 'rb') as f:
        data = pickle.load(f)
        
        # If the data is a dictionary
        if isinstance(data, dict):
            all_landmarks.extend(data['landmarks']) # adds landmarks
            all_labels.extend(data['labels']) # Adds labels

        # If the data is a tuple
        elif isinstance(data, tuple) and len(data) == 2:
            all_landmarks.extend(data[0]) # add landmarks
            all_labels.extend(data[1]) # add labels

        else:
            print(f"[WARNING] Unexpected data format in {file}. Skipping.")

# save the merged data into a new .pkl file
merged_filename = 'merged_hand_gesture_data.pkl'
with open(merged_filename, 'wb') as f:
    pickle.dump({'landmarks': all_landmarks, 'labels': all_labels}, f)


print(f"[INFO] Merged data saved to {merged_filename}")
