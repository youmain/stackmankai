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
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  console.log('⏳ ページの読み込み完了を待機...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // ステップ2（プリフロップ）に移動
  console.log('📱 プリフロップステップに移動中...');
  
  // ステップ2のボタンを見つけてクリック
  const step2Button = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn => {
      const text = btn.textContent || '';
      // ステップ番号2のボタンを探す（プリフロップ）
      return text.trim() === '2' || text.includes('プリフロップ');
    });
  });
  
  if (step2Button) {
    await step2Button.click();
    console.log('✅ ステップ2ボタンをクリック');
  }
  
  console.log('⏳ テーブル視覚化の読み込みを待機...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // テーブルが表示されるまで待機
  await page.waitForSelector('svg, canvas, .poker-table', { timeout: 10000 }).catch(() => {
    console.log('⚠️ テーブル要素が見つかりませんでしたが、スクリーンショットを撮影します');
  });
  
  console.log('✅ プリフロップのスクリーンショット取得（フルページ）');
  await page.screenshot({ 
    path: '/home/ubuntu/stackmankai/mobile_table_full.png',
    fullPage: true
  });
  
  console.log('✅ プリフロップのスクリーンショット取得（ビューポートのみ）');
  await page.screenshot({ 
    path: '/home/ubuntu/stackmankai/mobile_table_viewport.png',
    fullPage: false
  });
  
  // フロップにも移動
  console.log('📱 フロップステップに移動中...');
  const step3Button = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn => {
      const text = btn.textContent || '';
      return text.trim() === '3' || text.includes('フロップ');
    });
  });
  
  if (step3Button) {
    await step3Button.click();
    console.log('✅ ステップ3ボタンをクリック');
  }
  
  console.log('⏳ フロップのテーブル視覚化の読み込みを待機...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('✅ フロップのスクリーンショット取得');
  await page.screenshot({ 
    path: '/home/ubuntu/stackmankai/mobile_table_flop.png',
    fullPage: true
  });
  
  console.log('✅ スクリーンショット保存完了！');
  console.log('   - /home/ubuntu/stackmankai/mobile_table_full.png (プリフロップ・フルページ)');
  console.log('   - /home/ubuntu/stackmankai/mobile_table_viewport.png (プリフロップ・ビューポート)');
  console.log('   - /home/ubuntu/stackmankai/mobile_table_flop.png (フロップ・フルページ)');
  
  await browser.close();
})();
