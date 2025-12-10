const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // iPhone 12 Proのビューポート設定
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  console.log('📱 モバイルビューでページにアクセス中...');
  await page.goto('http://localhost:3000/posts/y0J6HRxysUSNIVHxWbfz', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  console.log('✅ ステップ1のスクリーンショット取得');
  await page.screenshot({ 
    path: '/home/ubuntu/stackmankai/mobile_step1.png',
    fullPage: false
  });
  
  // ステップ2（プリフロップ）に移動
  console.log('📱 プリフロップステップに移動中...');
  const buttons = await page.$$('button');
  // ステップ2のボタンを探す
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && text.includes('2')) {
      await button.click();
      break;
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ プリフロップのスクリーンショット取得');
  await page.screenshot({ 
    path: '/home/ubuntu/stackmankai/mobile_preflop.png',
    fullPage: true
  });
  
  console.log('✅ スクリーンショット保存完了！');
  console.log('   - /home/ubuntu/stackmankai/mobile_step1.png');
  console.log('   - /home/ubuntu/stackmankai/mobile_preflop.png');
  
  await browser.close();
})();
