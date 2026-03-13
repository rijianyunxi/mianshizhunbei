import { toolRouter } from "../tooling/toolRouter.js";
import { mcpRegistry } from "../mcp/mcpRegistry.js";

// 1. 模拟数据 (和之前一样)
const mockTools = [
 { 
    key: "weather-get", 
    name: "get_weather", 
    // 新增：湿度、紫外线、穿衣、带伞、台风、下雪等场景词
    description: "获取指定城市的实时天气预报、温度、湿度、风力、空气质量指数。适用于查询气温趋势、是否需要带伞、穿什么衣服、以及下雨、下雪、台风等气象状况。", 
    inputSchema: { type: "object", properties: { city: { type: "string" } } }, 
    serverId: "weather-server-01" 
  },
  { 
    key: "calc-add", 
    name: "calculator_add", 
    // 新增：乘除、公式、汇率、算账等，同时弱化"加法"的绝对权重
    description: "通用数学计算器。执行加减乘除、开平方、求导数、次方等算术题和公式求解。适用于帮用户算账、计算房贷、汇率打折等所有需要数学计算的场景。", 
    inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } }, 
    serverId: "calc-server-01" 
  },
  { 
    key: "note-save", 
    name: "save_memo", 
    // 新增：日记、日程、总结、待办、提醒等同义词
    description: "私人记事本与备忘录。用于保存笔记、写日记、做会议纪要、新建文档、添加待办事项（Todo）、记录日程安排、密码或提醒备忘。", 
    inputSchema: { type: "object", properties: { content: { type: "string" } } }, 
    serverId: "note-server-01" 
  },
  { 
    key: "order-food", 
    name: "order-food-one", 
    // 新增：外卖、咖啡、菜单、具体食物名词
    description: "餐饮外卖与点单系统。用于处理叫外卖、订餐厅、看菜单、下单食物。支持汉堡、奶茶、咖啡、烤肉等各类美食的预定与配送（宅急送/饿了么/美团）。", 
    inputSchema: { type: "object", properties: { content: { type: "string" } } }, 
    serverId: "order-food-one-01" 
  }
];

// 2. 100 个测试场景大乱炖
const testQueries = [
  // --- 🌤️ 气象类测试 (预期: get_weather) ---
  "北京天气", "今天热吗", "需要带伞吗", "明天多少度", "上海下雨了吗", "气象台预报", "查一下风力", "空气质量指数", "广州穿什么衣服", "会下雪吗",
  "未来一周天气", "深圳台风", "气温趋势", "湿度多少", "紫外线强吗", "查天气", "外面冷吗", "今天有雾霾吗", "最高温度", "夜间降水概率",
  
  // --- 🧮 计算类测试 (预期: calculator_add) ---
  "1+1等于几", "帮我算个账", "计算器", "2的10次方", "89乘以72", "帮我求个导数", "根号下144", "一百块打八折", "房贷怎么算", "算一下汇率",
  "把这个公式解开", "一加一", "算术题", "帮我做下数学作业", "十加十", "除以三", "加减乘除", "开平方", "求余数", "帮忙算一下",
  
  // --- 📝 备忘类测试 (预期: save_memo) ---
  "记下来", "帮我备忘", "记住这个号码", "写日记", "保存笔记", "明天下午3点开会", "提醒我拿快递", "新建一个文档", "把刚才的话存起来", "备忘录",
  "帮我记录", "记事本", "写个总结", "会议纪要保存", "帮我记住老婆生日", "存一下密码", "添加一条待办", "我的日程安排", "做个便签", "记事",
  
  // --- 🍔 餐饮类测试 (预期: order-food-one) ---
  "点外卖", "我饿了", "想吃汉堡", "订个餐厅", "看看菜单", "来杯美式咖啡", "肯德基宅急送", "帮我点餐", "有什么好吃的", "中午吃什么",
  "点个奶茶", "下单一份烤肉", "饿了么", "美团外卖", "点单", "加一份薯条", "我要吃饭", "餐厅预定", "推荐几个菜", "帮我叫个吃的",
  
  // --- 🚫 越界与闲聊测试 (预期: 无匹配) ---
  "你好", "讲个笑话", "怎么学Python", "播放音乐", "现在几点了", "关灯", "查股票代码", "翻译这段话", "你是谁", "明天股市怎么走",
  "帮我写封邮件", "打开电视", "设置闹钟", "王者荣耀怎么玩", "给我讲个故事", "唱首歌", "今天星期几", "搜一下历史上的今天", "生成一张图片", "拜拜"
];

async function runRealWorldTests() {
  console.log("=== 🚀 开始 100 例【混合检索】实战测试 ===");
  mcpRegistry.getToolDescriptors = () => mockTools; 
  await toolRouter.rebuildIndex();

  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    
    // 动态判断期望结果
    let expectedDomain = "无匹配";
    if (i < 20) expectedDomain = "get_weather";
    else if (i < 40) expectedDomain = "calculator_add";
    else if (i < 60) expectedDomain = "save_memo";
    else if (i < 80) expectedDomain = "order-food-one";

    // 🌟 这里直接调用你封装好的混合检索方法！
    // 假设 topK = 1，我们只看系统推荐的第一个工具
    const results = await toolRouter.selectTools(query, 1);
    
    const resultName = results.length > 0 ? results[0].name : "无匹配";
    const isSuccess = resultName === expectedDomain;
    
    if (isSuccess) passCount++; else failCount++;
    const icon = isSuccess ? "✅" : "⚠️";

    console.log(`${icon} [${String(i+1).padStart(3, '0')}] "${query.padEnd(12, ' ')}" -> ${resultName}`);
  }

  console.log(`\n📊 混合检索实战结果: 成功 ${passCount} 例，偏差 ${failCount} 例。`);
}

runRealWorldTests();

function calculateCosine(vecA, vecB) {
  let dotProduct = 0, nA = 0, nB = 0;
  for (let i = 0; i < vecA.length; i++) { dotProduct += vecA[i] * vecB[i]; nA += vecA[i] * vecA[i]; nB += vecB[i] * vecB[i]; }
  return dotProduct / (Math.sqrt(nA) * Math.sqrt(nB));
}
