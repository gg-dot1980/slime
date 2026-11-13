from pathlib import Path
import subprocess
p=Path('/workspace/scratch/85889dd4920d/slime-demo-work/.sites-checkout')
lines=['吃得巧，活得久。','WASD／方向鍵移動','吃原色食物，混出自己的顏色','吞掉較小的史萊姆，逐步長大','大型史萊姆會追你，留意邊界','手機：螢幕搖桿／傾斜操控','5 分鐘內成長到體型 200','準備好了？來挑戰 Slime Arena']
f='crop=960:540:0:0,scale=960:558,setsar=1,pad=960:708:0:0:color=0x080e15'
for i,line in enumerate(lines):
 t=Path(f'/tmp/demo-caption-{i}.txt');t.write_text(line)
 f+=f",drawtext=fontfile=/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc:textfile={t}:fontcolor=white:fontsize=42:x=(w-text_w)/2:y=593:enable='between(t,{i*5},{(i+1)*5})'"
subprocess.run(['ffmpeg','-y','-v','error','-i','/workspace/scratch/85889dd4920d/slime-demo-media/slime-demo-v1.webm','-t','40','-vf',f,'-r','24','-c:v','libx264','-preset','fast','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(p/'media/slime-demo-v2.mp4')],check=True)
