import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let page = null;

let loading = false;

let resMsg = '';

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(StealthPlugin());

// 随机数生成
const generateRandomInRange = (min, max) => {
  if (max === undefined) {
    max = min * 1.3;
    min = min * 0.7;
  }
  return Math.random() * (max - min) + min;
};

// 发送问题
export const sendMSG = async (msg) => {
  console.log(msg);

  const textareaId = 'prompt-textarea'; // replace with the actual ID

  await page.fill(`#${textareaId}`, msg);
  await page.waitForTimeout(1000);
  // 点击 prompt-textarea 的下一个兄弟 button 元素
  await page.click(`#${textareaId} + button`);

  loading = true;

  while (loading) {
    await new Promise((s) => setTimeout(() => s(), 1000));
  }

  return resMsg;
};

export const getStatus = () => {
  let code = 666;
  if (loading === true) {
    code = 888;
  }

  return {
    code,
  };
};

const checkAndPrintMarkdown = async () => {
  let previousContent = '';

  while (true) {
    // 获取页面上所有有特定类名的元素
    const elements = await page.$$(`.markdown`);
    // 取最后一个元素
    const lastElement = elements[elements.length - 1];
    // 在最后一个元素上获取所有 p 和 pre 标签的文本，并用换行符连接
    let currentContent = '';

    try {
      currentContent = await lastElement.$$eval('p, pre', (elements) =>
        elements.map((el) => el.textContent).join('\n')
      );
    } catch (error) {
      return '';
    }

    if (currentContent !== previousContent) {
      previousContent = currentContent;
    } else {
      console.log(previousContent);
      return previousContent;
    }

    await new Promise((s) => setTimeout(() => s(), 6000));
  }
};

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    javascriptEnabled: true,
  });

  // 如果存在保存的 cookies，加载它们
  const cookiesPath = path.resolve(__dirname, 'cookies.json');
  let cookiesArray = [];
  if (fs.existsSync(cookiesPath)) {
    try {
      cookiesArray = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
      if (Array.isArray(cookiesArray) && cookiesArray.length > 0) {
        await context.addCookies(cookiesArray[cookiesArray.length - 1]); // 只加载最后一组cookies
      }
    } catch (e) {
      console.error(`Failed to parse cookies file: ${e}`);
      // Handle error as needed, e.g., by initializing cookiesArray to a default value
      cookiesArray = [];
    }
  }

  page = await context.newPage();

  // 监听 URL 变化事件
  page.on('framenavigated', async () => {
    // 保存 cookies
    const cookies = await context.cookies();
    cookiesArray.push(cookies);
    if (cookiesArray.length > 10) {
      cookiesArray = cookiesArray.slice(-10); // 仅保留最后10个cookies
    }
    fs.writeFileSync(cookiesPath, JSON.stringify(cookiesArray));
  });

  page.on('request', async (request) => {
    if (
      request.url() === 'https://chat.openai.com/backend-api/conversation' &&
      request.method() === 'POST'
    ) {
      console.log('开始回复...');
      loading = true;
      await page.waitForTimeout(5000);
      // 监听dom没有变化后 执行checkAndPrintMarkdown
      resMsg = await checkAndPrintMarkdown(page);
      loading = false;
    }
  });

  console.log('加载中.....');

  await page.goto('https://chat.openai.com/'); // 你的登录页面 URL
  await page.waitForTimeout(5000);
  // 这里添加你的登录操作，例如填写表单，点击按钮等

  await page.click('button.btn:has-text("Next")');
  await page.waitForTimeout(generateRandomInRange(600));
  await page.click('button.btn:has-text("Next")');
  await page.waitForTimeout(generateRandomInRange(600));
  await page.click('button.btn:has-text("Done")');

  console.log('准备就绪');
  await browser.close();
})();
