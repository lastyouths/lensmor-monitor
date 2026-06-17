export interface Difference {
  id: string;
  type: "added" | "removed" | "modified";
  category: "pricing" | "marketing" | "feature" | "operation";
  oldContent: string;
  newContent: string;
  reasoning: string;
}

export interface ActionAdvice {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface CompanyProfile {
  founded: string;
  type: string;
  stage: string;
  location: string;
  employees: string;
  targetMarket: string;
}

export interface ReportData {
  id?: string;
  companyName: string;
  url: string;
  summary: string;
  companyProfile: CompanyProfile;
  differences: Difference[];
  advices: ActionAdvice[];
}

export const mockReportData: ReportData = {
  companyName: "Supabase",
  url: "https://supabase.com",
  summary: "过去 30 天内，竞争对手 Supabase 的网站发生了显著变化。他们明显地更新了 Pricing 页面的描述，强调了企业级特性（SOC2 等合规项）。整体来看，他们正在加速向中大型企业客户倾斜。",
  companyProfile: {
    founded: "2020",
    type: "私有",
    stage: "Series C ($80M+)",
    location: "Remote / Singapore",
    employees: "100-250",
    targetMarket: "开发者工具, BaaS, 企业级数据库"
  },
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
      oldContent: "",
      newContent: "Advanced Security: SOC2 Type II, HIPAA Compliance, and RLS.",
      reasoning: "新增大篇幅的安全合规声明，这是典型的针对企业级采购审查所做的背书准备。",
    },
    {
      id: "diff-3",
      type: "removed",
      category: "marketing",
      oldContent: "Join 100,000+ developers building weekend projects.",
      newContent: "",
      reasoning: "移除了关于周末项目的数据背书，为了避免给大客户留下“不可靠”的刻板印象。",
    }
  ],
  advices: [
    {
      id: "adv-1",
      priority: "high",
      title: "针对中小团队发起营销防守反击",
      description: "对手正在逐渐抛弃低净值用户。我们应在官网醒目位置添加对比文案，承接流失用户。",
    },
    {
      id: "adv-2",
      priority: "medium",
      title: "立即评估自身企业版定价策略",
      description: "既然最大的开源替代品正在强攻企业市场，我们需要重新审视我们在安全与合规方面的功能壁垒，确保不会在接下来几个月内的采购招标中被击败。",
    }
  ]
};
