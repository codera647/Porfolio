from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

base=Path('D:/Porfolio/output/stitch-portfolio-brief')
frames=Path('D:/Porfolio/output/reference-review/stitch-frames')
out=base/'upload-images'
out.mkdir(exist_ok=True)
font_path='C:/Windows/Fonts/segoeui.ttf'
def font(n):return ImageFont.truetype(font_path,n)
def canvas(title,subtitle,h):
    im=Image.new('RGB',(1600,h),'#161616');d=ImageDraw.Draw(im)
    d.text((44,28),title,font=font(34),fill='#f8f8f8')
    d.text((44,80),subtitle,font=font(22),fill='#d9835a')
    return im,d
def fit(im,size):
    im=im.copy();im.thumbnail(size,Image.Resampling.LANCZOS);return im
def tile(im,d,img,pos,size,label):
    x,y=pos;w,h=size
    d.rounded_rectangle((x,y,x+w,y+h),radius=12,fill='#252525')
    image=fit(img,(w-8,h-48));im.paste(image,(x+(w-image.width)//2,y+8+(h-48-image.height)//2))
    d.text((x+14,y+h-32),label,font=font(20),fill='#f8f8f8')

im,d=canvas('01 / SIGNATURE INTRO — read left to right, then next row',
            'Actual Abdul Moiz vector artwork. Draw once, hold briefly, then fade into the hero.',870)
source=Path('D:/Porfolio/output/abdul-moiz-design-kit/signature/.preview-frames')
for i,(n,label) in enumerate([(4,'0.13 s / first stroke'),(25,'0.83 s / first name'),(40,'1.33 s / capital M'),
                             (58,'1.93 s / second name'),(70,'2.33 s / underline'),(82,'2.73 s / complete signature')]):
    tile(im,d,Image.open(source/f'{n:04d}.png'),(44+(i%3)*510,130+(i//3)*325),(490,305),label)
d.text((44,802),'Target: near-black full screen; centered off-white signature; no numeric loading counter.',font=font(22),fill='#d9835a')
im.save(out/'01-signature-intro.png')

im,d=canvas('02 / SPLIT HERO FRAME — shape and entrance reference',
            'Source screenshots show a sphere. OMIT it. Replace teal/light panels with near-black/deep rust.',1300)
for i,label in enumerate(['A / opening begins','B / panel turns toward viewer','C / frame approaches front view','D / curved split and rounded corners']):
    tile(im,d,Image.open(frames/f'split-{i}.png'),(44+(i%2)*770,130+(i//2)*510),(740,490),label)
d.text((44,1180),'Use the panel geometry and the opening motion only. The final hero contains the centered name.',font=font(22),fill='#d9835a')
d.text((44,1224),'Target split: 60% #0C0C0C + 40% #87392A. Keep the curved boundary visible under the glow.',font=font(22),fill='#f8f8f8')
im.save(out/'02-split-hero-reference.png')

im,d=canvas('03 / NAME + GLOW — four captured interaction states',
            'Use ABDUL MOIZ in JetBrains Mono. These images illustrate behavior, not the final name or palette.',1030)
for i,label in enumerate(['A / uneven letter emphasis','B / central letters heavier and wider','C / emphasis shifts across the name','D / soft glow has moved behind the name']):
    tile(im,d,Image.open(frames/f'name-{i}.png'),(44+(i%2)*770,130+(i//2)*365),(740,345),label)
d.text((44,888),'Motion: letters near the pointer become heavier/wider; neighboring letters respond more subtly.',font=font(22),fill='#f8f8f8')
d.text((44,932),'The warm glow follows with eased lag, behind text. Written timing notes define the movement.',font=font(22),fill='#d9835a')
im.save(out/'03-name-and-glow-reference.png')

im,d=canvas('04 / FINAL BRAND DIRECTION — Abdul Moiz',
            'Website typography: JetBrains Mono. Handwritten signature is a separate original vector artwork.',980)
colors=[('#0c0c0c','Canvas / left'),('#87392a','Rust / right'),('#f9542a','Primary orange'),('#d9835a','Amber glow'),('#f8f8f8','Text'),('#f0dfd6','Name tint')]
for i,(c,label) in enumerate(colors):
    x=44+i*253;d.rounded_rectangle((x,145,x+235,285),radius=12,fill=c,outline='#4b4b4b')
    d.text((x,302),c.upper(),font=font(23),fill='#f8f8f8');d.text((x,339),label,font=font(18),fill='#d7d0c9')
sig=Image.open(base/'signature/abdul-moiz-signature-light.png').convert('RGBA');sig.thumbnail((1200,390),Image.Resampling.LANCZOS)
d.rounded_rectangle((44,415,1556,830),radius=18,fill='#0c0c0c')
im.paste(sig,((1600-sig.width)//2,425+(395-sig.height)//2),sig)
d.text((44,867),'Name fill: #F8F8F8 to #F0DFD6. Both hero panels stay dark enough for readable pale lettering.',font=font(22),fill='#f8f8f8')
d.text((44,912),'No avatar, portrait, sphere, teal, blue, or fictional project/biography claims.',font=font(22),fill='#d9835a')
im.save(out/'04-brand-and-signature.png')
print('Created four PNG upload boards.')
