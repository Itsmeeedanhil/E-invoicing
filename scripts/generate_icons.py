import os
from PIL import Image, ImageDraw

def create_app_logo(size=2048):
    # Supersampling 2048x2048
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer rounded rectangle border with emerald gradient
    # Margin
    margin = size * 0.05
    box = [margin, margin, size - margin, size - margin]
    radius = size * 0.22
    
    # Draw outer emerald box
    border_color = (5, 150, 105, 255) # Emerald 600
    draw.rounded_rectangle(box, radius=radius, fill=border_color)
    
    # Inner white box
    border_width = size * 0.045
    inner_box = [margin + border_width, margin + border_width, size - margin - border_width, size - margin - border_width]
    inner_radius = max(1, radius - border_width)
    draw.rounded_rectangle(inner_box, radius=inner_radius, fill=(255, 255, 255, 255))
    
    # Landmark Icon in center
    # Icon color: emerald-600 (5, 150, 105)
    icon_color = (5, 150, 105, 255)
    stroke_w = int(size * 0.038)
    
    # Coordinates for Landmark icon (centered inside the box)
    cx = size / 2.0
    cy = size / 2.0
    
    # Icon width and height roughly 48% of total size
    w = size * 0.46
    h = size * 0.44
    
    top_y = cy - h * 0.52
    bottom_y = cy + h * 0.48
    
    # 1. Roof Pediment / Triangle
    # Apex at (cx, top_y)
    roof_w = w * 0.96
    roof_h = h * 0.28
    roof_base_y = top_y + roof_h
    
    # Draw roof triangle outline
    roof_pts = [
        (cx, top_y),
        (cx + roof_w / 2.0, roof_base_y),
        (cx - roof_w / 2.0, roof_base_y)
    ]
    
    # Fill roof slightly or stroke
    draw.polygon(roof_pts, fill=None, outline=icon_color, width=stroke_w)
    
    # Horizontal bar under roof pediment
    bar_y = roof_base_y + stroke_w * 0.6
    draw.line([(cx - roof_w * 0.52, bar_y), (cx + roof_w * 0.52, bar_y)], fill=icon_color, width=stroke_w)
    
    # 2. Base Steps at bottom
    base1_y = bottom_y - stroke_w * 1.6
    base2_y = bottom_y
    base_w1 = w * 0.96
    base_w2 = w * 1.04
    
    # Step 1
    draw.line([(cx - base_w1 / 2.0, base1_y), (cx + base_w1 / 2.0, base1_y)], fill=icon_color, width=stroke_w)
    # Step 2 (Bottom foundation)
    draw.line([(cx - base_w2 / 2.0, base2_y), (cx + base_w2 / 2.0, base2_y)], fill=icon_color, width=stroke_w)
    
    # 3. Four Pillars / Columns
    pillar_top_y = bar_y + stroke_w * 0.6
    pillar_bottom_y = base1_y - stroke_w * 0.6
    
    # 4 evenly spaced columns
    col_span = roof_w * 0.76
    col_xs = [
        cx - col_span / 2.0,
        cx - col_span / 6.0,
        cx + col_span / 6.0,
        cx + col_span / 2.0
    ]
    
    for px in col_xs:
        draw.line([(px, pillar_top_y), (px, pillar_bottom_y)], fill=icon_color, width=stroke_w)

    return img

def main():
    base_dir = r"c:\Users\Tetsuro\Desktop\E-invoice"
    icons_dir = os.path.join(base_dir, "src-tauri", "icons")
    public_dir = os.path.join(base_dir, "public")
    
    os.makedirs(icons_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)
    
    # Master image 2048x2048
    master = create_app_logo(2048)
    
    # Downscale and save all icon sizes
    targets = {
        os.path.join(icons_dir, "icon.png"): 512,
        os.path.join(icons_dir, "128x128.png"): 128,
        os.path.join(icons_dir, "128x128@2x.png"): 256,
        os.path.join(icons_dir, "32x32.png"): 32,
        os.path.join(icons_dir, "Square30x30Logo.png"): 30,
        os.path.join(icons_dir, "Square44x44Logo.png"): 44,
        os.path.join(icons_dir, "Square71x71Logo.png"): 71,
        os.path.join(icons_dir, "Square89x89Logo.png"): 89,
        os.path.join(icons_dir, "Square107x107Logo.png"): 107,
        os.path.join(icons_dir, "Square142x142Logo.png"): 142,
        os.path.join(icons_dir, "Square150x150Logo.png"): 150,
        os.path.join(icons_dir, "Square284x284Logo.png"): 284,
        os.path.join(icons_dir, "Square310x310Logo.png"): 310,
        os.path.join(icons_dir, "StoreLogo.png"): 50,
        os.path.join(public_dir, "logo.png"): 512,
        os.path.join(public_dir, "icon.png"): 192,
    }
    
    for path, sz in targets.items():
        resized = master.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(path, format="PNG")
        print(f"Saved {path} ({sz}x{sz})")
        
    # Generate Multi-res ICO file for Windows Tauri App & Favicon
    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    ico_img = master.resize((256, 256), Image.Resampling.LANCZOS)
    
    ico_path = os.path.join(icons_dir, "icon.ico")
    ico_img.save(ico_path, format="ICO", sizes=ico_sizes)
    print(f"Saved Windows ICO: {ico_path}")
    
    pub_ico = os.path.join(public_dir, "favicon.ico")
    ico_img.save(pub_ico, format="ICO", sizes=[(32, 32), (16, 16)])
    print(f"Saved Favicon ICO: {pub_ico}")

if __name__ == "__main__":
    main()
