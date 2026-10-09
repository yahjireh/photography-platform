import os
from PIL import Image, ImageOps

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_IMAGE = r'C:/Users/Kay/.gemini/antigravity-ide/brain/153996e3-fb0f-41b2-b1b3-6424ec758017/.user_uploaded/media_1791558492226.jpg'

print(f"Loading source image: {SRC_IMAGE}")
src = Image.open(SRC_IMAGE).convert('RGB')
w, h = src.size

# Find bounds of logo (excluding the grey frame at bottom y > 780 and borders)
min_x, max_x = w, 0
min_y, max_y = h, 0

for y in range(50, h - 50):
    for x in range(50, w - 50):
        r, g, b = src.getpixel((x, y))
        # deviation from white
        if r < 240 or g < 240 or b < 240:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Detected logo bounds: x=({min_x}, {max_x}), y=({min_y}, {max_y})")

# Add 12px padding around bounds
pad = 12
crop_x1 = max(0, min_x - pad)
crop_y1 = max(0, min_y - pad)
crop_x2 = min(w, max_x + pad)
crop_y2 = min(h, max_y + pad)

cropped_rgb = src.crop((crop_x1, crop_y1, crop_x2, crop_y2))
cw, ch = cropped_rgb.size
print(f"Cropped size: {cw}x{ch}")

# Generate transparent RGBA logo
transparent_logo = Image.new('RGBA', (cw, ch), (255, 255, 255, 0))
transparent_logo_white_text = Image.new('RGBA', (cw, ch), (255, 255, 255, 0))

for y in range(ch):
    for x in range(cw):
        r, g, b = cropped_rgb.getpixel((x, y))
        diff = max(255 - r, 255 - g, 255 - b)
        if diff <= 4:
            continue
        alpha = min(255, int((diff / 255.0) ** 0.85 * 255))
        if alpha > 0:
            a_f = alpha / 255.0
            fg_r = min(255, max(0, int((r - 255 * (1 - a_f)) / a_f)))
            fg_g = min(255, max(0, int((g - 255 * (1 - a_f)) / a_f)))
            fg_b = min(255, max(0, int((b - 255 * (1 - a_f)) / a_f)))
            
            transparent_logo.putpixel((x, y), (fg_r, fg_g, fg_b, alpha))
            
            # For dark-theme: if it's the dark 'Imagine' text (low saturation or dark grey), lighten to slate-100
            # Otherwise keep the teal color
            is_dark_text = (fg_r < 95 and fg_g < 95 and fg_b < 95)
            if is_dark_text:
                transparent_logo_white_text.putpixel((x, y), (241, 245, 249, alpha))
            else:
                transparent_logo_white_text.putpixel((x, y), (fg_r, fg_g, fg_b, alpha))

# Generate Icon alone (crescent swooshes)
# We isolate the swooshes: on the cropped image, 'Click' text starts at ~ (268 - crop_x1)
# and is between y ~ (265 - crop_y1) and (425 - crop_y1)
text_start_x = 268 - crop_x1
transparent_icon = Image.new('RGBA', (cw, ch), (255, 255, 255, 0))

for y in range(ch):
    for x in range(cw):
        orig_x = x + crop_x1
        orig_y = y + crop_y1
        # If in the bounding box of the text 'Click Flicks' & 'Imagine', skip
        in_click_flicks = (orig_x >= 265 and orig_x <= 732 and orig_y >= 268 and orig_y <= 365)
        in_imagine = (orig_x >= 265 and orig_x <= 440 and orig_y >= 366 and orig_y <= 425)
        if not (in_click_flicks or in_imagine):
            transparent_icon.putpixel((x, y), transparent_logo.getpixel((x, y)))

# Crop the icon to its active non-transparent pixels
icon_bbox = transparent_icon.getbbox()
if icon_bbox:
    tight_icon = transparent_icon.crop(icon_bbox)
    print(f"Tight icon bounds: {tight_icon.size}")
else:
    tight_icon = transparent_icon

# Create destination directories
client_dir = os.path.join(BASE_DIR, 'apps', 'clickflicks-client')
photographer_dir = os.path.join(BASE_DIR, 'apps', 'clickflicks-photographer')

