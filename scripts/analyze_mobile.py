from PIL import Image
import glob
import numpy as np

files = sorted(glob.glob('scripts/mobile_*.png'))
for f in files:
    im = Image.open(f).convert('RGB')
    arr = np.array(im)
    mean_val = float(np.mean(arr))
    min_val = int(np.min(arr))
    h, w, _ = arr.shape
    center = arr[h//2, w//2].tolist()
    dark_pct = float((np.mean(arr, axis=2) < 20).sum() / (h * w) * 100)
    print(f'{f:22s}: shape={w}x{h}, mean={mean_val:.1f}, min={min_val}, center={center}, dark_pct={dark_pct:.1f}%')
