"use client";
import { memo, useEffect, useRef, useState } from "react";
import { ArrowDown, CalendarDays, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Celebration, stageState, SCENE_EVENT, SHOWER_EVENT, BLESSED_EVENT } from "./celebration";

const clamp = (n:number) => Math.max(0,Math.min(1,n));
const part = (p:number,a:number,b:number) => clamp((p-a)/(b-a));
const ease = (t:number) => t*t*(3-2*t);
const weddingDate = Date.parse("2027-02-20T09:15:00+05:30");
const details = [
  {title:"Mehendi afternoon",date:"Friday, 19 February 2027",time:"4:00 pm onwards",venue:"The Garden Courtyard · Thanjavur",copy:"An afternoon of henna, familiar songs, and the people we call home. Come dressed in colour and stay for the laughter."},
  {title:"Sangeet evening",date:"Friday, 19 February 2027",time:"7:00 pm onwards",venue:"The Celebration Hall · Thanjavur",copy:"An evening of music, dancing, and two families becoming one. Bring a favourite song and your happiest dancing shoes."},
  {title:"The wedding ceremony",date:"Saturday, 20 February 2027",time:"9:15 am – 11:30 am · IST",venue:"The Heritage Courtyard · Thanjavur",copy:"With the blessings of our families, join us for our wedding ceremony and a traditional South Indian lunch. Reception follows at 6:30 pm."},
];

function Countdown(){
 const [remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{const update=()=>setRemaining(Math.max(0,weddingDate-Date.now()));update();const t=setInterval(update,1000);return()=>clearInterval(t);},[]);
 const n=remaining===null?["—","—","—","—"]:[Math.floor(remaining/86400000),Math.floor(remaining/3600000)%24,Math.floor(remaining/60000)%60,Math.floor(remaining/1000)%60].map(x=>String(x).padStart(2,"0"));
 return <div className="countdown">{["Days","Hours","Minutes","Seconds"].map((label,i)=><div key={label}><span key={n[i]} className="count-digit">{n[i]}</span><small>{label}</small></div>)}</div>;
}

function BlessingControls(){
 const [count,setCount]=useState(0);
 useEffect(()=>{const add=(e:Event)=>setCount(c=>c+((e as CustomEvent<number>).detail||1));addEventListener(BLESSED_EVENT,add);return()=>removeEventListener(BLESSED_EVENT,add);},[]);
 return <div className="blessing-controls" data-layer="blessing-controls">
  <span className="eyebrow">PELLIKODUKU & PELLIKUTURU</span>
  <button className="gold-button akshantalu-button" onClick={()=>dispatchEvent(new Event(SHOWER_EVENT))}>Shower akshantalu <span aria-hidden="true">✦</span></button>
  <p className="tap-hint">Tap anywhere to bless the couple{count>0?<> · <b>{count}</b> {count===1?"blessing":"blessings"}</>:null}</p>
 </div>;
}

function OpeningAtmosphere(){
 return <div className="opening-atmosphere" data-layer="opening-atmosphere" aria-hidden="true">
  <div className="cloud-plane cloud-plane-left" data-air-depth="-22"><img className="intro-cloud cloud-left" src="/art/cloud.webp" alt="" width="1280" height="853"/></div>
  <div className="cloud-plane cloud-plane-right" data-air-depth="-12"><img className="intro-cloud cloud-right" src="/art/cloud.webp" alt="" width="1280" height="853"/></div>
  {[0,1,2,3].map(i=><div key={i} className={`butterfly-position butterfly-${i}`}><div className="butterfly-parallax" data-air-depth={18+i*9}><div className="butterfly-flight"><div className="butterfly-wings"><span className="butterfly-wing wing-left"><img src="/art/butterfly.webp" alt="" width="320" height="320"/></span><span className="butterfly-wing wing-right"><img src="/art/butterfly.webp" alt="" width="320" height="320"/></span></div></div></div></div>)}
 </div>;
}

