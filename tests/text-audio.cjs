const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let tick,interval,cleared=false;
const box={textContent:'',scrollTop:0};
const pulses=[];
const ctx={state:'running',currentTime:0,destination:{},createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};},createOscillator(){const p={frequency:{setValueAtTime(){}},connect(){},disconnect(){},addEventListener(){},start(t){this.startAt=t;},stop(t){this.stopAt=t;}};pulses.push(p);return p;}};
const context=vm.createContext({document:{addEventListener(){},getElementById(){return box;}},setInterval(fn,ms){tick=fn;interval=ms;cleared=false;return 1;},clearInterval(){cleared=true;},ctx});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),context);
vm.runInContext('audioContext=ctx; splitMessageIntoPages=text=>[text]; typeText("あいうえおかきくけこ");',context);
assert.equal(interval,30);
for(let i=0;i<10;i++){ctx.currentTime=i*.03;tick();}
assert.equal(box.textContent,'あいうえおかきくけこ');assert.equal(cleared,true);
assert.ok(pulses.length>=3 && pulses.length<=4);
for(const p of pulses)assert.ok(Math.abs(p.stopAt-p.startAt-.03)<1e-8);
const count=pulses.length;
ctx.currentTime=1;vm.runInContext('playTextBeep(" "); playTextBeep("\\n");',context);assert.equal(pulses.length,count);
ctx.state='suspended';vm.runInContext('playTextBeep("あ");',context);assert.equal(pulses.length,count);
console.log('PASS 30ms text, spaced 30ms pulses, completion stops typing, spaces and suspended audio stay silent');
