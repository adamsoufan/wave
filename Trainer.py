import numpy as np
from sklearn.neighbors import KNeighborsClassifier
import pickle

from sklearn.model_selection import train_test_split, cross_val_score, KFold

from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns



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


# load the merged datasets for each hand, post dataset merging using Merger.py
with open('merged_hand_gesture_data.pkl', 'rb') as f:
    data_dict = pickle.load(f)

data = data_dict['landmarks']  
labels = data_dict['labels']

# ensure each data point is a NumPy array
data = np.array([np.array(landmark) for landmark in data])
labels = np.array(labels)


# Check shape
print(f"Data shape: {np.shape(data)}")  


# create KNN model
knn = KNeighborsClassifier(n_neighbors=5, weights='distance')

#perform K-fold cross validation, each fold as a subset of the datase ////////////////////////////////////////////////
kf = KFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(knn, data, labels, cv=kf)

print(f"\nCross-Validation Accuracy Scores: {scores}") # all folds and theirs respective scores
print(f"Mean Accuracy: {np.mean(scores):.4f}") #mean score of all the folds
print(f"Standard Deviation: {np.std(scores):.4f}") #std



# confusion matrix ////////////////////////////////////////////////////////////////////////

#splits dataset into train and test
X_train, X_test, y_train, y_test = train_test_split(
    data, labels, 
    test_size=0.2, #percentage of the dataset used for testing
    stratify=labels, # sets class proprotions on both train and test
    random_state=42 # makes the split predictable
    )
#train and does test predictions
knn.fit(X_train, y_train)
y_pred = knn.predict(X_test)

# do confusion matrix
conf_matrix = confusion_matrix(y_test, y_pred)

#display CM
plt.figure(figsize=(8, 6))
sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues', 
            xticklabels=[gesture_labels[i] for i in np.unique(labels)], 
            yticklabels=[gesture_labels[i] for i in np.unique(labels)])

plt.xlabel("Predicted Label")
plt.ylabel("True Label")
plt.title("Confusion Matrix")
plt.show()





#fit model into all the data
knn.fit(data, labels)

# Save trained model
with open('hand_gesture_knn_model.pkl', 'wb') as f:
    pickle.dump(knn, f)

print(" KNN model trained and saved!")
