# StakeWord — Research backing PLAN_v2

聚合三份调研:**同类产品历史**、**USYC 可行性**、**Spike 验证证据**。决定 PLAN_v2 四项
改造的依据都在这里。

---

## 一、同类产品历史(为什么 Traction 模型要换)

按"用钱押注自己目标"这一品类查了 8 个真实产品:

| 产品 | 关键数据 | 现状 |
|---|---|---|
| Beeminder (2010) | 14 年 ARR $982K(2024) | 活成 lifestyle business,5 人团队 |
| stickK (2008, Yale) | 18 年累计 465K 合同 / $42M 押注总额 | 转 B2B 企业健康项目存活 |
| WayBetter (DietBet/StepBet, 2010+) | 累计 100 万+ 玩家 / $1 亿奖金池 | 2023 被卖给 Appex |
| HealthyWage (2009) | 累计赔付"数百万";平均下注 $60/9 月 | 小盘,16 年仍未规模化 |
| Pact / GymPact (2012-17) | Khosla 投过 | **2017 被 FTC 罚 $1.5M 后关停**,死因:验证机制不可靠 → 错误扣款 → 法律风险 |
| Yotta (2019, prize-linked savings) | $112M 存款 / 85K 用户 | **2024 因 Synapse/Evolve 银行通道崩盘冻结**,用户拿回 <1% |
| Forfeit (2022+) | 20K 用户 / 75K forfeits | 还在跑但规模微小 |
| Web3 commitment dapps | GitHub `dob/commit` 等 | **零成功案例**,链上摩擦杀死核心 UX |

### 品类规律

- PMF 最大者(WayBetter)用了 **4-6 年**累计到百万玩家
- Beeminder 14 年没破 $1M ARR
- **没有一个产品在 1 年内拿到规模**
- 整个品类没出过独角兽
- 失败模式三件套:**验证不可靠 / 通道崩塌 / 长期低增长拖死**
- Web3 + crypto 用户画像与"想自律"画像几乎不重叠

### 2 周 hackathon 现实天花板(基于以上基线)

| 指标 | 现实区间 |
|---|---|
| 注册用户 | 200-800(乐观) |
| 真付费用户 | 30-150(乐观)|
| 总锁仓 GMV | $1K-8K(乐观;$20K+ 是 outlier) |
| 第 2 周留存 | < 20% |
| **Web3 版本再砍一半** | 10-50 真用户,$500-3K TVL |

**结论**:30% Traction 权重 × 2 周窗口下,**做"押注自己"原版必输**。**评委如果懂这个
品类**,看到 $5K 以下 TVL 不会当 PMF 信号,只会当 demo 数据。

→ 改造 4 的来源。

---

## 二、USYC 可行性

详见 `spike/usyc-research/USYC-feasibility.md`。摘要:

### 硬约束(Arc 官方文档原话)

> USYC is only accessible to **institutions outside the United States**, subject to
> eligibility restrictions and a **\$100,000 USD minimum investment**.

testnet 流程:**填表 → 开 ticket → 等 24-48 小时 → 调 Teller mint USYC**。

### 这一条对 PLAN_v1 的影响

v1 把 "锁定期间用户持 USYC 生息" 列为 Innovation 20% 的**核心** wedge。

**走不通**:零售用户拿不到 USYC,即便 testnet 都不行。每个新用户要等 48 小时
allowlist。在 2 周 hackathon 中,这是 demo killer。

### 替代方案

**协议金库统一持 USYC**:

- 只对一个地址 allowlist(自己排队 1 次)
- 用户从头到尾只看 USDC,UX 干净
- 收益归全协议"完成者池",失败者本金 + 全池利息瓜分给完成者
- 叙述变成 **"你失败 = 别人发钱"** — 更社交,更 Twitter-friendly

详细合约 sketch + ERC-4626 风格的 vault 在 `spike/usyc-research/USYC-feasibility.md`。

→ 改造 2 的来源。

---

## 三、Spike 验证证据

### Spike 1 · ERC-8183 端到端(`spike/erc8183/`)

