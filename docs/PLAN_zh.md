# StakeWord 开发计划

> AI 驱动的自合约 ERC-8183 履约协议：你既是 client 又是 provider，Claude 是 evaluator。

---

## 一、产品定位

**世界上第一个自合约 ERC-8183 job 协议** —— 用户向自己的目标押 USDC，**协议金库**用一份机构资格把池子整体放进 USYC 生息，**Claude 作为链上 evaluator** 评判履约结果，**失败者的本金 + 全池利息**自动瓜分给完成者。

**核心亮点：**
- 直接使用 Arc 上已部署的 [`AgenticCommerce`](https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583) ERC-8183 reference implementation 作为履约容器
- Claude 直接调用 `complete(jobId, reasonHash)` 上链，本身就是 evaluator 角色
- 用户使用 Circle Dev-Controlled Wallet（SCA 账户类型，Arc testnet），从头到尾只接触 USDC
- 协议金库统一持有 USYC，单点 allowlist，收益归赛季完成者池瓜分
- 每次 Claude 教练推送或验证通过 x402 收取小额 USDC，形成可展示的真实交易数据
- 同类承诺 2-3 人互评，降低单一 AI 视觉验证被作弊的风险

---

## 二、核心用户流程

```
1. 注册 → Circle Dev-Controlled Wallet 自动创建（SCA on ARC-TESTNET）
2. 描述目标 → Claude 多轮对话生成可验证条款 + 承诺文本
3. 锁仓：
   3a. 用户 USDC approve → AgenticCommerce.createJob(provider=self, evaluator=ClaudeOracle, description=...)
   3b. provider（=self）调用 setBudget(jobId, stake)
   3c. client（=self）调用 fund(jobId) → Job 进入 Funded 状态
   3d. 协议把池里 USDC pool → USYC（只 vault 地址做，用户无感）
4. 履约期：
   4a. Claude 主动推送/教练对话 → 每次走 x402 收 $0.01 USDC
   4b. 用户上传证据 → Claude vision 验证 → 通过则记一次进度
   4c. 满足完成条件 → provider 调 AgenticCommerce.submit(jobId, deliverableHash)
   4d. evaluator（Claude 钱包）调 complete(jobId, reasonHash)
5. 结算：
   5a. 成功 → 用户拿回本金 + 完成者池分得的利息
   5b. 失败 → 本金留在协议金库，赛季末按完成次数比例瓜分给成功者
6. 链上身份：
   每个用户的钱包地址 + ERC-8183 job 历史 = 公开履约档案
```

---

## 三、关键设计

### 设计 1 · ERC-8183 reference contract 作为履约容器

Arc testnet 上已部署的 `AgenticCommerce` 合约作为核心履约容器：

- 合约地址：`0x0747EEf0706327138c69792bF28Cd525089e4583`
- `spike/erc8183/` 已验证 Arc testnet chain `5042002` 在线，USDC/USYC 均响应 ERC-20 调用
- `npm run read-job -- 1` 可读到真实链上 job，包含 Completed/Funded 状态样例
- ABI、`createJob`、`setBudget`、`fund`、`submit`、`complete`、`getJob` 流水线 TypeScript 已写完，并通过 `tsc --noEmit`

| ERC-8183 字段 | StakeWord 语义 |
|---|---|
| `client` | 用户（出钱） |
| `provider` | 用户自己（履约） |
| `evaluator` | Claude oracle 钱包（平台一个 share 给所有 job） |
| `description` | 自然语言承诺文本 |
| `deliverable` (`bytes32`) | `keccak256(证据包 + 时间戳)` |
| `reason` (`bytes32`) | `keccak256(Claude 验证报告)` |
| `Job.status` | Open → Funded → Submitted → Completed/Rejected/Expired |

### 设计 2 · 协议金库统一持有 USYC

USYC 是机构许可类资产，起步门槛高，并且需要 24-48 小时 allowlist 审核。StakeWord 不把 USYC 暴露给普通用户，而是由协议金库统一处理。

