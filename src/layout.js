const padding=5;
const overlap=(a,b)=>a.x<b.x+b.width+padding&&a.x+a.width+padding>b.x&&a.y<b.y+b.height+padding&&a.y+a.height+padding>b.y;
function hitsCircle(box,node){
 const x=Math.max(box.x,Math.min(node.x,box.x+box.width)),y=Math.max(box.y,Math.min(node.y,box.y+box.height));
 return Math.hypot(x-node.x,y-node.y)<node.r+4;
}

// Required labels are never dropped. Background circles yield to readable labels;
// the label layer and its paper backing protect text when no completely empty slot exists.
export function placeLabels(nodes,width,height,previous=new Map()){
 const boxes=new Map(),required=nodes.filter(n=>n.showLabel&&n.priority>=50);
 const important=nodes.filter(n=>n.priority>=50);
 const ordered=[...nodes].sort((a,b)=>b.priority-a.priority||b.labelWidth-a.labelWidth||a.i-b.i);
 for(const node of ordered){
  if(!node.showLabel)continue;
  const w=node.labelWidth,h=node.labelHeight,gap=8;
  const prior=previous.get(node.term.id);
  const old=prior?{...prior,x:prior.x+node.x-(prior.nodeX??node.x),y:prior.y+node.y-(prior.nodeY??node.y)}:null;
  const candidates=[];
  if(old)candidates.push({...old});
  for(const extra of [0,14,28,44])candidates.push(
   {x:node.x-w/2,y:node.y-node.r-gap-h-extra,placement:`top-${extra}`},
   {x:node.x-w/2,y:node.y+node.r+gap+extra,placement:`bottom-${extra}`},
   {x:node.x+node.r+gap+extra,y:node.y-h/2,placement:`right-${extra}`},
   {x:node.x-node.r-gap-w-extra,y:node.y-h/2,placement:`left-${extra}`}
  );
  const valid=box=>box.x>=7&&box.y>=7&&box.x+w<=width-7&&box.y+h<=height-7&&![...boxes.values()].some(b=>overlap(box,b));
  const tryPlace=(candidate,blockers)=>{
   const box={...candidate,width:w,height:h,nodeX:node.x,nodeY:node.y};
   if(!valid(box)||blockers.some(n=>hitsCircle(box,n)))return false;
   box.backed=nodes.some(n=>hitsCircle(box,n));boxes.set(node.term.id,box);return true;
  };
  // Keep a valid prior position before searching, avoiding flickering between sides.
  if(old&&tryPlace(old,node.priority>=50?important:nodes))continue;
  if(candidates.some(c=>tryPlace(c,nodes)))continue;
  if(node.priority<50)continue;
  const free=[];
  for(let y=7;y+h<=height-7;y+=8)for(let x=7;x+w<=width-7;x+=10)
   free.push({x,y,placement:`free-${x}-${y}`,cost:Math.hypot(x+w/2-node.x,y+h/2-node.y)});
  free.sort((a,b)=>a.cost-b.cost);
  if(free.some(c=>tryPlace(c,important)))continue;
  // In the densest views, keep the words readable rather than silently removing them.
  free.some(c=>tryPlace(c,[]));
 }
 if(required.some(n=>!boxes.has(n.term.id))){
  // A final shelf layout guarantees all required terms can share a compact viewport.
  // This path is only used when locally placed cards have fragmented the free space.
  const pack=[...required].sort((a,b)=>b.labelWidth-a.labelWidth);
  for(const n of required)boxes.delete(n.term.id);
  let x=7,y=7,rowHeight=0;
  for(const n of pack){
   if(x+n.labelWidth>width-7){x=7;y+=rowHeight+padding;rowHeight=0;}
   boxes.set(n.term.id,{x,y,width:n.labelWidth,height:n.labelHeight,placement:'shelf',backed:true,nodeX:n.x,nodeY:n.y});
   x+=n.labelWidth+padding;rowHeight=Math.max(rowHeight,n.labelHeight);
  }
 }
 return boxes;
}

// Use a stable, viewport-sized set on the overview instead of reselecting labels every frame.
export function selectHomeLabels(nodes,width,height,category='all'){
 const pool=nodes.filter(n=>category==='all'||n.term.category===category);
 const count=Math.min(pool.length,Math.max(5,Math.min(24,Math.floor(width*height/18000))));
 return Array.from({length:count},(_,i)=>pool[Math.floor(i*pool.length/count)].term.id);
}
