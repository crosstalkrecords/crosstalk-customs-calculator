import json,sys
from PIL import Image
import numpy as np

ref=np.asarray(Image.open(sys.argv[1]).convert('RGBA'),dtype=np.int16)
got=np.asarray(Image.open(sys.argv[2]).convert('RGBA'),dtype=np.int16)
assert ref.shape==got.shape
diff=np.abs(ref-got)
# Ignore meaningless RGB bytes in fully transparent pixels.
diff[(ref[:,:,3]==0)&(got[:,:,3]==0),:3]=0
result={'size':list(ref.shape[:2]),'maeRGBA':float(diff.mean()),'p99ChannelDifference':float(np.percentile(diff,99)),'fractionPixelsOver16':float((diff.max(axis=2)>16).mean()),'alphaMAE':float(diff[:,:,3].mean())}
if ref.shape[0]==3000:
 result['textBands']={name:float(diff[int(a*3000):int(b*3000)].mean()) for name,a,b in [('left',.07,.18),('centre',.18,.28),('right',.28,.38),('rotated',.38,.53),('wrap',.84,.99)]}
print(json.dumps(result,indent=2))
if len(sys.argv)>3:
 Image.fromarray(np.uint8(np.minimum(diff*3,255))).save(sys.argv[3])
