export interface Difference {
  id: string;
  type: "added" | "removed" | "modified";
  category: "pricing" | "marketing" | "feature" | "operation";
  oldContent?: string;
  newContent?: string;
  reasoning: string;
}

export interface ActionAdvice {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface ReportData {
  companyName: string;
  url: string;
  summary: string;
  differences: Difference[];
  advices: ActionAdvice[];
}

export const mockReportData: ReportData = {
  companyName: "Supabase",
  url: "https://supabase.com",
  summary: "过去 30 天内，竞争对手 Supabase 的网站发生了多处变化。他们显著地更新了 Pricing 页面的描述，强调了企业级特性，并且在首页移除了针对初创团队的若干引导话术。这表明他们正在向中大型企业客户倾斜。",
  differences: [
    {
      id: "diff-1",
      type: "modified",
      category: "pricing",
      oldContent: "Start for free, then pay as you go. Perfect for indie hackers.",
      newContent: "Enterprise-ready Postgres. Scale with confidence.",
      reasoning: "核心标语的转变证实了他们品牌定位正在“往上走”，试图摆脱仅仅是“玩具/黑客工具”的标签。",
    },
    {
      id: "diff-2",
      type: "added",
      category: "feature",
      newContent: "Advanced Security: SOC2 Type II, HIPAA Compliance, and RLS.",
      reasoning: "新增大篇幅的安全合规声明，这是典型的针对企业级采购审查所做的背书准备。",
    },
    {
      id: "diff-3",
      type: "removed",
      category: "marketing",
      oldContent: "Join 100,000+ developers building weekend projects.",
      reasoning: "移除了关于周末项目的数据背书，为了避免给大客户留下“不可靠”的刻板印象。",
    }
  ],
  advices: [
    {
      id: "adv-1",
      priority: "high",
      title: "立即评估自身企业版定价策略",
      description: "既然最大的开源替代品正在强攻企业市场，我们需要重新审视我们在安全与合规方面的功能壁垒，确保不会在接下来几个月内的采购招标中被击败。",
    },
    {
      id: "adv-2",
      priority: "medium",
      title: "针对中小团队发起营销反击",
      description: "对手正在逐渐抛弃低净值用户，这是我们的防守反击机会。可以在我们的官网加上强调“永远对独立开发者友好”的对比文案。",
    }
  ]
};
