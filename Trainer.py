import numpy as np
from sklearn.neighbors import KNeighborsClassifier
import pickle

# Load the data
with open('merged_hand_gesture_data.pkl', 'rb') as f:
    data_dict = pickle.load(f)

data = data_dict['landmarks']
labels = data_dict['labels']

# Reshape the data to be 2D (samples, features)
# Each sample is a flattened array of 63 values (21 landmarks, each with x, y)
data = [np.array(landmark).flatten() for landmark in data]

# Check the shape
print(f"Data shape: {np.shape(data)}")  # Should be (n_samples, n_features)

# Create and train KNN
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(data, labels)

# Save the model
with open('hand_gesture_knn_model.pkl', 'wb') as f:
    pickle.dump(knn, f)

print("KNN model trained and saved!")
