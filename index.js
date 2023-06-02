import express from 'express';
import { sendMSG, getStatus } from './src/gptPlayWright/index.js';
import weBot from './src/weBot/index.js';
const app = express();
const port = 3000;

app.use(express.json()); // Parse JSON bodies for this app. Make sure you put it above your routes.

app.post('/api/send-message', async (req, res) => {
  const { message } = req.body; // 你可以通过POST请求的body发送消息

  if (!message) {
    res.status(400).send({ error: 'Message is required' });
    return;
  }

  const resMsg = await sendMSG(message);

  res.send({ resMsg });
});

app.get('/api/send-message', async (req, res) => {
  // 通过查询参数获取 message
  const message = req.query.message;

  // 确保 message 参数存在
  if (!message) {
    return res.status(400).send({ error: 'Message parameter is required' });
  }
  const resMsg = await sendMSG(message);
  // 将 message 返回作为响应
  res.send({ resMsg });
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
