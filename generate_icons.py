import os
from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color = '#22c55e')
    d = ImageDraw.Draw(img)
    # Draw a simple white circle or something
    margin = size // 5
    d.ellipse([margin, margin, size - margin, size - margin], fill='white')
    img.save(filename)

create_icon(192, 'favicon/icon-192.png')
create_icon(512, 'favicon/icon-512.png')
