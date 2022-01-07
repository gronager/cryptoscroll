const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

const dpr = window.devicePixelRatio || 1;
const canvas = document.getElementById('canvas');
canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) * dpr;
canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * dpr;

var mc = new Hammer(canvas);

mc.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });
mc.get('pinch').set({ enable: true });

let panning = false;
let offset = 0;
let velocity = 0;

mc.on("pan pinch", function(ev) {
  if (!panning) {
    offset = chronos.offset;
    panning = true;
 }
  chronos.offset = offset + ev.deltaY;
  velocity = 0;
});

mc.on("panend pinchend", function(ev) {
  offset = chronos.offset;
  velocity = ev.velocityY;
  panning = false;
});

mc.on("tap press", function(ev) {
 root.tap(ctx, ev.center);
});

const ctx = canvas.getContext('2d', { alpha: false, desynchronized: false });
ctx.scale(dpr, dpr);

let raf;

class Group {
  constructor() {
    this.children = [];
  }
  add(child) {
    this.children.push(child);
  }
  draw(ctx) {
    this.children.forEach(child => child.draw(ctx));
  }
  tap(ctx, pos) {
   this.children.forEach(child => child.tap(ctx, pos));
  }
}

class Button {
  constructor(x, y, action) {
    this.x = x;
    this.y = y;
    this.action = action;
    this.radius = 25;
    this.color = 'black';
    this.path = null;
    this.init();
  }
  init() {
    this.path = new Path2D();
    this.path.moveTo(this.x + this.radius, this.y);
    this.path.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fill(this.path);   
  }
  tap(ctx, pos) {
    if (ctx.isPointInPath(this.path, pos.x*dpr, pos.y*dpr)) {
      this.action();
    }
  }
}

function vtext(ctx, text, x, y) {
 ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI/2);
  ctx.textAlign = "left";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

class Chronos {
  constructor() {
    this.entities = [];
    this.index = new Map();
    this.events = [];
    this.offset = 0;
  }
  addRandomEntity() {
    this.entities.push("0x" + genRanHex(64));
    this.entities.sort();
    this.index.clear();
    for (i = 0; i < this.entities.length; i++) {
      this.index.set(this.entities[i], i);
    }
  }
  addRandomEvent() {
    // we need at least one entity to build events
    if (this.entities.length < 1) {
      return;
    }
    const time = getRandomInt(1231006505000, Date.now());
    // pick 1-7 random entities
    const n = getRandomInt(1, Math.max(7, this.entities.length));
    const entities = new Set();
    for (i = 0; i < n; i++) {
      entities.add(getRandomInt(0, this.entities.length));
    }
    const inputs = [];
    const outputs = [];
    entities.forEach(i => {
      if (Math.random() > 0.5) {
        inputs.push(this.entities[i]);
      }
      else {
        outputs.push(this.entities[i]);
      }
    });
    const event = {"time": time, "from": inputs, "to": outputs};
    this.events.push(event);
    this.events.sort((e1, e2) => { return e2.time - e1.time });
}
 draw(ctx) {

    // we need the layout of the parent layout - for now it is just the entire viewport
    const right = ctx.canvas.width/dpr;
    const bottom = ctx.canvas.height/dpr;
    // reserve some space in the top for text
    // reserve some space to the left for timestamps
    // space out entities and events evenly
    // events have a min spacing and then starts to bleed into the past
    const top = 100;
    const left = 100;
    const dw = (right - left)/(this.entities.length + 1);
    const entities = new Path2D();

    ctx.font = "10px Menlo"
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'middle'
    for (const [index, entity] of this.entities.entries()) {
      vtext(ctx, abbreviate(entity), left + (index + 1)*dw, top - 10);
      entities.moveTo(left + (index + 1)*dw, top);
      entities.lineTo(left + (index + 1)*dw, bottom);
    }
    
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'black';
    ctx.stroke(entities);
    
    const dh_min = 20;
    const dh = Math.max((bottom - top)/(this.events.length + 1), dh_min);
    const events = new Path2D();

    ctx.textAlign = 'right';
    if (Math.abs(velocity) > 0.1) {
      this.offset += velocity * 16; // assuming 60Hz - fix
      velocity *= 0.95;
    }
    const r = 3;
    for (const [index, event] of this.events.entries()) {
      const y = top + (index + 1)*dh + this.offset;
      if (y < top || y > bottom) {
        continue;
      }
      ctx.fillText(new Intl.DateTimeFormat('en-US').format(event.time), left- 10, y);
      // sort the inputs and outputs
      const entities = [];
      event.from.forEach((e) => { entities.push(-this.index.get(e)-1); });
      event.to.forEach((e) => { entities.push(this.index.get(e)+1); });
      entities.sort((a, b) => { return Math.abs(a) - Math.abs(b); })
      
      events.moveTo(left + (Math.abs(entities[0]))*dw - r, y);
      for (i = 0; i < entities.length; i++) {
        const x = left + (Math.abs(entities[i]))*dw;
        const sign = entities[i] / Math.abs(entities[i]);
        events.lineTo(x - r, y);
        events.lineTo(x, y + sign*r);
        events.lineTo(x + r, y);
      }
    }
    ctx.lineWidth = 1.5;
    ctx.stroke(events);
    //ctx.fill(events);

  }
  tap(ctx, pos) {
    
  }
}

const time_axis = {
  
};

function abbreviate(name) {
  return name.substring(0, 6)+ ".." + name.substring(name.length - 3);
}

const root = new Group();

const chronos = new Chronos();

root.add(new Button(30, 80, () => { chronos.addRandomEvent() } ));

root.add(new Button(80, 30, () => { chronos.addRandomEntity() } ));

for (let i = 0; i < 10; i++) {
  chronos.addRandomEntity();
}

for (let i = 0; i < 45; i++) {
  chronos.addRandomEvent();
}

root.add(chronos);

chronos.offset = -321;

function draw() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width/dpr, canvas.height/dpr);
  root.draw(ctx);
  raf = window.requestAnimationFrame(draw);
}

window.addEventListener('resize', function(e) {
  canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) * dpr;
  canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * dpr;
  ctx.scale(dpr, dpr);
  draw();
});

document.addEventListener( 'visibilitychange' , function() {
    if (document.hidden) {
      window.cancelAnimationFrame(raf);
    } else {
      raf = window.requestAnimationFrame(draw);
    }
}, false );

window.addEventListener('load', (event) => {
  raf = window.requestAnimationFrame(draw);
});