# 开发时可用 espeakng-loader==0.2.4 重新生成固定短句，应用运行不需要 Python。
import ctypes,wave,os
from pathlib import Path
import espeakng_loader
lib=espeakng_loader.load_library()
lib.espeak_Initialize.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_char_p,ctypes.c_int]
# 使用同步回调取得原始语音；不需要音频设备，不联网。
rate=lib.espeak_Initialize(2,0,os.path.dirname(espeakng_loader.get_data_path()).encode(),0)
assert rate>0
parts=[]
CALLBACK=ctypes.CFUNCTYPE(ctypes.c_int,ctypes.POINTER(ctypes.c_short),ctypes.c_int,ctypes.c_void_p)
@CALLBACK
def callback(samples,count,events):
 if count:parts.append(ctypes.string_at(samples,count*2))
 return 0
lib.espeak_SetSynthCallback(callback)
lib.espeak_SetVoiceByName.argtypes=[ctypes.c_char_p]
assert lib.espeak_SetVoiceByName(b'cmn')==0
lib.espeak_SetParameter(1,190,0) # 语速
lib.espeak_SetParameter(3,64,0) # 音调
lib.espeak_Synth.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_uint,ctypes.c_int,ctypes.c_uint,ctypes.c_uint,ctypes.POINTER(ctypes.c_uint),ctypes.c_void_p]
text='走你！'.encode()+b'\0'
assert lib.espeak_Synth(text,len(text),0,1,0,1,None,None)==0
lib.espeak_Synchronize()
assert sum(map(len,parts))>1000
with wave.open(str(Path(__file__).resolve().parents[1]/'src/assets/sounds/kick-zouni.wav'),'wb') as output:
 output.setnchannels(1);output.setsampwidth(2);output.setframerate(rate);output.writeframes(b''.join(parts))
print('Original synthetic phrase rendered, rate',rate,'duration',sum(map(len,parts))/2/rate)