const FilmScenes=memo(function FilmScenes({onDetails}:{onDetails:(n:number)=>void}){
 return <main className="film-stage" aria-label="Ananya and Karthik's scrolling wedding invitation">
  <div className="film-scene opening-scene" data-scene="opening">
   <div className="opening-glow"/><OpeningAtmosphere/>
   <div className="opening-title" data-layer="opening-title"><p className="eyebrow">WITH THE BLESSINGS OF OUR FAMILIES</p><h1>Ananya<span>&</span>Karthik</h1><p className="opening-date">20 February 2027</p><p className="eyebrow tiny">ARE GETTING MARRIED</p></div>
   <img className="opening-temple art" data-layer="opening-temple" src="/art/temple.webp" alt="An illustrated Chola-inspired South Indian temple rises into the sky" fetchPriority="high"/>
   <div className="opening-hint" data-layer="opening-hint"><span>Scroll to unfold our story</span><ArrowDown size={17}/></div>
  </div>
  <section className="film-scene gate-scene" data-scene="gate" aria-label="The invitation">
   <div className="paper-fill"/>
   <div className="invitation-words" data-layer="invitation-words"><span className="eyebrow">IN THE PRESENCE OF LOVE & TRADITION</span><h2><em>You're invited</em></h2><p>Together with our families,<br/>we invite you to celebrate the wedding of</p><h3>Ananya <span>&</span> Karthik</h3><div className="fine-rule"/><p>Two hearts. Two families.<br/>One beautiful beginning.</p><span className="eyebrow">20 FEBRUARY 2027 · THANJAVUR</span></div>
   <img className="gate-frame frame-art art" data-layer="gate-frame" src="/art/gate.webp" alt="Carved wedding gateway with jasmine garlands, banana leaves and brass lamps"/>
  </section>
  <section className="film-scene events-scene" data-scene="events" aria-label="Mehendi and Sangeet celebrations">
   <div className="paper-fill"/><img className="event-surround frame-art art" data-layer="event-surround" src="/art/gate.webp" alt=""/>
   <p className="events-label eyebrow">LET THE CELEBRATIONS BEGIN</p>
   <div className="event-window" data-layer="event-window" data-tilt="5"><div className="event-reel" data-layer="event-reel">{details.slice(0,2).map((event,i)=><article className="event-invitation" key={event.title}><div className="event-portrait"><img src={i===0?"/images/couple.webp":"/images/hands.webp"} alt={i===0?"The couple together in a heritage courtyard":"Champagne silk, gold bangles and intertwined hands"}/></div><div className="event-copy"><span className="eyebrow">{i===0?"A LITTLE COLOUR. A LOT OF JOY.":"OUR FAMILIES. OUR FAVOURITE SONGS."}</span><h2>{event.title}</h2><p>{event.date}<br/>{event.time}</p><p className="event-short">{i===0?"Henna, laughter and all the little joys before forever.":"A night of music, a little magic, and a whole lot of love."}</p><button className="gold-button" onClick={()=>onDetails(i)}>The details <ArrowUpRight size={15}/></button></div></article>)}</div></div>
   <div className="event-pips"><span data-layer="pip-one"/><span data-layer="pip-two"/></div>
  </section>
  <section className="film-scene couple-scene" data-scene="couple" aria-label="The bride and groom">
   <div className="couple-sky"/><img className="couple-temple temple-side left art" src="/art/temple.webp" alt=""/><img className="couple-temple temple-side right art" src="/art/temple.webp" alt=""/>
   <img className="couple-temple main-temple art" data-layer="couple-temple" src="/art/temple.webp" alt="Temple architecture behind the wedding couple"/>
   <div className="couple-heading" data-layer="couple-heading"><span className="eyebrow">A LITTLE DESTINY. A LOT OF LOVE.</span><h2>The bride <em>&</em> groom</h2></div>
   <img className="illustrated-couple art" data-layer="illustrated-couple" src="/art/couple.webp" alt="An illustrated South Indian bride and groom holding wedding garlands"/>
   <BlessingControls/>
  </section>
  <section className="film-scene portrait-scene plum-scene" data-scene="portrait" aria-label="Meet Ananya and Karthik">
   <div className="arch-paper"/><img className="plum-frame frame-art art" src="/art/plum.webp" alt="Plum and antique gold wedding arch with lamps and lotus ornament"/>
   <div className="portrait-intro" data-layer="portrait-intro"><span className="eyebrow">MEET THE BRIDE & GROOM</span><h2>Ananya <em>&</em> Karthik</h2><p>Different paths, the same kind of forever.</p></div>
   <figure className="gold-portrait" data-layer="gold-portrait" data-tilt="10"><img src="/images/couple.webp" alt="Ananya and Karthik in traditional wedding attire"/></figure>
   <div className="temple-procession" data-layer="temple-procession">{[0,1,2,3,4].map(i=><img key={i} className={`procession-temple temple-${i}`} src="/art/temple.webp" alt=""/>)}</div>
  </section>
  <section className="film-scene venue-scene plum-scene" data-scene="venue" aria-label="The wedding venue">
   <div className="arch-paper"/><img className="plum-frame frame-art art" src="/art/plum.webp" alt=""/>
   <div className="venue-copy" data-layer="venue-copy"><span className="eyebrow">WHERE OUR FOREVER BEGINS</span><h2>The Heritage<br/><em>Courtyard</em></h2><p>Thanjavur, Tamil Nadu</p><div className="fine-rule"/><p>Saturday, 20 February 2027<br/>Muhurtham · 9:15 am – 11:30 am</p><button className="gold-button wine-button" onClick={()=>onDetails(2)}>Wedding details <ArrowUpRight size={15}/></button></div>
   <img className="venue-temple art" data-layer="venue-temple" src="/art/temple.webp" alt="Golden temple illustration below the ceremony details"/>
  </section>
  <section className="film-scene blessing-scene plum-scene" data-scene="blessing" aria-label="An invitation from our families">
   <div className="arch-paper"/><img className="plum-frame frame-art art" src="/art/plum.webp" alt=""/>
   <div className="blessing-copy" data-layer="blessing-copy"><span className="eyebrow">WITH ALL OUR LOVE</span><h2>Will you<br/><em>join us?</em></h2><p>Together with our families,<br/>we invite you to celebrate our beginning.</p><a className="gold-button wine-button" href="/ananya-karthik-wedding.ics" download>Save the celebrations <CalendarDays size={15}/></a><span className="eyebrow">YOUR PRESENCE IS OUR GREATEST GIFT</span></div>
   <img className="blessing-landscape art" src="/art/landscape.webp" alt="A painted South Indian temple landscape"/>
  </section>
  <section className="film-scene memories-scene" data-scene="memories" aria-label="Counting the days and making memories">
   <div className="memories-ornament" aria-hidden="true"><img src="/art/gate.webp" alt=""/></div>
   <div className="countdown-heading" data-layer="countdown-heading"><span className="eyebrow">UNTIL OUR BEAUTIFUL BEGINNING</span><h2><em>Counting the days</em></h2><Countdown/></div>
   <div className="memories-heading" data-layer="memories-heading"><h2>Good things<br/><em>come in moments.</em></h2></div>
   <div className="floating-memories">{["couple","hands","car","temple","couple"].map((im,i)=><figure className={`memory memory-${i}`} data-layer={`memory-${i}`} key={i}><img src={`/images/${im}.webp`} alt={['Our story together','A promise of forever','The road to our celebration','Where traditions meet','Memories to hold close'][i]}/></figure>)}</div>
  </section>
  <section className="film-scene final-scene" data-scene="final" aria-label="The final invitation">
   <img className="final-landscape art" data-layer="final-landscape" src="/art/landscape.webp" alt="An original temple framed by terracotta hills, palms and lotus flowers"/>
   <div className="final-words" data-layer="final-words"><span className="eyebrow">TOGETHER IS A BEAUTIFUL PLACE TO BE</span><h2>Our forever<br/>begins <em>with you.</em></h2><p>Ananya <em>&</em> Karthik</p><span className="eyebrow">20 FEBRUARY 2027 · THANJAVUR</span><a className="final-save" href="/ananya-karthik-wedding.ics" download>Save the date <CalendarDays size={14}/></a><small>Invitation concept · Sample names, dates & venues</small></div>
   <p className="tap-hint final-hint" aria-hidden="true">Tap anywhere to scatter lotus petals</p>
  </section>
 </main>;
});

