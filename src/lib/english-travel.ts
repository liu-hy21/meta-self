export type TravelPhrase = { en: string; zh: string; role?: "me" | "staff" };

export type TravelTopic = { id: string; title: string; phrases: TravelPhrase[] };

export type TravelScene = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  place: string;
  topics: TravelTopic[];
};

export const travelScenes: TravelScene[] = [
  {
    id: "hotel",
    index: "01",
    title: "酒店入住",
    subtitle: "入住手续、退房时间与离店办理",
    place: "Hotel Front Desk",
    topics: [
      {
        id: "booking",
        title: "确认订单日期",
        phrases: [
          { role: "me", en: "Hi, I'd like to check in. I have a reservation under Liu.", zh: "你好，我要办理入住，预订人姓刘。" },
          { role: "me", en: "Could you confirm my dates? I'm staying from the 20th to the 23rd.", zh: "能帮我确认一下日期吗？我住 20 号到 23 号。" },
          { role: "staff", en: "May I see your passport and booking confirmation?", zh: "可以看一下您的护照和预订确认单吗？" },
          { role: "me", en: "Is breakfast included in my booking?", zh: "我的预订包含早餐吗？" },
        ],
      },
      {
        id: "luggage",
        title: "寄存行李",
        phrases: [
          { role: "me", en: "I'm a bit early. Can I leave my luggage here?", zh: "我来早了，可以把行李寄存在这里吗？" },
          { role: "me", en: "What time will the room be ready?", zh: "房间什么时候能准备好？" },
          { role: "staff", en: "Here's your luggage tag. Please keep it.", zh: "这是您的行李牌，请保管好。" },
          { role: "me", en: "Can I store my bags after check-out too?", zh: "退房后也可以寄存行李吗？" },
        ],
      },
      {
        id: "wifi",
        title: "问 Wi-Fi 密码",
        phrases: [
          { role: "me", en: "What's the Wi-Fi password, please?", zh: "请问 Wi-Fi 密码是多少？" },
          { role: "me", en: "Which network should I connect to?", zh: "我应该连哪个网络？" },
          { role: "me", en: "The Wi-Fi isn't working in my room.", zh: "我房间的 Wi-Fi 连不上。" },
        ],
      },
      {
        id: "checkout",
        title: "退房时间确认",
        phrases: [
          { role: "me", en: "What time is check-out?", zh: "几点退房？" },
          { role: "me", en: "Is late check-out possible? Maybe until 2 p.m.?", zh: "可以延迟退房吗？比如到下午两点？" },
          { role: "staff", en: "Late check-out is free until 1 p.m.", zh: "下午一点前延迟退房免费。" },
          { role: "me", en: "Do I just leave the key card in the room?", zh: "房卡留在房间里就可以吗？" },
        ],
      },
      {
        id: "checkout-leave",
        title: "退房办理",
        phrases: [
          { role: "me", en: "Hi, I'd like to check out, please.", zh: "你好，我要退房。" },
          { role: "me", en: "I'm in room 1208. The name is Liu.", zh: "我住 1208 房，姓刘。" },
          { role: "staff", en: "Did you take anything from the minibar?", zh: "您用过迷你吧里的东西吗？" },
          { role: "me", en: "No, I didn't use the minibar.", zh: "没有，我没用过迷你吧。" },
          { role: "me", en: "Could I have the bill, please?", zh: "可以给我账单吗？" },
          { role: "me", en: "Is everything included, or are there extra charges?", zh: "费用都含在房费里了吗？还有额外收费吗？" },
          { role: "me", en: "Can I pay with this card?", zh: "可以用这张卡付吗？" },
          { role: "staff", en: "We'll release the deposit back to your card within a few days.", zh: "押金会在几天内退回您的卡上。" },
          { role: "me", en: "Could you call a taxi for me?", zh: "能帮我叫一辆出租车吗？" },
          { role: "me", en: "Here's my key card.", zh: "房卡给您。" },
        ],
      },
      {
        id: "info",
        title: "提供我的信息",
        phrases: [
          { role: "me", en: "Here's my passport.", zh: "这是我的护照。" },
          { role: "me", en: "My phone number is …, and my email is ….", zh: "我的电话是……，邮箱是……。" },
          { role: "staff", en: "We'll need a credit card for the deposit.", zh: "我们需要一张信用卡做押金。" },
          { role: "me", en: "How much is the deposit, and when will it be refunded?", zh: "押金多少？什么时候退还？" },
        ],
      },
    ],
  },
  {
    id: "mango",
    index: "02",
    title: "Mango 购物",
    subtitle: "逛 Mango 门店，试穿、结账、退税",
    place: "Mango Store",
    topics: [
      {
        id: "browse",
        title: "进店观看",
        phrases: [
          { role: "staff", en: "Hi, can I help you find anything?", zh: "你好，需要帮您找什么吗？" },
          { role: "me", en: "I'm just looking, thanks.", zh: "我先随便看看，谢谢。" },
          { role: "me", en: "Do you have this in a different color?", zh: "这件有别的颜色吗？" },
          { role: "me", en: "Where can I find the new arrivals?", zh: "新品在哪里？" },
        ],
      },
      {
        id: "fitting",
        title: "试衣间",
        phrases: [
          { role: "me", en: "Where's the fitting room?", zh: "试衣间在哪里？" },
          { role: "me", en: "Can I try this on?", zh: "我可以试一下这件吗？" },
          { role: "me", en: "Do you have this in a size M?", zh: "这件有 M 码吗？" },
          { role: "me", en: "It's a bit tight. Do you have a bigger size?", zh: "有点紧，有大一号的吗？" },
        ],
      },
      {
        id: "pay",
        title: "价格 / 结账 / 免税",
        phrases: [
          { role: "me", en: "How much is this?", zh: "这件多少钱？" },
          { role: "me", en: "Is this on sale?", zh: "这件在打折吗？" },
          { role: "me", en: "Can I pay by card?", zh: "可以刷卡吗？" },
          { role: "me", en: "Can I get a tax-free form, please?", zh: "可以给我开退税单吗？" },
          { role: "staff", en: "The minimum for tax-free is 100 euros.", zh: "满 100 欧元才可以退税。" },
        ],
      },
      {
        id: "collab",
        title: "联名款",
        phrases: [
          { role: "me", en: "Do you have the new collaboration collection?", zh: "你们有新的联名系列吗？" },
          { role: "me", en: "Is the limited edition still available?", zh: "限量款还有货吗？" },
          { role: "me", en: "Could you check if another store has it?", zh: "能帮我查一下别的店有没有货吗？" },
        ],
      },
    ],
  },
  {
    id: "reservation",
    index: "03",
    title: "确认预约",
    subtitle: "打电话或到店确认预约信息",
    place: "Reservation",
    topics: [
      {
        id: "confirm",
        title: "确认预约信息",
        phrases: [
          { role: "me", en: "Hi, I'd like to confirm my reservation.", zh: "你好，我想确认一下我的预约。" },
          { role: "me", en: "It's under the name Liu, for two people at 7 p.m.", zh: "预约人姓刘，两位，晚上七点。" },
          { role: "staff", en: "Could you spell your last name, please?", zh: "请拼一下您的姓氏好吗？" },
          { role: "me", en: "Can I change it to 8 p.m.?", zh: "可以改到晚上八点吗？" },
          { role: "me", en: "Could you send me a confirmation email?", zh: "可以给我发一封确认邮件吗？" },
        ],
      },
    ],
  },
  {
    id: "dining",
    index: "04",
    title: "吃饭",
    subtitle: "点餐时要酱料、蘸料怎么说",
    place: "Restaurant",
    topics: [
      {
        id: "dips",
        title: "各种蘸料",
        phrases: [
          { role: "me", en: "Could I have some dipping sauce, please?", zh: "可以给我一些蘸料吗？" },
          { role: "me", en: "What sauces do you have?", zh: "你们有哪些酱？" },
          { role: "me", en: "Could I get extra soy sauce?", zh: "可以多给我一点酱油吗？" },
          { role: "me", en: "Is there chili sauce or sriracha?", zh: "有辣椒酱或是拉差吗？" },
          { role: "me", en: "Could I have vinegar and chili oil on the side?", zh: "醋和辣椒油可以分开给我吗？" },
          { role: "me", en: "Do you have wasabi and soy sauce for the sushi?", zh: "寿司有芥末和酱油吗？" },
          { role: "me", en: "I'd like ketchup and mustard, please.", zh: "我要番茄酱和芥末酱。" },
          { role: "me", en: "Is this peanut sauce? I'm allergic to peanuts.", zh: "这是花生酱吗？我对花生过敏。" },
          { role: "me", en: "Could I have sweet chili sauce?", zh: "有甜辣酱吗？" },
          { role: "me", en: "A little more garlic sauce, please.", zh: "蒜蓉酱再给我一点。" },
        ],
      },
    ],
  },
  {
    id: "lv",
    index: "05",
    title: "LV 买护照夹",
    subtitle: "路易威登门店选购与退税",
    place: "Louis Vuitton",
    topics: [
      {
        id: "open",
        title: "基础开口",
        phrases: [
          { role: "staff", en: "Good afternoon. How may I help you today?", zh: "下午好，今天需要什么帮助？" },
          { role: "me", en: "Hi, I'm looking for a passport holder.", zh: "你好，我想看护照夹。" },
          { role: "me", en: "I'm just browsing, but I'd like to see your small leather goods.", zh: "我先看看，想了解一下小皮具。" },
          { role: "me", en: "Do I need to queue, or can I walk in?", zh: "需要排队吗，还是可以直接进？" },
        ],
      },
      {
        id: "styles",
        title: "问款式",
        phrases: [
          { role: "me", en: "Do you have this in monogram and in black?", zh: "这款有老花和黑色吗？" },
          { role: "me", en: "What's the difference between these two models?", zh: "这两款有什么区别？" },
          { role: "me", en: "Is this the latest season?", zh: "这是本季新款吗？" },
          { role: "me", en: "Do you have anything slimmer? I need it for travel.", zh: "有更薄一点的吗？我旅行用。" },
          { role: "staff", en: "This one is in stock. The other color is available at the airport store.", zh: "这款有货，另一个颜色在机场店有。" },
        ],
      },
      {
        id: "buy",
        title: "确定购买",
        phrases: [
          { role: "me", en: "I'll take this one, please.", zh: "我就要这个。" },
          { role: "me", en: "How much is it in total?", zh: "一共多少钱？" },
          { role: "me", en: "Can I pay by card?", zh: "可以刷卡吗？" },
          { role: "me", en: "Could I have a gift box, please?", zh: "可以帮我装礼盒吗？" },
          { role: "staff", en: "Would you like the receipt in your name?", zh: "收据需要开您的名字吗？" },
        ],
      },
      {
        id: "hotstamp",
        title: "可以烫印吗",
        phrases: [
          { role: "me", en: "Can you hot-stamp initials on it?", zh: "可以烫印字母吗？" },
          { role: "me", en: "How many letters can I add?", zh: "最多可以印几个字母？" },
          { role: "me", en: "How long does hot stamping take?", zh: "烫印要多久？" },
          { role: "staff", en: "We can do it now. It takes about fifteen minutes.", zh: "现在就可以做，大约十五分钟。" },
          { role: "me", en: "I'd like gold letters, please.", zh: "我想要金色字母。" },
        ],
      },
      {
        id: "dfs",
        title: "询问 DFS App 作用",
        phrases: [
          { role: "me", en: "What is the DFS app for?", zh: "DFS App 是做什么用的？" },
          { role: "me", en: "Do I need to register on the app to shop here?", zh: "在这里购物需要在 App 上注册吗？" },
          { role: "staff", en: "You can link your passport and track tax-free purchases on the app.", zh: "您可以在 App 上绑定护照并查看免税购物记录。" },
          { role: "me", en: "Can I show my QR code from the app at checkout?", zh: "结账时可以出示 App 里的二维码吗？" },
        ],
      },
      {
        id: "taxfree",
        title: "问 Tax Free 的事",
        phrases: [
          { role: "me", en: "Can I get tax-free on this purchase?", zh: "这件可以退税吗？" },
          { role: "me", en: "I'm a tourist. What documents do I need?", zh: "我是游客，需要什么证件？" },
          { role: "me", en: "Where do I get the tax refund stamped?", zh: "退税章在哪里盖？" },
          { role: "staff", en: "We'll give you the tax-free form with your receipt.", zh: "我们会把退税单和收据一起给您。" },
          { role: "me", en: "Is the refund at the airport or back to my card?", zh: "退税在机场领还是退到卡上？" },
        ],
      },
      {
        id: "pickup",
        title: "来取昨天的货",
        phrases: [
          { role: "me", en: "Hi, I'm here to pick up an item I paid for yesterday.", zh: "你好，我来取昨天买好的货。" },
          { role: "me", en: "The name is Liu. Here's my receipt.", zh: "姓刘，这是我的收据。" },
          { role: "staff", en: "One moment, I'll get it from the back.", zh: "请稍等，我去库房拿。" },
          { role: "me", en: "Could you check if the hot stamping is done?", zh: "能帮我看一下烫印做好了吗？" },
          { role: "me", en: "I was told to collect it today after 3 p.m.", zh: "他们说今天下午三点后可以取。" },
        ],
      },
    ],
  },
  {
    id: "chanel",
    index: "06",
    title: "香奈儿买 Gloss",
    subtitle: "唇釉 / 唇蜜选购与试色",
    place: "Chanel Beauty",
    topics: [
      {
        id: "open",
        title: "基础开口",
        phrases: [
          { role: "me", en: "Hi, I'm looking for a lip gloss.", zh: "你好，我想看唇釉 / 唇蜜。" },
          { role: "me", en: "Do you have the Coco Gloss line?", zh: "有 Coco Gloss 系列吗？" },
          { role: "staff", en: "Sure. Which shade are you interested in?", zh: "好的，您想看哪个色号？" },
        ],
      },
      {
        id: "shade",
        title: "问色号 / 试色",
        phrases: [
          { role: "me", en: "What shades do you have in stock?", zh: "现在有哪些色号有货？" },
          { role: "me", en: "I'd like something natural, not too pink.", zh: "我想要自然一点的，不要太粉。" },
          { role: "me", en: "Can I try this on?", zh: "可以试色吗？" },
          { role: "me", en: "Do you have a tester for this color?", zh: "这个颜色有试用装吗？" },
          { role: "staff", en: "I'll apply a little on the back of your hand.", zh: "我在您手背上试一点。" },
        ],
      },
      {
        id: "buy",
        title: "确定购买",
        phrases: [
          { role: "me", en: "I'll take this shade, please.", zh: "我就要这个色号。" },
          { role: "me", en: "Is this the full size or a mini?", zh: "这是正装还是小样？" },
          { role: "me", en: "Could I get a bag, please?", zh: "可以给我一个袋子吗？" },
        ],
      },
      {
        id: "gift",
        title: "礼盒 / 刻字",
        phrases: [
          { role: "me", en: "Is gift wrapping available?", zh: "可以包礼物吗？" },
          { role: "me", en: "Do you offer engraving on the case?", zh: "外壳可以刻字吗？" },
        ],
      },
    ],
  },
];