```
用户：  USDC ──→ 协议 EscrowVault ──→ AgenticCommerce.fund()
                       │
                       └── Vault 统一（单点 allowlist）→ USYC ──── 生息
                                                          │
                          完成时：用户拿 USDC              │
                          失败时：本金留入“完成者池”      │
                          赛季末：利息 + 失败本金按完成数瓜分 ┘
```

**好处：**
- 只需要给 vault 一个地址过 allowlist
- 用户从头到尾只看见 USDC，UX 干净
- 产品叙事更直接：“你失败 = 别人发钱”

### 设计 3 · x402 AI 教练按次计费

每次 Claude 推送或验证都可以成为一笔 USDC 小额支付，自动产生交易数和 USDC 流量。

`spike/x402/` 已验证 `@x402/express` 2.12.0 + `@x402/fetch` 2.12.0：

- 类型编译通过
- 本地 mock facilitator + 真实 x402 server 跑通
- `POST /coach` 返回 `402`，`Payment-Required` header 是合法 x402 v2 base64
- 解码结果为 `{scheme:"exact", network:"eip155:84532", amount:"10000"(=0.01 USDC), payTo, maxTimeoutSeconds:300}`
- Mock facilitator 的 `/supported`、`/verify`、`/settle` 三端点已跑通，可完全离线演示
- 切到 Arc 时只需改 `NETWORK=eip155:5042002` + `FACILITATOR_URL=<Circle Gateway>`

| 触发器 | 收费 |
|---|---|
| Claude 主动推送 | $0.001 |
| Claude 视觉验证 1 张图 | $0.005 |
| Claude 生成总结/分析报告 | $0.01 |
| Claude 多轮对话调整目标 | $0.02 |

具体定价可在用户测试后调整，起步建议低门槛。

### 设计 4 · 面向黑客松出货的 Traction 模型

目标用户是 **Canteen Discord 的几百号 hackathon 选手 + Web3 dev Twitter 圈**。

承诺类型：
- “5/25 前 ship 一个 dapp，押 $20”
- “本周完成 ERC-8183 集成，押 $10”
- “明天前 PR review 三个项目，押 $5”

StakeWord 作为 hackathon 周边工具，选手自己当用户，自然形成 Twitter 传播。Traction 数据来自真实 staking 流水和 x402 小额交易，叙事上是“我们的产品被这次 hackathon 的人当工具用了”。

**12 天目标：** 30-100 个真实 staking 用户、$500-$3000 TVL、x402 累计 500-2000 笔小额交易。

---

## 四、技术架构

### 前端
- **框架：** Next.js + Tailwind CSS（队友主导）
- **钱包：** Circle Wallets SDK（SCA on ARC-TESTNET，见 `spike/circle-wallets/`）
- **部署：** 自有服务器部署，通过 CI/CD 自动构建与发布

### 后端
- **API 层：** Next.js API Routes（单仓部署 + 简单）+ 一个独立 Node 服务跑长任务
- **长任务：** Claude 主动推送扫描器、x402 server、Arc 链 evaluator 调用
- **AI：** Anthropic Claude API（包含 vision）+ prompt caching
- **任务队列：** 简单的 PG 表轮询，MVP 阶段不上 Redis 复杂栈

### 合约
- **AgenticCommerce（ERC-8183 ref impl）：** `0x0747EEf0706327138c69792bF28Cd525089e4583` on Arc testnet，直接调用
- **StakeWordVault：** 小合约，持 USYC，实现“完成者池瓜分利息 + 失败本金”逻辑
- **EvaluatorPolicy：** Claude oracle 钱包的 `complete()` 调用决策由后端 Node 服务签名后通过 Circle Wallets SDK 发出

### 数据
- **Postgres（Supabase）：** 用户、承诺（joinid + agenticCommerce jobId）、x402 流水、证据元数据
- **对象存储：** Supabase Storage 或 R2，存放证据图片
- **链上锚定：** 所有 deliverable hash + reason hash 都是 `keccak256` 上链，本地存原文

