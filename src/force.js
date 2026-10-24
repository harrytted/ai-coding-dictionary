const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function hash(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return(h>>>0)/4294967295;}

// Persistent simulation: selecting a term changes forces, never coordinates or angles.
export class ForceGraph {
 constructor(terms,connections){
  this.nodes=terms.map((term,i)=>({term,i,x:0,y:0,vx:0,vy:0,r:5,important:false}));
  this.byId=new Map(this.nodes.map(n=>[n.term.id,n]));
  this.links=[];const seen=new Set();
  for(const node of this.nodes)for(const id of connections(node.term)){
   const other=this.byId.get(id);if(!other||other===node)continue;
   const key=[node.term.id,id].sort().join(':');if(seen.has(key))continue;seen.add(key);
   this.links.push({a:node,b:other,variation:hash(key)});
  }
  this.width=0;this.height=0;this.alpha=1;this.time=0;this.selected=null;this.neighbors=new Set();
 }
 configure(selected,neighbors,width,height){
  const first=!this.width,changed=selected!==this.selected;
  const resized=Math.abs(width-this.width)>1||Math.abs(height-this.height)>1;
  this.width=Math.max(160,width);this.height=Math.max(120,height);
  this.selected=selected;this.neighbors=new Set(neighbors);
  for(const node of this.nodes){
   if(first){
    node.x=24+hash(node.term.id+'x')*(this.width-48);
    node.y=24+hash(node.term.id+'y')*(this.height-48);
   }
   node.important=node.term.id===selected||this.neighbors.has(node.term.id);
   node.r=node.term.id===selected?23:node.important?8+hash(node.term.id+'size')*7:3+hash(node.term.id+'size')*12;
   node.halfWidth=node.term.id===selected?Math.max(node.term.name.length*8+12,node.term.en.length*3.1+12):node.important?Math.max(node.r+10,Math.min(80,node.term.name.length*6.7+7)):node.r+4;
   node.halfHeight=node.term.id===selected?node.r+31:node.important?node.r+19:node.r+4;
  }
  if(first||changed||resized)this.alpha=Math.max(this.alpha,first?1:.7);
  return {nodes:this.nodes,changed:first||changed||resized};
 }
 step(delta,paused=false){
  if(paused){for(const n of this.nodes){n.vx*=.7;n.vy*=.7;}return;}
  const frames=clamp(delta,0,48)/16.6667,steps=Math.max(1,Math.ceil(frames));
  for(let i=0;i<steps;i++)this.integrate(frames/steps);
 }
 integrate(dt){
  this.time+=dt;
  this.alpha=Math.max(.035,this.alpha*Math.pow(.984,dt));
  const energy=this.alpha,cx=this.width/2,cy=this.height/2;
  const scale=Math.sqrt(this.width*this.height);
  for(const n of this.nodes){
   const selected=n.term.id===this.selected;
   // The focused node is softly centered, not pinned; its neighbors have no target angles.
   const gravity=selected?.065:n.important?.0014:.001;
   const pull=selected?Math.max(energy,.55):Math.max(energy,.08);
   n.vx+=(cx-n.x)*gravity*pull*dt;n.vy+=(cy-n.y)*gravity*pull*dt;
   // A small continuous force creates coherent motion through the whole graph.
   if(!selected){
    n.vx+=Math.sin(this.time*.009+n.i*1.91)*.013*dt;
    n.vy+=Math.cos(this.time*.007+n.i*2.37)*.011*dt;
   }
  }
  for(const link of this.links){
   const {a,b}=link,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
   const focused=a.term.id===this.selected||b.term.id===this.selected;
   const distance=focused?scale*(.19+link.variation*.2):scale*(.09+link.variation*.12);
   const strength=focused?.022:this.selected?.0007:.0025;
   const f=(d-distance)*strength*(focused?Math.max(energy,.32):energy)*dt;
   a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;
  }
  for(let i=0;i<this.nodes.length;i++){
   const a=this.nodes[i];
   for(let j=i+1;j<this.nodes.length;j++){
    const b=this.nodes[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<.001){dx=.1;dy=.1;d=Math.hypot(dx,dy);}
    const charge=clamp(scale*.9,180,600)/(d*d+90)*energy*dt;
    a.vx-=dx/d*charge;a.vy-=dy/d*charge;b.vx+=dx/d*charge;b.vy+=dy/d*charge;
    // Rectangular collision envelopes leave space above important circles for Chinese labels.
    const ax=a.x,bx=b.x,ay=a.y-(a.important?12:0),by=b.y-(b.important?12:0);
    const overlapX=a.halfWidth+b.halfWidth-Math.abs(bx-ax);
    const overlapY=a.halfHeight+b.halfHeight-Math.abs(by-ay);
    if(overlapX>0&&overlapY>0){
     const weightA=a.term.id===this.selected?.22:a.important?.55:1;
     const weightB=b.term.id===this.selected?.22:b.important?.55:1;
     const force=.13*dt; // collision remains active after the graph cools
     if(overlapX<overlapY){const push=Math.sign(bx-ax||dx)*overlapX*force;a.vx-=push*weightA;b.vx+=push*weightB;}
     else{const push=Math.sign(by-ay||dy)*overlapY*force;a.vy-=push*weightA;b.vy+=push*weightB;}
    }
   }
  }
  const hub=this.byId.get(this.selected);
  if(hub){
   const w=Math.max(hub.term.name.length*16,hub.term.en.length*6.2)+12;
   const labelTop=hub.y-hub.r-8-35;
   const top=labelTop>=8?labelTop:hub.y+hub.r+8;
   const box={left:hub.x-w/2,right:hub.x+w/2,top,bottom:top+35};
   for(const n of this.nodes)if(n!==hub){
    const gap=n.r+7,left=box.left-gap,right=box.right+gap,top=box.top-gap,bottom=box.bottom+gap;
    if(n.x>left&&n.x<right&&n.y>top&&n.y<bottom){
     const distances=[n.x-left,right-n.x,n.y-top,bottom-n.y],side=distances.indexOf(Math.min(...distances));
     const correction=Math.min(3,distances[side]+.2)*dt;
     if(side===0){n.x-=correction;n.vx=Math.min(n.vx,0);}
     else if(side===1){n.x+=correction;n.vx=Math.max(n.vx,0);}
     else if(side===2){n.y-=correction;n.vy=Math.min(n.vy,0);}
     else{n.y+=correction;n.vy=Math.max(n.vy,0);}
    }
   }
  }
  for(const n of this.nodes){
   const margin=n.r+12;
   n.vx+=(Math.max(0,margin-n.x)-Math.max(0,n.x-this.width+margin))*.1*dt;
   n.vy+=(Math.max(0,margin-n.y)-Math.max(0,n.y-this.height+margin))*.1*dt;
   const damping=Math.pow(.78,dt);n.vx*=damping;n.vy*=damping;
   n.x+=clamp(n.vx,-9,9)*dt;
   n.y+=clamp(n.vy,-9,9)*dt;
  }
 }
 settle(steps=240){for(let i=0;i<steps;i++)this.step(16.6667);for(const n of this.nodes){n.vx=0;n.vy=0;}}
}
