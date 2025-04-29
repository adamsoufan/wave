import numpy as np
from sklearn.neighbors import KNeighborsClassifier
import pickle

# Load the data
with open('merged_hand_gesture_data.pkl', 'rb') as f:
    data_dict = pickle.load(f)

data = data_dict['landmarks']  # Already flattened 3D vectors
labels = data_dict['labels']

# ensure each data point is a NumPy array
data = [np.array(landmark) for landmark in data]

# Check shape
print(f"Data shape: {np.shape(data)}")  

# Train KNN
knn = KNeighborsClassifier(n_neighbors=5, weights='distance')
knn.fit(data, labels)

# Save trained model
with open('hand_gesture_knn_model.pkl', 'wb') as f:
    pickle.dump(knn, f)

print(" KNN model trained and saved!")
