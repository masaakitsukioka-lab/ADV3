const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const rings = [];
const param = {setValueAtTime(){},linearRampToValueAtTime(){}};
class AudioContext {
  constructor(){this.currentTime=10;this.destination={};}
  resume(){return Promise.resolve();}
  createGain(){return {gain:param,connect(){},disconnect(){}};}
  createOscillator(){const ring={frequency:param,connect(){},disconnect(){},addEventListener(){},start(t){this.startTime=t;},stop(t){this.stopTime=t;}};rings.push(ring);return ring;}
}
const context = vm.createContext({window:{AudioContext},document:{addEventListener(){}},setInterval,clearInterval});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),context);
(async()=>{
  // Trigger the real opening continuation; no sound should precede the phone text.
  vm.runInContext(`
    stopTitleBgm = () => {};
    updatePlace = () => {};
    startBgm = () => {};
    document.getElementById = () => ({style:{}});
    let continuation;
    let displayedText;
    showText = (text, callback) => { displayedText = text; continuation = callback; };
    startGame();
  `,context);
  assert.equal(rings.length,0);
  vm.runInContext('continuation()',context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(vm.runInContext('displayedText',context),/^――智恵蔵の携帯から、電話が鳴った。/);
  assert.equal(rings.length,3);
  for(let i=0;i<3;i++){
    assert.ok(Math.abs(rings[i].startTime-(10.02+i*1.5))<1e-8);
    assert.ok(Math.abs(rings[i].stopTime-rings[i].startTime-0.9)<1e-8);
  }
  console.log('PASS: phone text triggers exactly 3 rings, 0.9s each, 0.6s gaps, final stop at 3.9s.');
})().catch(e=>{console.error(e);process.exitCode=1;});