---

## 五、风险清单与缓解

| 风险 | 缓解 |
|---|---|
| Claude 视觉验证不鲁棒 | 同类承诺 2-3 人交叉验证 + 异常证据触发二次确认 + 不公开反作弊规则 |
| USYC allowlist 没通过 | 退化到“无利息只瓜分失败本金”模式，叙事仍然成立 |
| x402 Circle Gateway facilitator 不在 hackathon 前发布 | 用 facilitator.x402.org + Base Sepolia 跑 demo，Arc 一上 facilitator 即可切换 |
| Traction 上不去 | 备用方案：把 StakeWord 内嵌到 Twitter bot，用户 @ 它就开承诺 |
| 比赛规则突然不允许 off-RFB | ERC-8183、协议金库、x402 设计都可以迁到 RFB 02/06（prediction market trader / social trading） |

---

## 六、12 天执行时间表

| 日期 | 谁 | 干啥 |
|---|---|---|
| 5/14 上午 | 我（spike） | 申请 USYC testnet allowlist（等 24-48h） |
| 5/14 晚 23:00 | 你 | 听 Twitch KickOff 2，确认正式赛题口风，把意外变化告诉我 |
| 5/15 | 队友 | Next.js 骨架 + Circle Wallets 集成（用 `spike/circle-wallets/`） |
| 5/15 | 我 | StakeWordVault 合约 sketch → 部署到 testnet → forge verify |
| 5/16 | 共同 | ERC-8183 端到端串通：前端创建 job → 后端 evaluator 自动 complete |
| 5/17 | 共同 | x402 教练接口接入，Claude prompt 调好，定价跑通 |
| 5/18-5/22 | 共同 | MVP 上线，刷 Traction |
| 5/19-5/20 | 队/你 | Twitch 直播间 + Twitter + Discord 拉用户 |
| 5/23 | 我 | 录 pitch 视频脚本初稿，你/队友出镜 |
| 5/24 | 共同 | 最终 README + `arc-canteen update-product` 累积更新 |
| 5/25 | 队 | 提交 |

---

## 七、评分自检表

| 维度 | 权重 | 实现 | 预期得分 |
|---|---|---|---|
| Agentic Sophistication | 30% | Claude 是 onchain evaluator，在 5 个环节做真决策 + x402 metered service | 24-28 |
| Traction | 30% | hackathon 选手做种子用户，x402 流水自动产生交易量，真实 staking | 18-24 |
| Circle Tool Usage | 20% | Wallets / USDC / USYC / Contracts / Paymaster / Send / x402 / ERC-8183 ref impl | 16-19 |
| Innovation | 20% | 自合约 ERC-8183 + 失败者瓜分 + onchain 履约档案 | 14-17 |
| **预期总分** | | | **72-88 / 100** |

---

## 八、提交清单

- ✅ Live 可用产品（通过 CI/CD 部署到自有服务器，前端 + 后端在一个仓）
- ✅ 创始人 Pitch 视频（3-5 分钟）
- ✅ GitHub 公开仓库（本仓）
- ✅ 真实 Traction 数据（staking 用户数、累计 USDC 流量、x402 交易笔数、完成率）
- ✅ `arc-canteen update-product` 每天至少更新 1 次（judges 看得到）

---

## 九、相关文件

- `RESEARCH.md` — 同类产品历史调研 + USYC 可行性 + spike 验证证据
- `spike/erc8183/` — ERC-8183 端到端 TypeScript 脚本（已跑通 read-only 验证）
- `spike/x402/` — x402 server + client + mock facilitator（已跑通离线 dance）
- `spike/circle-wallets/` — Circle Dev-Controlled Wallets 创建模板
- `spike/usyc-research/USYC-feasibility.md` — USYC 受限性 + 协议金库设计
