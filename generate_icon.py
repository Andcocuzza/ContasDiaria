from PIL import Image, ImageDraw, ImageFont

size = 512
img = Image.new('RGB', (size, size), '#07180a')
draw = ImageDraw.Draw(img)

for y in range(size):
    t = y / (size - 1)
    if t < 0.4:
        r, g, b = 19, 58, 31
    elif t < 0.7:
        r, g, b = 165, 148, 32
    else:
        r, g, b = 143, 33, 31
    draw.line([(0, y), (size, y)], fill=(r, g, b))

# draw circle
circle_bbox = (56, 56, 456, 456)
draw.ellipse(circle_bbox, outline='#f8d44b', width=16)
draw.ellipse((86, 86, 426, 426), fill=(7, 24, 10))

# draw text
try:
    font = ImageFont.truetype('arial.ttf', 170)
except Exception:
    font = ImageFont.load_default()

text = 'CD'
try:
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
except AttributeError:
    w, h = font.getsize(text)
text_x = (size - w) / 2
text_y = (size - h) / 2 - 10
draw.text((text_x, text_y), text, font=font, fill='#f8d44b')

img.save('icon.png')
print('created icon.png')
