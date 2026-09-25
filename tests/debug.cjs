// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, headless: true});
  try {
    const page = await browser.newPage({hasTouch: true});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    const click = name => page.getByRole('button', {name: `▶ ${name}`, exact: true}).click();
    for (const [width, height] of [[852,393],[667,375],[568,320],[844,390],[932,430],[393,852]]) {
      await page.setViewportSize({width,height});
      await page.goto(url); await click('START');
      const result = await page.evaluate(() => {
        const c=document.querySelector('.commands').getBoundingClientRect();
        const s=document.querySelector('.scene').getBoundingClientRect();
        const m=message().getBoundingClientRect();
        return {right:c.left>=s.right && c.left>=m.right, below:m.top>=s.bottom,
          fits:c.right<=innerWidth && m.bottom<=innerHeight && s.left>=0,
          taps:[...document.querySelectorAll('.command')].every(b=>b.getBoundingClientRect().height>=44),
          count:document.querySelectorAll('.command').length,
          overflow:document.documentElement.scrollWidth>innerWidth};
      });
      assert.deepEqual(result,{right:true,below:true,fits:true,taps:true,count:7,overflow:false});
      await click('もちもの');
      await page.waitForFunction(()=>!typing);
      assert.match(await page.locator('#message').innerText(),/もちものは/);
      await click('ばしょいどう'); await click('904教室');
      await click('しらべる'); await click('ゆか'); await click('とる');
      assert.equal(await page.evaluate(()=>Game.inventory.includes('血の付いたカッター')),true);
      console.log(`PASS ${width}x${height}: right commands, touch targets, movement, take`);
    }
    await page.setViewportSize({width:852,height:393});
    await page.addStyleTag({content:'body { padding: 0 59px 21px; }'});
    await page.evaluate(()=>{
      clearTyping();
      for(const text of splitMessageIntoPages('長いセリフの表示確認です。ABC123。\n\n'.repeat(30))){
        message().textContent=text; appendCursor(message());
        if(message().scrollHeight>message().clientHeight || message().scrollWidth>message().clientWidth) throw Error('Text clipping');
      }
      const c=commands().getBoundingClientRect();
      if(c.right>innerWidth-59 || c.bottom>innerHeight-21)throw Error('Safe area');
    });
    await page.evaluate(()=>{movePlace('801教室');talkPerson('関澤遼','智恵蔵のこと');});
    assert.equal(await page.evaluate(()=>characterTalkTimer!==null),true);
    await click('もちもの');
    assert.equal(await page.evaluate(()=>characterTalkTimer===null),true,'interrupting dialogue must stop mouth animation');
    // Exercise story conditions with the same handlers used by menu buttons.
    await page.evaluate(()=>{
      searchItem('本棚');searchItem('智恵蔵の本棚');takeMenu();
      showItem('関澤遼','赤いUSBメモリ');
      movePlace('901シルク室');talkPerson('侯宇帆','智恵蔵のこと');showItem('侯宇帆','血の付いたカッター');
      movePlace('西神田校舎正門');talkPerson('通行人','気づいたこと');
      if(!Game.flags.kimuraUnlocked)throw Error('Kimura locked');
      movePlace('学生ホール');talkPerson('木村友紀子','智恵蔵のこと');talkPerson('木村友紀子','関澤のこと');
      movePlace('職員室');
    });
    page.once('dialog', d=>d.accept('カメムシ'));
    await page.evaluate(()=>requestUsbPassword());
    assert.equal(await page.evaluate(()=>Game.flags.usbRead),true);
    await page.evaluate(()=>movePlace('801教室'));
    await click('こくはつする');
    // Advance actual ending pages until the credits appear.
    for(let i=0;i<60;i++){
      await page.waitForFunction(()=>!typing);
      if(await page.locator('.credits').count())break;
      assert.equal(await page.evaluate(()=>Boolean(next)),true);
      await page.locator('#message').click();
    }
    assert.equal(await page.locator('.credits').count(),1);
    await page.locator('.credits p').last().scrollIntoViewIfNeeded();
    assert.deepEqual(errors,[]);
    await page.goto(url); await click('START');
    await page.evaluate(()=>{movePlace('801教室');showText('関澤「え！？智恵先生が死んだ？？？」');});
    await page.waitForFunction(()=>!typing);
    await page.screenshot({path:process.env.SCREENSHOT_PATH || '/private/tmp/adv3-right.png'});
    console.log('PASS safe area simulation, long text, interrupted dialogue, story through credits, no JS errors');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
