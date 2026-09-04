import { useEffect, useMemo, useRef, useState } from 'react'
import blouseImage from './assets/products/flare-sleeve-blouse.jpg'
import knitImage from './assets/products/frill-polo-knit.jpg'
import skirtImage from './assets/products/olmy-tight-skirt.jpg'
import pantsImage from './assets/products/dry-easy-pants.jpg'
import bagImage from './assets/products/drawstring-bag.jpg'
import dressImage from './assets/products/satin-gather-dress.jpg'
import toteImage from './assets/products/grocery-tote.jpg'

type Screen = 'start' | 'scan' | 'camera' | 'result' | 'added' | 'memo' | 'my-fitting' | 'compare' | 'revisit' | 'detail'
type Product = { id:string; category:string; name:string; color:string; size:string; price:string; image:string }
type Notes = { length:string; fit:string; comfort:string; free:string }
type Fitting = { id:string; productId:string; notes:Notes; favorite:boolean; recordedAt:string }

const STORAGE = 'fitting-memory-v1'
const emptyNotes: Notes = { length:'', fit:'', comfort:'', free:'' }
const products: Product[] = [
  { id:'blouse', category:'SHIRT / BLOUSE', name:'フレアスリーブ ブラウス（接触冷感）', color:'LT.BLUE', size:'FREE', price:'¥8,910', image:blouseImage },
  { id:'pants', category:'EASY PANTS', name:'ドライ イージー パンツ', color:'BLACK', size:'38', price:'¥5,940 SALE', image:pantsImage },
  { id:'skirt', category:'MIDI / LONG SKIRT', name:'オルマイ LI/MIX タイト スカート', color:'BLACK', size:'38', price:'¥7,920', image:skirtImage },
  { id:'knit', category:'KNIT', name:'フリル ポロニット', color:'DK.BROWN', size:'FREE', price:'¥8,910', image:knitImage },
  { id:'dress', category:'ONE PIECE', name:'サテン ギャザー ショートスリーブ ワンピース 2', color:'NAVY', size:'FREE', price:'¥14,960', image:dressImage },
  { id:'bag', category:'SHOULDER BAG', name:'ハッスイ ポケットドロスト バッグ', color:'BEIGE', size:'FREE', price:'¥6,490', image:bagImage },
  { id:'tote', category:'TOTE BAG', name:'〈L.L.Bean〉グローサリー トートバッグ M', color:'NATURAL', size:'M', price:'¥4,950', image:toteImage },
]

const productById = (id:string) => products.find(product => product.id === id)!
const sampleFittings: Fitting[] = [
  { id:'sample-blouse', productId:'blouse', notes:{length:'ちょうどいい',fit:'ちょうどいい',comfort:'とても良い',free:'袖の広がりがきれい。仕事にも使えそう。'}, favorite:true, recordedAt:'今日 14:20' },
  { id:'sample-pants', productId:'pants', notes:{length:'長め',fit:'ちょうどいい',comfort:'とても良い',free:'落ち感がきれい。靴を変えてもう一度見たい。'}, favorite:false, recordedAt:'今日 14:28' },
  { id:'sample-knit', productId:'knit', notes:{length:'ちょうどいい',fit:'大きめ',comfort:'ふつう',free:'襟のデザインが新鮮。'}, favorite:false, recordedAt:'今日 14:35' },
]

function Header({ onDemo }:{ onDemo:()=>void }) {
  return <header><span className="wordmark">green label relaxing</span><button className="demo-link" onClick={onDemo}>DEMO</button></header>
}
function Arrow() { return <span aria-hidden="true">→</span> }
function ProductImage({ product, className='' }:{ product:Product; className?:string }) {
  return <div className={`product-image ${className}`}><img src={product.image} alt={product.name}/></div>
}

