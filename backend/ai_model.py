import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam


# ============================
# 1. DATASET PATH (EDIT HERE)
# ============================
train_dir = r"E:/PROJECT/ai-her/backend/dataset/train"
test_dir  = r"E:/PROJECT/ai-her/backend/dataset/test"
val_dir   = r"E:/PROJECT/ai-her/backend/dataset/val"


# ============================
# 2. IMAGE LOADING PIPELINE
# ============================
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=15,
    zoom_range=0.2,
    horizontal_flip=True
)

test_datagen = ImageDataGenerator(rescale=1./255)

train_data = train_datagen.flow_from_directory(
    train_dir,
    target_size=(224,224),
    batch_size=16,
    class_mode='binary'
)

val_data = test_datagen.flow_from_directory(
    val_dir,
    target_size=(224,224),
    batch_size=16,
    class_mode='binary'
)

test_data = test_datagen.flow_from_directory(
    test_dir,
    target_size=(224,224),
    batch_size=16,
    class_mode='binary'
)


# ============================
# 3. LOAD PRETRAINED MODEL
# ============================
base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(224,224,3)
)
base_model.trainable = False  # Freeze layers for fast training


model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(1, activation='sigmoid')   # Binary output
])


model.compile(
    optimizer=Adam(0.0001),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)


# ============================
# 4. TRAIN (Fast: 3-5 epochs)
# ============================
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=4
)


# ============================
# 5. SAVE MODEL
# ============================
model.save("pneumonia_model.h5")

print("🎉 Model training complete & saved as pneumonia_model.h5")