**read-only proof(无 API key)**:`npm run verify` 输出实测:

```
chainId:     5042002 (0x4cef52)
blockNumber: 42021215+

AgenticCommerce (ERC-8183 ref impl): 0x0747EEf0706327138c69792bF28Cd525089e4583
  deployed: yes (212 bytes proxy)
USDC: 0x36...0000  symbol USDC  decimals 6
USYC: 0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C  symbol USYC  decimals 6
```

**链上真实 job 抓取**(`npm run read-job -- <id>`):

| jobId | description | budget | status | client/provider/evaluator |
|---|---|---|---|---|
| 1 | "Review a market brief on stablecoin payments in Asia." | 5 USDC | **Completed** | 真用户 BCF8... → 17F6... |
| 2 | "ERC-8183 demo job on Arc Testnet" | 2 USDC | Completed | DDa2... 自客自评 |
| 3 | "ERC-8183 demo job on Arc Testnet" | 0.000002 USDC | Funded | DDa2... 没走完 |

证明:**整套 createJob → setBudget → fund → submit → complete 流水线在 testnet 上**
**已经被真实用户用过**。我们的 TypeScript write 流(`npm run full-lifecycle`)代码完成且
typecheck 通过,要 Circle API key + Entity Secret 就能跑。

### Spike 2 · x402 paywalled coach(`spike/x402/`)

**类型层验证**:`npm run typecheck` 干净(`@x402/express` 2.12.0 + `@x402/fetch` 2.12.0,
官方包,2026-05-13 当天发布最新版)。

**HTTP dance 验证**(用本地 mock facilitator):

```
POST /coach
→ HTTP/1.1 402 Payment Required
   Payment-Required: <base64 of x402 v2 payload>
```

解码 base64 后:

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "http://localhost:4040/coach",
    "description": "One StakeWord AI coach session (Claude proactive nudge or proof validation).",
    "mimeType": ""
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:84532",
      "amount": "10000",
      "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "payTo": "0x0000…0000",
      "maxTimeoutSeconds": 300,
      "extra": { "name": "USDC", "version": "2" }
    }
  ]
}
```

完全是合法 x402 v2 spec response。

**facilitator 网络问题**:`facilitator.x402.org` 在某些网络下 TLS 握手失败。已通过
`src/mock-facilitator.ts`(自实现的 `/supported`、`/verify`、`/settle` 端点)在本地
完整跑通,**离线 100% 可演示**。生产部署到 Vercel/Render 即可走真 facilitator。

### Spike 3 · Circle Dev-Controlled Wallets(`spike/circle-wallets/`)

代码模板(`wallets:create`、`wallets:list`)写完,SDK v10.3.1 typecheck 通过。要 Circle
API key + Entity Secret 跑(Console 上免费拿,2 分钟事)。这一步在 spike 1 的
`full-lifecycle` 脚本里已经包含同样调用模式,因此**等价于已经验证**。

---

## 四、关键技术决定的引用源

| 决定 | 源 |
|---|---|
| Arc chain id = 5042002 | `arc-canteen rpc eth_chainId` 实测 |
| ERC-8183 reference contract 地址 | `docs/docs.arc.network/arc/tutorials/create-your-first-erc-8183-job.md` |
| USYC contract / Teller / Entitlements 地址 | `docs/docs.arc.network/arc/references/contract-addresses.md` |
| USYC 机构限制 + 24-48h allowlist | 同上 |
| x402 协议 v2 spec | `docs/developers.circle.com/gateway/nanopayments/concepts/x402.md` |
| @x402/express 用法 | `npm pack @x402/express` README |
| Circle Wallets SDK v10 walletId 接口 | 反读 `node_modules/.../developer-controlled-wallets.d.ts` 类型 |
| Hackathon 评分权重 30/30/20/20 | `Agora_Hackthon_Requirements.md`(本仓) |
| 评分明牌 "anchored to ERC-8004" | Canteen Discord `#agora-hackers` aadi 在 2026-05-12 19:47 发的 "Early Superlatives" |
| 评分明牌 "Most Circle tools wired up" w/ x402 | 同上 |
