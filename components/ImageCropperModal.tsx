import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { Check, LoaderCircle, Minus, Plus, RefreshCcw, RotateCcw, RotateCw, X } from 'lucide-react'
import { exportCroppedCanvas, getImageFileError, type ImageCropRequestOptions, type ImageCropResult } from '../lib/imageCropper'

type Props = { file:File; options:ImageCropRequestOptions; onCancel:()=>void; onComplete:(result:ImageCropResult)=>void }

export default function ImageCropperModal({ file, options, onCancel, onComplete }:Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [ready,setReady]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(()=>getImageFileError(file,options))
  const square=options.mode==='square'

  useEffect(()=>{
    if(error || !imageRef.current) return
    const url=URL.createObjectURL(file)
    const image=imageRef.current
    image.src=url
    const onLoad=()=>{
      cropperRef.current?.destroy()
      cropperRef.current=new Cropper(image,{
        viewMode:1, dragMode:'move', aspectRatio:square?1:NaN,
        autoCropArea:.92, responsive:true, restore:false, background:false,
        movable:true, zoomable:true, rotatable:true, scalable:false,
        ready(){
          setReady(true)
          if(!square && options.initialAspectRatio && options.initialAspectRatio>0){
            window.setTimeout(()=>{
              const c=cropperRef.current;if(!c)return
              const canvas=c.getCanvasData();const ratio=Number(options.initialAspectRatio)
              const maxW=canvas.width*.94,maxH=canvas.height*.94;let width=maxW,height=width/ratio
              if(height>maxH){height=maxH;width=height*ratio}
              c.setCropBoxData({left:canvas.left+(canvas.width-width)/2,top:canvas.top+(canvas.height-height)/2,width,height})
            },0)
          }
        },
      })
    }
    image.addEventListener('load',onLoad)
    return ()=>{ image.removeEventListener('load',onLoad); cropperRef.current?.destroy(); cropperRef.current=null; URL.revokeObjectURL(url) }
  },[file,error,options.initialAspectRatio,square])

  async function complete(){
    const cropper=cropperRef.current
    if(!cropper||busy)return
    setBusy(true);setError(null)
    try{
      const source=cropper.getImageData()
      const max=options.maxOutputDimension ?? 3000
      const canvas=cropper.getCroppedCanvas({maxWidth:max,maxHeight:max,imageSmoothingEnabled:true,imageSmoothingQuality:'high'})
      if(!canvas?.width||!canvas.height) throw new Error('محدوده برش معتبر نیست.')
      const output=await exportCroppedCanvas(canvas,file,options)
      onComplete({file:output,width:canvas.width,height:canvas.height,sourceWidth:source.naturalWidth,sourceHeight:source.naturalHeight})
    }catch(err){setError(err instanceof Error?err.message:'ساخت تصویر برش‌خورده انجام نشد.');setBusy(false)}
  }

  const layer=<div className="fixed inset-0 z-[2147483647] pointer-events-auto isolation-isolate bg-[rgba(5,9,20,0.84)] grid place-items-center p-5 backdrop-blur-[10px]" role="presentation">
    <section className="w-[min(920px,96vw)] max-h-[94vh] overflow-auto bg-[#111827] border border-white/10 rounded-[22px] shadow-[0_30px_90px_rgba(0,0,0,0.55)] pointer-events-auto" role="dialog" aria-modal="true" aria-label={options.title||'برش تصویر'}>
      <header><div><h2>{options.title||(square?'برش مربعی تصویر':'برش تصویر')}</h2><p>{options.description||(square?'کادر مربع را تنظیم کنید؛ خروجی دقیقاً مربعی ذخیره می‌شود.':'کادر تصویر را به اندازه دلخواه تنظیم کنید.')}</p></div><button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={onCancel} aria-label="بستن"><X size={20}/></button></header>
      {error&&<div className="cropper-error">{error}</div>}
      {!error&&<div className="cropper-stage"><img ref={imageRef} alt="پیش‌نمایش برش" /></div>}
      {!error&&<div className="cropper-tools">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" disabled={!ready} onClick={()=>cropperRef.current?.zoom(-.1)} title="کوچک‌نمایی"><Minus size={18}/></button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" disabled={!ready} onClick={()=>cropperRef.current?.zoom(.1)} title="بزرگ‌نمایی"><Plus size={18}/></button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" disabled={!ready} onClick={()=>cropperRef.current?.rotate(-90)} title="چرخش چپ"><RotateCcw size={18}/></button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" disabled={!ready} onClick={()=>cropperRef.current?.rotate(90)} title="چرخش راست"><RotateCw size={18}/></button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" disabled={!ready} onClick={()=>cropperRef.current?.reset()} title="بازنشانی"><RefreshCcw size={18}/></button>
      </div>}
      <footer dir="ltr" className="flex items-center justify-start gap-3 p-5"><button className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" disabled={busy} onClick={onCancel}>انصراف</button><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50" disabled={!ready||busy||Boolean(error)} onClick={()=>void complete()}>{busy?<LoaderCircle className="spin" size={17}/>:<Check size={17}/>}<span>استفاده از تصویر</span></button></footer>
    </section>
  </div>
  return createPortal(layer,document.body)
}
