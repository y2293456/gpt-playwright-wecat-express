# 玩具项目

## 目标不使用apikey调用gpt4接口（太贵）

## 思路
playwright 访问 chatgpt ，调用询问接口的时候，playwright 向 gpt 网页端发出问题请求。等回复完毕后，将消息返回；
服务使用express;
为了方便使用，对接了微信机器人;

## 扩展
因为 gpt-4-mobile 是无限次数的，通过修改发送接口模型，可以实现免费无限使用gpt4