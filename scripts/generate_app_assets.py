import os
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_IMAGE = r'C:/Users/Kay/.gemini/antigravity-ide/brain/153996e3-fb0f-41b2-b1b3-6424ec758017/.user_uploaded/media_1791558492226.jpg'

print(f"Loading source image: {SRC_IMAGE}")
src = Image.open(SRC_IMAGE).convert('RGB')
w, h = src.size

# 1. Extract Full Logo with Text ('Click Flicks' & 'Imagine')
full_crop = src.crop((125, 165, 735, 530))
fw, fh = full_crop.size

clean_full = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
clean_full_white_text = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))

for y in range(fh):
    for x in range(fw):
        r, g, b = full_crop.getpixel((x, y))
        if r > 248 and g > 248 and b > 248:
            continue
        diff = max(255 - r, 255 - g, 255 - b)
        if diff < 10:
            continue
        
        if diff >= 35:
            clean_full.putpixel((x, y), (r, g, b, 255))
            if r < 100 and g < 100 and b < 100:
                clean_full_white_text.putpixel((x, y), (241, 245, 249, 255))
            else:
                clean_full_white_text.putpixel((x, y), (r, g, b, 255))
        else:
            alpha = int((diff / 35.0) * 255)
            a_f = max(0.15, alpha / 255.0)
            nr = max(0, min(255, int((r - 255 * (1 - a_f)) / a_f)))
            ng = max(0, min(255, int((g - 255 * (1 - a_f)) / a_f)))
            nb = max(0, min(255, int((b - 255 * (1 - a_f)) / a_f)))
            clean_full.putpixel((x, y), (nr, ng, nb, alpha))
            if nr < 100 and ng < 100 and nb < 100:
                clean_full_white_text.putpixel((x, y), (241, 245, 249, alpha))
            else:
                clean_full_white_text.putpixel((x, y), (nr, ng, nb, alpha))

f_bbox = clean_full.getbbox()
transparent_logo = clean_full.crop(f_bbox)
transparent_logo_white = clean_full_white_text.crop(f_bbox)
print(f"Clean full logo size: {transparent_logo.size}")

# 2. Extract Aperture Crescent Mark
crescent_crop = src.crop((130, 168, 396, 528))
cw, ch = crescent_crop.size

clean_mark = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
for y in range(ch):
    for x in range(cw):
        r, g, b = crescent_crop.getpixel((x, y))
        if r > 248 and g > 248 and b > 248:
            continue
        diff = max(255 - r, 255 - g, 255 - b)
        if diff < 10:
            continue
        
        if diff >= 35:
            clean_mark.putpixel((x, y), (r, g, b, 255))
        else:
            alpha = int((diff / 35.0) * 255)
            a_f = max(0.15, alpha / 255.0)
            nr = max(0, min(255, int((r - 255 * (1 - a_f)) / a_f)))
            ng = max(0, min(255, int((g - 255 * (1 - a_f)) / a_f)))
            nb = max(0, min(255, int((b - 255 * (1 - a_f)) / a_f)))
            clean_mark.putpixel((x, y), (nr, ng, nb, alpha))

c_bbox = clean_mark.getbbox()
tight_icon = clean_mark.crop(c_bbox)
print(f"Clean tight crescent icon mark bounds: {tight_icon.size}")

# Target app directories
client_dir = os.path.join(BASE_DIR, 'apps', 'clickflicks-client')
photographer_dir = os.path.join(BASE_DIR, 'apps', 'clickflicks-photographer')

for app_dir in [client_dir, photographer_dir]:
    os.makedirs(os.path.join(app_dir, 'public'), exist_ok=True)
    os.makedirs(os.path.join(app_dir, 'assets'), exist_ok=True)

# Save standard web assets
for app_dir in [client_dir, photographer_dir]:
    for target_subdir in ['public', 'assets']:
        out_dir = os.path.join(app_dir, target_subdir)
        transparent_logo.save(os.path.join(out_dir, 'logo-full.png'), format='PNG')
        transparent_logo.save(os.path.join(out_dir, 'logo.png'), format='PNG')
        transparent_logo_white.save(os.path.join(out_dir, 'logo-white.png'), format='PNG')
        tight_icon.save(os.path.join(out_dir, 'icon.png'), format='PNG')
        
        # Favicon / PWA icons
        tight_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'favicon-32x32.png'), format='PNG')
        tight_icon.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'icon-192.png'), format='PNG')
        tight_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(out_dir, 'icon-512.png'), format='PNG')

