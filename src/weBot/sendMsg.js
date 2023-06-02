import { sendMSG } from '../gptPlayWright/index.js';
export const aliasWhiteList = ['TEST']; // 对话白名单（微信名）
export const roomWhiteList = []; // 白名单群（微信名）
export const botName = 'Bot'; // 机器人名称（微信名）

function isValidCommand(content) {
  return (
    content.startsWith('? ') ||
    content.startsWith('？ ') ||
    content.startsWith('> ')
  );
}

function withinTimeLimit(msg) {
  return Date.now() - 1e3 * msg.payload.timestamp <= 3000;
}

export async function defaultMessage(msg, bot) {
  const contact = msg.talker(); // 发消息人
  const receiver = msg.to(); // 消息接收人
  const content = msg.text(); // 消息内容
  const room = msg.room(); // 是否是群消息
  const roomName = (await room?.topic()) || null; // 群名称
  const alias = (await contact.alias()) || (await contact.name()); // 发消息人昵称
  const remarkName = await contact.alias(); // 备注名称
  const name = await contact.name(); // 微信名称
  const isText = msg.type() === bot.Message.Type.Text; // 消息类型是否为文本
  const isRoom =
    roomWhiteList.includes(roomName) && content.includes(`${botName}`); // 是否在群聊白名单内并且艾特了机器人
  const isAlias =
    aliasWhiteList.includes(remarkName) || aliasWhiteList.includes(name); // 发消息的人是否在联系人白名单内
  const isBotSelf = botName === remarkName || botName === name; // 是否是机器人自己

  if (isText && !isBotSelf && withinTimeLimit(msg)) {
    if (!isValidCommand(content)) return;

    try {
      const trimed = content.substr(2);
      if (trimed.length < 5) return;

      if (isRoom && room) {
        await room.say(await getReply(trimed.replace(botName, '')));
      } else if (isAlias && !room) {
        await contact.say(await sendMSG(trimed));
      }
    } catch (e) {
      console.error(e);
    }
  }
}
