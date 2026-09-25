const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});try{
const p=await b.newPage({viewport:{width:852,height:393}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{const original=window.setInterval;window.setInterval=(fn,ms,...args)=>{if(ms===30)window.textTick=fn;return original(fn,ms,...args);};});
await p.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await p.locator('.start').click();
const run=async(code,file)=>{
 await p.evaluate(code=>{clearTyping();eval(code);clearInterval(timer);},code);
 const overlay=p.locator('#itemOverlay');if(!await overlay.isVisible())throw Error('not visible '+code);
 if(!(await overlay.getAttribute('src')).endsWith(file))throw Error('wrong image');
 await overlay.evaluate(img=>img.decode());
 await p.evaluate(()=>{let count=0;while(typing||next){if(++count>100)throw Error('page loop');clearInterval(timer);while(typing)window.textTick();if(next){if(document.getElementById('itemOverlay').hidden)throw Error('hidden between pages');const cb=next;next=null;cb();}}if(document.getElementById('itemOverlay').hidden)throw Error('hidden after text');if(characterTalkTimer!==null)throw Error('mouth not stopped');});
};
await run('Game.place="904教室";searchItem("ゆか");','cut.png');
await run('searchItem("血染めのカッター");','cut.png');
await run('takeMenu();','cut.png');
await run('Game.place="801教室";searchItem("智恵蔵の本棚");','usb.png');
await run('takeMenu();','usb.png');
await run('searchItem("赤いUSBメモリ");','usb.png');
await run('searchItem("血の付いたカッター");','cut.png');
for(const [person,place] of [['侯宇帆','901シルク室'],['関澤遼','801教室'],['木村友紀子','学生ホール'],['通行人','西神田校舎正門']]){
 for(const [item,file] of [['血の付いたカッター','cut.png'],['赤いUSBメモリ','usb.png']]){
  for(const testimony of [false,true])await run(`Game.place=${JSON.stringify(place)};Game.flags.kimuraUnlocked=true;Game.flags.kimuraTestimony=${testimony};updateCharacterSprite();showItem(${JSON.stringify(person)},${JSON.stringify(item)});`,file);
 }
}
await p.evaluate(()=>{Game.place='801教室';updatePlace();showItem('関澤遼','赤いUSBメモリ');clearInterval(timer);});await p.locator('#itemOverlay').evaluate(img=>img.decode());await p.screenshot({path:'/private/tmp/adv3-item-overlay.png'});
await p.getByRole('button',{name:'▶ さがす',exact:true}).click();if(await p.locator('#itemOverlay').isVisible())throw Error('interruption');
if(errors.length)throw Error(errors.join());console.log('PASS: both pickups, all recipients/repeated/post-testimony responses, persistence after final page, mouth completion, interruption, image loading');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