export default function WeddingFilm(){
 const root=useRef<HTMLDivElement>(null), maxScroll=useRef(1), reduceRef=useRef(false);
 const [ready,setReady]=useState(false),[event,setEvent]=useState<number|null>(null),[reduced,setReduced]=useState(false);
 useEffect(()=>{
  const el=root.current!, stage=el.querySelector<HTMLElement>('.film-stage')!;
  const nodes:Record<string,HTMLElement>={},scenes:Record<string,HTMLElement>={},owners:Record<string,string>={};
  el.querySelectorAll<HTMLElement>('[data-layer]').forEach(n=>{const name=n.dataset.layer!;nodes[name]=n;owners[name]=n.closest<HTMLElement>('[data-scene]')!.dataset.scene!;});
  el.querySelectorAll<HTMLElement>('[data-scene]').forEach(n=>scenes[n.dataset.scene!]=n);
  const eventCards=Array.from(el.querySelectorAll<HTMLElement>('.event-invitation'));
  const air=Array.from(el.querySelectorAll<HTMLElement>('[data-air-depth]')).map(n=>({node:n,depth:Number(n.dataset.airDepth)}));
  const ys:Record<string,number>={};
  const active=new Set<string>(),written=new WeakMap<HTMLElement,Record<string,string>>();
  // Only write values that changed. In particular, never invalidate the whole
  // document with an inherited CSS variable or repeated inert/ARIA changes.
  const style=(n:HTMLElement,property:'transform'|'opacity'|'visibility'|'pointerEvents',value:string)=>{
   let cache=written.get(n);if(!cache){cache={};written.set(n,cache);}if(cache[property]===value)return;cache[property]=value;n.style[property]=value;
  };
  const flag=(n:HTMLElement,name:string,value:boolean)=>{const next=String(value);if(n.getAttribute(name)!==next)n.setAttribute(name,next);};
  const media=matchMedia('(prefers-reduced-motion: reduce)');reduceRef.current=media.matches;setReduced(media.matches);
  let alive=true,frame=0,last=0,smoothed=scrollY,target=scrollY,lastRendered=-1,width=innerWidth,height=innerHeight;
  let input:'wheel'|'touch'='wheel',pointerX=0,pointerY=0,airX=0,airY=0,tapTimer:ReturnType<typeof setTimeout>|undefined;
  const wake=()=>{if(alive&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);};
  const measure=()=>{width=innerWidth;height=stage.clientHeight;maxScroll.current=Math.max(1,document.documentElement.scrollHeight-innerHeight);target=scrollY;lastRendered=-1;wake();};
  const scroll=()=>{target=scrollY;wake();};
  const wheel=()=>{input='wheel';};
  const touch=()=>{input='touch';};
  const changeMotion=()=>{reduceRef.current=media.matches;setReduced(media.matches);pointerX=pointerY=0;lastRendered=-1;wake();};
  const pointer=(e:PointerEvent)=>{if(e.pointerType==='touch'||reduceRef.current||target/maxScroll.current>.13)return;pointerX=e.clientX/width*2-1;pointerY=e.clientY/height*2-1;wake();};
  const leave=()=>{pointerX=pointerY=0;wake();};
  const tap=(e:PointerEvent)=>{if(e.pointerType!=='touch'||reduceRef.current||target/maxScroll.current>.1||(e.target instanceof Element&&e.target.closest('button,a')))return;pointerX=(e.clientX/width*2-1)*1.5;pointerY=(e.clientY/height*2-1)*1.5;clearTimeout(tapTimer);tapTimer=setTimeout(leave,900);wake();};
  const visibility=()=>{flag(el,'data-page-visible',!document.hidden);if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else{target=scrollY;wake();}};
  const move=(name:string,x:number,y:number,scale=1,rotate=0,opacity=1)=>{
   if(!active.has(owners[name]))return;const n=nodes[name];if(!n)return;
   style(n,'transform',`translate3d(${(x*width/100).toFixed(3)}px,${(y*height/100).toFixed(3)}px,0) scale(${scale.toFixed(4)}) rotate(${rotate.toFixed(3)}deg)`);style(n,'opacity',opacity.toFixed(4));
  };
  const scene=(name:string,start:number,arrive:number,depart:number,end:number,p:number)=>{
   const n=scenes[name];let y=(1-ease(part(p,start,arrive)))*100-ease(part(p,depart,end))*105;
   let visible=p>=start-.025&&p<=end+.015;
   if(name==='opening'){y=0;visible=p<.195;}
   if(name==='final'){y=(1-ease(part(p,start,arrive)))*100;visible=p>=start-.025;}
   if(reduceRef.current){visible=p>=start&&(name==='final'||p<end);y=0;}
   flag(n,'data-active',visible);style(n,'visibility',visible?'visible':'hidden');
   const interactive=visible&&Math.abs(y)<15;style(n,'pointerEvents',interactive?'auto':'none');
   if(n.inert===interactive)n.inert=!interactive;flag(n,'aria-hidden',!interactive);
   if(visible){active.add(name);ys[name]=y;style(n,'transform',`translate3d(0,${(y*height/100).toFixed(3)}px,0)`);}
  };
  const render=(p:number)=>{
   const r=reduceRef.current;active.clear();
   scene('opening',0,0,.15,.255,p);scene('gate',.105,.175,.255,.315,p);scene('events',.265,.315,.412,.468,p);scene('couple',.413,.462,.516,.573,p);scene('portrait',.516,.575,.64,.69,p);scene('venue',.645,.69,.735,.791,p);scene('blessing',.744,.792,.83,.878,p);scene('memories',.837,.877,.932,.978,p);scene('final',.93,.99,1,1.01,p);
   // The topmost scene that has mostly arrived owns the celebration layer.
   let owner='opening';for(const n of ['opening','gate','events','couple','portrait','venue','blessing','memories','final'])if(active.has(n)&&Math.abs(ys[n])<=50)owner=n;
   stageState.presence=Math.max(0,1-Math.abs(ys[owner]??0)/100);if(stageState.scene!==owner){stageState.scene=owner;dispatchEvent(new Event(SCENE_EVENT));}
   move('blessing-controls',0,0,1,0,part(p,.49,.515));
   move('opening-title',0,r?0:-part(p,.012,.115)*83,1,0,1-part(p,.055,.11));
   move('opening-temple',0,r?0:85-part(p,0,.235)*225,r?1:.91+part(p,0,.19)*.28);
   move('opening-hint',0,0,1,0,1-part(p,0,.035));
   move('opening-atmosphere',0,r?0:-part(p,0,.15)*28,1,0,1-ease(part(p,.065,.16)));
   move('invitation-words',0,r?0:10-part(p,.13,.25)*14,1,0,part(p,.145,.178));
   move('gate-frame',0,r?0:-part(p,.18,.265)*7,1+part(p,.15,.26)*.05);
   move('event-window',0,r?0:3-part(p,.30,.43)*6,r?1:.99+part(p,.30,.43)*.02);
   move('event-surround',0,r?0:2-part(p,.27,.43)*4);
   if(active.has('events')){const card=ease(part(p,.35,.385));eventCards.forEach((n,i)=>{const inert=i!==(card<.5?0:1);if(n.inert!==inert)n.inert=inert;});style(nodes['event-reel'],'transform',`translate3d(${(-card*50).toFixed(4)}%,0,0)`);style(nodes['pip-one'],'opacity',(1-card*.65).toFixed(4));style(nodes['pip-two'],'opacity',(.35+card*.65).toFixed(4));}
   move('couple-temple',0,r?0:16-part(p,.437,.54)*35,1+part(p,.44,.53)*.1);
   move('illustrated-couple',0,r?0:55-part(p,.44,.525)*72,r?1:.8+part(p,.44,.525)*.23);
   move('portrait-intro',0,r?0:7-part(p,.566,.64)*10,1,0,part(p,.551,.582));
   move('gold-portrait',0,r?0:43-part(p,.572,.625)*48,r?1:.9+part(p,.58,.64)*.1);
   move('temple-procession',0,r?0:45-part(p,.61,.665)*61,1.1);
   move('venue-copy',0,r?0:16-part(p,.674,.737)*29,1,0,part(p,.67,.695));
   move('venue-temple',0,r?0:35-part(p,.674,.745)*47,1);
   move('blessing-copy',0,r?0:14-part(p,.773,.833)*21,1,0,part(p,.77,.795));
   move('countdown-heading',0,r?0:-part(p,.885,.927)*53,1,0,1-part(p,.912,.93));
   move('memories-heading',0,r?0:17-part(p,.886,.932)*25,1,0,part(p,.884,.903)*(1-part(p,.934,.95)));
   if(active.has('memories')){const gather=ease(part(p,.892,.936)),fly=ease(part(p,.936,.974));[[-36,28,-19],[35,37,17],[-24,62,12],[28,70,-14],[4,83,-8]].forEach(([x,y,rot],i)=>move(`memory-${i}`,r?0:x*(1-gather)+Math.sin(i*2)*fly*60,r?0:y*(1-gather)+14*gather-fly*(50+i*12),r?.4:.58+gather*.15-fly*.33,rot*(1-gather)+i*6*gather-fly*rot,part(p,.881+i*.003,.9+i*.003)*(1-fly)));}
   move('final-landscape',0,r?0:12-part(p,.94,1)*12,1.02);
   move('final-words',0,r?0:12-part(p,.96,.995)*12,1,0,part(p,.955,.985));
  };
  function tick(time:number){
   frame=0;const dt=last?Math.min(time-last,64):16.67;last=time;
   const damping=reduceRef.current?1:1-Math.exp(-dt/(input==='touch'?80:190));smoothed+=(target-smoothed)*damping;if(Math.abs(target-smoothed)<.12)smoothed=target;
   const p=clamp(smoothed/maxScroll.current),settled=smoothed===target;
   flag(el,'data-scroll-moving',!settled);
   if(lastRendered!==smoothed){lastRendered=smoothed;render(p);}
   if(active.has('opening')&&!reduceRef.current){const f=1-Math.exp(-dt/240);airX+=(pointerX-airX)*f;airY+=(pointerY-airY)*f;if(Math.abs(pointerX-airX)<.001)airX=pointerX;if(Math.abs(pointerY-airY)<.001)airY=pointerY;air.forEach(({node,depth})=>style(node,'transform',`translate3d(${(airX*depth).toFixed(2)}px,${(airY*depth*.6).toFixed(2)}px,0)`));}
   const pointerMoving=active.has('opening')&&!reduceRef.current&&(airX!==pointerX||airY!==pointerY);
   if(!settled||pointerMoving)wake();else last=0;
  }
  window.addEventListener('resize',measure);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('wheel',wheel,{passive:true});window.addEventListener('touchstart',touch,{passive:true});window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('pointerdown',tap,{passive:true});document.documentElement.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',changeMotion);
  Promise.allSettled(Array.from(el.querySelectorAll<HTMLImageElement>('img')).map(im=>im.decode())).then(()=>{if(alive){setReady(true);measure();}});
  measure();
  return()=>{alive=false;cancelAnimationFrame(frame);clearTimeout(tapTimer);window.removeEventListener('resize',measure);window.removeEventListener('scroll',scroll);window.removeEventListener('wheel',wheel);window.removeEventListener('touchstart',touch);window.removeEventListener('pointermove',pointer);window.removeEventListener('pointerdown',tap);document.documentElement.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',changeMotion);};
 },[]);
 return <div ref={root} id="invitation-top" className={`invitation-film ${ready?'ready':''} ${reduced?'reduced':''}`}>
  <div className="film-loader" aria-hidden={ready}><span className="loader-monogram">a<em>&</em>k</span><div/><span className="eyebrow">UNFOLDING OUR STORY</span></div>
  <FilmScenes onDetails={setEvent}/>
  <Celebration disabled={reduced}/>
  <div className="scroll-track" aria-hidden="true"/>
  <a className="film-monogram" href="#invitation-top" aria-label="Return to the beginning">a<em>&</em>k</a>
  <Dialog open={event!==null} onOpenChange={open=>{if(!open)setEvent(null);}}><DialogContent className="event-dialog">{event!==null?<><span className="eyebrow">ANANYA & KARTHIK · THE CELEBRATIONS</span><DialogTitle className="dialog-title">{details[event].title}</DialogTitle><DialogDescription className="dialog-description">{details[event].copy}</DialogDescription><p className="dialog-date">{details[event].date}<br/>{details[event].time}</p><p>{details[event].venue}</p><a className="gold-button wine-button" href="/ananya-karthik-wedding.ics" download>Save the celebrations <CalendarDays size={16}/></a></>:null}</DialogContent></Dialog>
 </div>;
}
