const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.otf':'font/otf','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));let fonts=0;p.on('response',r=>{if(r.url().endsWith('.woff2')&&r.status()===200)fonts++;});
const url=`http://127.0.0.1:${server.address().port}/`;
for(const [width,height] of [[852,393],[667,375],[568,320],[393,852]]){
 await p.setViewportSize({width,height});await p.goto(url);await p.locator('.start').click();await p.waitForFunction(()=>Game.started);
 const r=await p.evaluate(()=>{clearTyping();Game.flags.kimuraTestimony=true;Game.place='801教室';renderCommandList();const c=commands(),box=message();for(const page of splitMessageIntoPages('関澤「え！？智恵先生が死んだ？？？」\n侯宇帆　木村友紀子　月岡正明\n'.repeat(10))){box.textContent=page;appendCursor(box);if(box.scrollHeight>box.clientHeight||box.scrollWidth>box.clientWidth)throw Error('message overflow');}return {loaded:document.fonts.check('16px "BestTen"'),family:getComputedStyle(box).fontFamily,commandsFit:c.scrollHeight<=c.clientHeight,buttons:[...c.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth};});
 if(!r.loaded||!r.family.includes('BestTen')||!r.commandsFit||r.buttons.some(h=>h!==34)||r.overflow)throw Error(JSON.stringify(r));
 console.log(width,height,'PASS loaded webfont, eight commands, text pages');
 if(width===852){await p.evaluate(()=>{Game.place='801教室';updatePlace();showText('関澤「え！？智恵先生が死んだ？？？」');});await p.waitForFunction(()=>!typing);await p.screenshot({path:'/private/tmp/adv3-bestten.png'});await p.evaluate(()=>showCredits());await p.waitForTimeout(2100);await p.screenshot({path:'/private/tmp/adv3-bestten-credits.png'});}
}
if(!fonts)throw Error('WOFF2 was not downloaded over HTTP');
// A missing font must not prevent START from working.
await p.route('**/Best10-FONT/*',r=>r.abort());await p.goto(url);await p.locator('.start').click();await p.waitForFunction(()=>Game.started);if(errors.length)throw Error(errors.join());console.log('PASS failed font fallback; no JS errors');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
