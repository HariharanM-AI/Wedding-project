import cv2
from PIL import Image
import numpy as np

def inspect_video(path, ref_img_path, out_prefix):
    cap = cv2.VideoCapture(path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"\nVideo: {path}")
    print(f"Dimensions: {w}x{h}, FPS: {fps}, Total frames: {total_frames}")

    frames = []
    for i in range(10):
        ret, frame = cap.read()
        if not ret:
            print(f"Failed to read frame {i}")
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mean_rgb = np.mean(frame_rgb, axis=(0, 1))
        min_val = np.min(frame_rgb)
        print(f"Frame {i}: mean RGB={mean_rgb.round(1).tolist()}, min={min_val}")
        frames.append(frame_rgb)

    cap.release()

    # Save frame 0
    if frames:
        Image.fromarray(frames[0]).save(f"scripts/{out_prefix}_frame_0.png")
        # Compare with reference image
        ref = Image.open(ref_img_path).convert("RGB")
        if ref.size != (w, h):
            ref = ref.resize((w, h))
        ref_arr = np.array(ref)
        diff = np.abs(frames[0].astype(np.int32) - ref_arr.astype(np.int32))
        print(f"Difference with {ref_img_path}: mean diff = {diff.mean():.2f}, max diff = {diff.max()}")

inspect_video("public/Intro/Final_intro_mobile.mp4", "public/Intro/intro_image_mobile.png", "mob")
inspect_video("public/Intro/Final_intro_window.mp4", "public/Intro/intro_image_laptop.png", "win")