print("[OK] Saved Web and Public assets!")

# Generate iOS AppIcon (1024x1024)
def create_ios_app_icon(is_photographer=False):
    bg_color = (24, 24, 27) if is_photographer else (255, 255, 255)
    canvas = Image.new('RGBA', (1024, 1024), (*bg_color, 255))
    
    # Scale crescent mark to 68% height
    target_h = int(1024 * 0.68)
    target_w = int(tight_icon.width * (target_h / tight_icon.height))
    scaled_mark = tight_icon.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    pos_x = (1024 - target_w) // 2
    pos_y = (1024 - target_h) // 2
    canvas.paste(scaled_mark, (pos_x, pos_y), scaled_mark)
    
    return canvas.convert('RGB')

ios_client_icon = create_ios_app_icon(is_photographer=False)
ios_client_icon.save(os.path.join(client_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'), format='PNG')

ios_photographer_icon = create_ios_app_icon(is_photographer=True)
ios_photographer_icon.save(os.path.join(photographer_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png'), format='PNG')
print("[OK] Saved iOS AppIcon (1024x1024) for Client & Photographer!")

# Generate iOS Splash Screen (2732x2732)
def create_ios_splash(is_photographer=False):
    bg_color = (24, 24, 27) if is_photographer else (255, 255, 255)
    canvas = Image.new('RGBA', (2732, 2732), (*bg_color, 255))
    logo_to_use = transparent_logo_white if is_photographer else transparent_logo
    target_w = 1500
    scale = target_w / logo_to_use.width
    target_h = int(logo_to_use.height * scale)
    scaled_logo = logo_to_use.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pos_x = (2732 - target_w) // 2
    pos_y = (2732 - target_h) // 2
    canvas.paste(scaled_logo, (pos_x, pos_y), scaled_logo)
    return canvas.convert('RGB')

for app_dir in [client_dir, photographer_dir]:
    is_photographer = (app_dir == photographer_dir)
    splash_dir = os.path.join(app_dir, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')
    if os.path.exists(splash_dir):
        splash_img = create_ios_splash(is_photographer=is_photographer)
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

def make_round_icon(base_img):
    size = base_img.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    round_img = Image.new('RGBA', size, (0, 0, 0, 0))
    round_img.paste(base_img, (0, 0), mask)
    return round_img

for app_dir in [client_dir, photographer_dir]:
    is_photographer = (app_dir == photographer_dir)
    bg_color = (24, 24, 27) if is_photographer else (255, 255, 255)
    res_dir = os.path.join(app_dir, 'android', 'app', 'src', 'main', 'res')
    if not os.path.exists(res_dir):
        continue
    
    # 1. Generate Legacy Raster Icons (ic_launcher.png & ic_launcher_round.png)
    for folder, size in density_sizes.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        
        # Square launcher icon with crescent mark
        sq_icon = Image.new('RGBA', (size, size), (*bg_color, 255))
        target_h = int(size * 0.70)
        target_w = int(tight_icon.width * (target_h / tight_icon.height))
        s_mark = tight_icon.resize((target_w, target_h), Image.Resampling.LANCZOS)
        sq_icon.paste(s_mark, ((size - target_w) // 2, (size - target_h) // 2), s_mark)
        
        # Save square icon as RGB PNG
        sq_icon.convert('RGB').save(os.path.join(target_folder, 'ic_launcher.png'), format='PNG')
        
        # Save round icon with circular alpha mask
        round_icon = make_round_icon(sq_icon)
        round_icon.save(os.path.join(target_folder, 'ic_launcher_round.png'), format='PNG')
        
    # 2. Generate Adaptive Foreground Icons (ic_launcher_foreground.png)
    for folder, size in fg_sizes.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        
        # Foreground icon (transparent canvas with centered crescent mark sized for safe zone)
        fg_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        target_h = int(size * 0.54)
        target_w = int(tight_icon.width * (target_h / tight_icon.height))
        s_mark = tight_icon.resize((target_w, target_h), Image.Resampling.LANCZOS)
        fg_icon.paste(s_mark, ((size - target_w) // 2, (size - target_h) // 2), s_mark)
        fg_icon.save(os.path.join(target_folder, 'ic_launcher_foreground.png'), format='PNG')

print("[OK] Saved Android mipmap icons!")
print("[SUCCESS] All native & web assets generated successfully!")