export default function App() {
  const initial = useMemo(() => { try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') } catch { return {} } }, [])
  const [screen, setScreen] = useState<Screen>(initial.screen || 'start')
  const [fittings, setFittings] = useState<Fitting[]>(initial.fittings || [])
  const [scanCount, setScanCount] = useState<number>(initial.scanCount || 0)
  const [pendingId, setPendingId] = useState<string>(initial.pendingId || '')
  const [editingId, setEditingId] = useState<string>(initial.editingId || '')
  const [notes, setNotes] = useState<Notes>(emptyNotes)
  const [drawer, setDrawer] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [toast, setToast] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify({ screen, fittings, scanCount, pendingId, editingId })) }, [screen, fittings, scanCount, pendingId, editingId])
  useEffect(() => { if (!toast) return; const timer=window.setTimeout(() => setToast(''), 1800); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => { if (screen !== 'added') return; const timer=window.setTimeout(() => setScreen('memo'), 1100); return () => window.clearTimeout(timer) }, [screen])
  useEffect(() => {
    if (screen !== 'camera') return
    let stream:MediaStream|undefined; let timer:number|undefined; let cancelled=false
    setCameraError('')
    const open = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' } }, audio:false })
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return }
        if (videoRef.current) { videoRef.current.srcObject=stream; await videoRef.current.play() }
        timer=window.setTimeout(() => { setPendingId(products[scanCount % products.length].id); setScreen('result') }, 2100)
      } catch { setCameraError('カメラを利用できません。端末のカメラ許可をご確認ください。') }
    }
    void open()
    return () => { cancelled=true; if(timer) window.clearTimeout(timer); stream?.getTracks().forEach(track => track.stop()) }
  }, [screen, scanCount])

  const pending = productById(pendingId || products[scanCount % products.length].id)
  const editing = fittings.find(item => item.id === editingId)
  const addPending = () => {
    const id=`${pending.id}-${Date.now()}`
    const fitting:Fitting={ id, productId:pending.id, notes:emptyNotes, favorite:false, recordedAt:'今日 ' + new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) }
    setFittings(items => [...items, fitting]); setEditingId(id); setNotes(emptyNotes); setScreen('added')
  }
  const saveNotes = () => {
    setFittings(items => items.map(item => item.id===editingId ? {...item,notes} : item)); setScanCount(count => count+1); setScreen('my-fitting'); setToast('試着メモを保存しました')
  }
  const openMemo = (item:Fitting) => { setEditingId(item.id); setNotes(item.notes); setScreen('memo') }
  const openDetail = (item:Fitting) => { setEditingId(item.id); setScreen('detail') }
  const toggleFavorite = (id:string) => { setFittings(items => items.map(item => item.id===id ? {...item,favorite:!item.favorite}:item)); const item=fittings.find(entry=>entry.id===id); setToast(item?.favorite ? 'お気に入りから外しました' : 'お気に入りに保存しました') }
  const restart = () => { setPendingId(''); setEditingId(''); setScreen('start'); setDrawer(false) }
  const clearAll = () => { setFittings([]); setScanCount(0); localStorage.removeItem(STORAGE); restart() }
  const simulateRevisit = () => { if (!fittings.length) setFittings(sampleFittings); setScreen('revisit'); setDrawer(false) }
  const setChoice = (key:keyof Notes,value:string) => setNotes(current => ({...current,[key]:value}))

  const fittingRow = (item:Fitting, revisit=false) => {
    const product=productById(item.productId)
    return <article className="fitting-row" key={item.id}>
      <ProductImage product={product}/><div className="row-content"><p className="product-category">{product.category}</p><h2>{product.name}</h2><p className="price">{product.price}</p>
        <div className="memory-tags">{item.notes.length && <span>丈感 {item.notes.length}</span>}{item.notes.fit && <span>サイズ {item.notes.fit}</span>}{item.notes.comfort && <span>着心地 {item.notes.comfort}</span>}{!item.notes.length&&!item.notes.fit&&!item.notes.comfort&&<span>メモ未入力</span>}</div>
        <div className="row-actions"><button onClick={() => revisit ? openDetail(item) : openMemo(item)}>{revisit?'商品詳細を見る':'メモを見る'}</button><button className={item.favorite?'favorite active':'favorite'} onClick={() => toggleFavorite(item.id)}>{item.favorite?'♥':'♡'} お気に入り</button></div>
        {revisit && <button className="ec-link" onClick={() => setToast('ECページを開くイメージです')}>ECで購入を検討する <Arrow/></button>}
      </div>
    </article>
  }

  let content:React.ReactNode
  if(screen==='start') content=<main className="start-screen fade-in">
    <div className="start-art"><span>FITTING  /  MEMORY</span><div className="mirror"><i/></div><p>KEEP THE<br/>FEELING</p></div>
    <p className="eyebrow">YOUR PERSONAL FITTING LOG</p><h1>FITTING<br/>MEMORY</h1><h2>試着を、その場だけの<br/>体験にしない。</h2><p className="intro">試したアイテムと、そのとき感じたことを記録。<br/>あとからゆっくり、比較・検討できます。</p>
    <button className="primary" onClick={()=>setScreen('scan')}>試着アイテムを登録する <Arrow/></button>{fittings.length>0&&<button className="text-button centered" onClick={()=>setScreen('my-fitting')}>MY FITTINGを見る</button>}
  </main>
  else if(screen==='scan') content=<main className="scan-screen fade-in"><p className="eyebrow">REGISTER ITEM</p><h1>試着する商品のタグを<br/>読み取ってください</h1><p className="intro">商品タグをカメラにかざしてください。</p><div className="tag-art"><div><small>green label relaxing</small><b>FITTING TAG</b><i/></div><em>＋</em></div><button className="primary" onClick={()=>setScreen('camera')}>カメラで読み取る <Arrow/></button><button className="text-button centered" onClick={()=>setScreen(fittings.length?'my-fitting':'start')}>← 戻る</button></main>
  else if(screen==='camera') content=<main className="camera-screen fade-in"><p className="eyebrow">SCANNING</p><h1>タグを枠内に<br/>合わせてください</h1><div className="camera-preview"><video ref={videoRef} autoPlay muted playsInline/><div className="scan-frame"><i/></div><span>{cameraError?'CAMERA UNAVAILABLE':'READING FITTING TAG'}</span></div>{cameraError&&<><p className="camera-error">{cameraError}</p><button className="secondary" onClick={()=>{setPendingId(products[scanCount%products.length].id);setScreen('result')}}>デモとして読み取りを続ける <Arrow/></button></>}<button className="text-button centered" onClick={()=>setScreen('scan')}>キャンセル</button></main>
  else if(screen==='result') content=<main className="result-screen fade-in"><div className="check">✓</div><p className="eyebrow">ITEM FOUND</p><h1>商品を読み取りました</h1><ProductImage product={pending} className="result-image"/><section className="product-info"><p className="product-category">{pending.category}</p><h2>{pending.name}</h2><dl><div><dt>COLOR</dt><dd>{pending.color}</dd></div><div><dt>SIZE</dt><dd>{pending.size}</dd></div></dl><p className="price">{pending.price}</p><span className="stock">● 店舗在庫あり</span></section><button className="primary" onClick={addPending}>試着リストに追加 <Arrow/></button></main>
  else if(screen==='added') content=<main className="added-screen fade-in"><div className="added-ring"><span>✓</span></div><p className="eyebrow">SAVED</p><h1>MY FITTINGに<br/>追加しました</h1><ProductImage product={pending}/><p>続けて、着てみた感覚を<br/>短く残しておきましょう。</p></main>
  else if(screen==='memo') {
    const product=editing?productById(editing.productId):pending
    const groups:[keyof Notes,string,string[]][]=[['length','丈感',['短め','ちょうどいい','長め']],['fit','サイズ感',['小さめ','ちょうどいい','大きめ']],['comfort','着心地',['少し気になる','ふつう','とても良い']]]
    content=<main className="memo-screen fade-in"><p className="eyebrow">YOUR FITTING NOTE</p><h1>着てみて、<br/>どうでしたか？</h1><div className="memo-product"><img src={product.image} alt=""/><p><small>{product.category}</small><b>{product.name}</b></p></div>{groups.map(([key,label,values])=><section className="note-group" key={key}><h2>{label}</h2><div>{values.map(value=><button className={notes[key]===value?'selected':''} onClick={()=>setChoice(key,value)} key={value}>{value}</button>)}</div></section>)}<section className="free-note"><label htmlFor="free-note">気になったポイント <span>OPTIONAL</span></label><textarea id="free-note" value={notes.free} onChange={event=>setChoice('free',event.target.value)} placeholder="肩まわりはちょうどいい。丈は少し長め。" rows={3}/></section><button className="primary" onClick={saveNotes}>保存する <Arrow/></button><button className="text-button centered" onClick={()=>{setScanCount(count=>count+1);setScreen('my-fitting')}}>メモをスキップ</button></main>
  }
  else if(screen==='my-fitting') content=<main className="my-screen fade-in"><p className="eyebrow">YOUR FITTING LOG</p><h1>MY FITTING</h1><p className="intro">今日試着したアイテム</p>{fittings.length?<div className="fitting-list">{fittings.map(item=>fittingRow(item))}</div>:<div className="empty"><p>まだ試着アイテムがありません。</p></div>}<button className="secondary" onClick={()=>setScreen('scan')}>別のアイテムも登録する <Arrow/></button>{fittings.length>=2&&<button className="primary compare-cta" onClick={()=>setScreen('compare')}>試着アイテムを比較する <Arrow/></button>}</main>
  else if(screen==='compare') content=<main className="compare-screen fade-in"><button className="back" onClick={()=>setScreen('my-fitting')}>← MY FITTING</button><p className="eyebrow">SIDE BY SIDE</p><h1>試着した感覚を<br/>比べる</h1><p className="intro">商品だけでなく、着てみたときの感覚まで。</p><div className="compare-grid">{fittings.slice(0,3).map(item=>{const product=productById(item.productId);return <article key={item.id}><ProductImage product={product}/><p className="product-category">{product.category}</p><h2>{product.name}</h2><p className="price">{product.price}</p><dl><div><dt>丈感</dt><dd>{item.notes.length||'—'}</dd></div><div><dt>サイズ感</dt><dd>{item.notes.fit||'—'}</dd></div><div><dt>着心地</dt><dd>{item.notes.comfort||'—'}</dd></div><div><dt>自分のメモ</dt><dd>{item.notes.free||'—'}</dd></div></dl><button className={item.favorite?'favorite active':'favorite'} onClick={()=>toggleFavorite(item.id)}>{item.favorite?'♥ 保存済み':'♡ お気に入り'}</button></article>})}</div><p className="swipe-hint">SWIPE TO COMPARE →</p></main>
  else if(screen==='revisit') content=<main className="revisit-screen fade-in"><p className="eyebrow">WELCOME BACK</p><h1>先ほど試着した<br/>アイテム</h1><p className="intro">お店で試したアイテムを、<br/>いつでもここから見返せます。</p><div className="revisit-note"><span>FITTING MEMORY</span><p>着たときの感覚も、そのまま残っています。</p></div><div className="fitting-list">{fittings.map(item=>fittingRow(item,true))}</div>{fittings.length>=2&&<button className="secondary" onClick={()=>setScreen('compare')}>試着アイテムを比較する <Arrow/></button>}</main>
  else {
    const item=editing||fittings[0]; const product=productById(item.productId)
    content=<main className="detail-screen fade-in"><button className="back" onClick={()=>setScreen(screen==='detail'?'revisit':'my-fitting')}>← 戻る</button><ProductImage product={product} className="detail-image"/><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="price">{product.price}</p><section className="detail-memory"><p>YOUR FITTING MEMORY</p><dl><div><dt>丈感</dt><dd>{item.notes.length||'—'}</dd></div><div><dt>サイズ感</dt><dd>{item.notes.fit||'—'}</dd></div><div><dt>着心地</dt><dd>{item.notes.comfort||'—'}</dd></div></dl>{item.notes.free&&<blockquote>“{item.notes.free}”</blockquote>}</section><button className="primary" onClick={()=>setToast('ECページを開くイメージです')}>ECで購入を検討する <Arrow/></button></main>
  }

  return <div className="app-shell"><Header onDemo={()=>setDrawer(true)}/>{content}{toast&&<div className="toast">{toast}</div>}{drawer&&<div className="drawer-backdrop" onClick={()=>setDrawer(false)}><aside className="drawer" onClick={event=>event.stopPropagation()}><button className="drawer-close" onClick={()=>setDrawer(false)}>×</button><p className="eyebrow">DEMO MENU</p><h2>体験を切り替える</h2><button onClick={restart}>最初からやり直す <Arrow/></button><button onClick={clearAll}>試着商品をすべて削除 <Arrow/></button><button onClick={simulateRevisit}>退店後のMY FITTINGを見る <Arrow/></button><p>{fittings.length} ITEMS SAVED</p></aside></div>}</div>
}
