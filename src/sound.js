// A quiet, locally synthesized tap. No network request or audio file is needed.
export function createClickSound({storage=globalThis.localStorage,makeContext=()=>{
 const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;
 return AudioContext?new AudioContext():null;
}}={}){
 let enabled=true,context=null,lastClick=-Infinity;
 try{enabled=storage.getItem('dictionary-sound')!=='off';}catch{}
 async function play(){
  if(!enabled)return false;
  try{
   context ||= makeContext();if(!context)return false;
   if(context.state==='suspended')await context.resume();
   if(!enabled||context.state!=='running')return false;
   const now=context.currentTime;
   if(now-lastClick<.045)return false;
   lastClick=now;
   const voice=context.createOscillator(),gain=context.createGain();
   voice.type='sine';
   voice.frequency.setValueAtTime(780,now);
   voice.frequency.exponentialRampToValueAtTime(360,now+.055);
   gain.gain.setValueAtTime(.0001,now);
   gain.gain.exponentialRampToValueAtTime(.07,now+.004);
   gain.gain.exponentialRampToValueAtTime(.0001,now+.075);
   voice.connect(gain);gain.connect(context.destination);
   voice.onended=()=>{voice.disconnect();gain.disconnect();};
   voice.start(now);voice.stop(now+.08);
   return true;
  }catch{return false;}
 }
 return {get enabled(){return enabled;},play,toggle(){
  enabled=!enabled;
  try{storage.setItem('dictionary-sound',enabled?'on':'off');}catch{}
  if(!enabled&&context)context.suspend().catch(()=>{});
  return enabled;
 }};
}
