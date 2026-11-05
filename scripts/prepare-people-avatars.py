"""Create web thumbnails without changing originals. Requires Pillow and pillow-heif."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json
from PIL import Image, ImageOps
import pillow_heif
pillow_heif.register_heif_opener()
source=Path('public/people'); destination=Path('public/avatars/people'); destination.mkdir(parents=True,exist_ok=True)
files=sorted(p for p in source.iterdir() if p.suffix.lower() in {'.heic','.jpg','.jpeg','.png','.webp'})
def convert(item):
 index,path=item; key=hashlib.sha256(path.name.encode()).hexdigest()[:12]; output=destination/f'{key}.jpg'
 with Image.open(path) as original:
  image = ImageOps.exif_transpose(original).convert('RGB')
  image.thumbnail((320,320))
  image.save(output, quality=78, optimize=True)

 return {'id':f'photo-{key}','src':f'avatars/people/{key}.jpg','label':f'Photo {index+1}'}
with ThreadPoolExecutor(max_workers=6) as pool: avatars=list(pool.map(convert,enumerate(files)))
Path('src/data/photoAvatars.ts').write_text('// Browser thumbnails of the user-supplied public/people images.\nexport const PHOTO_AVATARS = '+json.dumps(avatars,ensure_ascii=False,indent=2)+' as const;\n')
print(f'{len(avatars)} selectable photos; {sum(p.stat().st_size for p in destination.glob("*.jpg")):,} thumbnail bytes')