for app_dir in [client_dir, photographer_dir]:
    os.makedirs(os.path.join(app_dir, 'public'), exist_ok=True)
    os.makedirs(os.path.join(app_dir, 'assets'), exist_ok=True)

# Save standard web assets
for app_dir in [client_dir, photographer_dir]:
    for target_subdir in ['public', 'assets']:
        out_dir = os.path.join(app_dir, target_subdir)
        cropped_rgb.save(os.path.join(out_dir, 'logo-full.png'), format='PNG')
        transparent_logo.save(os.path.join(out_dir, 'logo.png'), format='PNG')
        transparent_logo_white_text.save(os.path.join(out_dir, 'logo-white.png'), format='PNG')
        tight_icon.save(os.path.join(out_dir, 'icon.png'), format='PNG')
        
        # Favicon / PWA icons
        tight_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'favicon-32x32.png'), format='PNG')
        tight_icon.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'icon-192.png'), format='PNG')
        tight_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'icon-512.png'), format='PNG')

print("[OK] Saved Web and Public assets!")

# Generate iOS AppIcon (1024x1024)
def create_ios_app_icon(is_photographer=False):
    canvas = Image.new('RGB', (1024, 1024), (255, 255, 255))
    
    # Scale the full logo or icon mark into the canvas
    # The full logo looks iconic and professional
    # Let's fit the full logo into 820px width (leaving 102px margins on sides)
    target_w = 820
    scale = target_w / cw
    target_h = int(ch * scale)
    scaled_logo = transparent_logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    pos_x = (1024 - target_w) // 2
    pos_y = (1024 - target_h) // 2
    canvas.paste(scaled_logo, (pos_x, pos_y), scaled_logo)
    
    return canvas

ios_client_icon = create_ios_app_icon(is_photographer=False)
ios_client_icon.save(os.path.join(client_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'), format='PNG')

ios_photographer_icon = create_ios_app_icon(is_photographer=True)
ios_photographer_icon.save(os.path.join(photographer_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'), format='PNG')
print("[OK] Saved iOS AppIcon (1024x1024) for Client & Photographer!")

# Generate iOS Splash Screen (2732x2732)
def create_ios_splash():
    canvas = Image.new('RGB', (2732, 2732), (255, 255, 255))
    target_w = 1500
    scale = target_w / cw
    target_h = int(ch * scale)
    scaled_logo = transparent_logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pos_x = (2732 - target_w) // 2
    pos_y = (2732 - target_h) // 2
    canvas.paste(scaled_logo, (pos_x, pos_y), scaled_logo)
    return canvas

splash_img = create_ios_splash()
for app_dir in [client_dir, photographer_dir]:
    splash_dir = os.path.join(app_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')
    if os.path.exists(splash_dir):
        for name in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']:
            splash_img.save(os.path.join(splash_dir, name), format='PNG')
print("[OK] Saved iOS Splash Screens (2732x2732) for Client & Photographer!")

# Generate Android mipmap icons
density_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

fg_sizes = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432
}

for app_dir in [client_dir, photographer_dir]:
    res_dir = os.path.join(app_dir, 'android', 'app', 'src', 'main', 'res')
    if not os.path.exists(res_dir):
        continue
    for folder, size in density_sizes.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        
        # Square launcher icon
        sq_icon = Image.new('RGB', (size, size), (255, 255, 255))
        # Place scaled logo
        target_w = int(size * 0.88)
        scale = target_w / cw
        target_h = int(ch * scale)
        s_logo = transparent_logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
        sq_icon.paste(s_logo, ((size - target_w) // 2, (size - target_h) // 2), s_logo)
        sq_icon.save(os.path.join(target_folder, 'ic_launcher.png'), format='PNG')
        sq_icon.save(os.path.join(target_folder, 'ic_launcher_round.png'), format='PNG')
        
    for folder, size in fg_sizes.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        # Foreground icon (transparent with centered logo)
        fg_icon = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        target_w = int(size * 0.65)
        scale = target_w / cw
        target_h = int(ch * scale)
        s_logo = transparent_logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
        fg_icon.paste(s_logo, ((size - target_w) // 2, (size - target_h) // 2), s_logo)
        fg_icon.save(os.path.join(target_folder, 'ic_launcher_foreground.png'), format='PNG')

print("[OK] Saved Android mipmap icons!")
print("[SUCCESS] All native & web assets generated successfully!")
