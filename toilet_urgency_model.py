"""
如厕紧迫度评分模型 v1.0
基于多因素决策树模型
"""

import math
from typing import Tuple

# ============ 常量定义 ============
BLADDER_FULL_TIME = 4  # 膀胱从空到满约4小时（假设最大憋尿时长）
MAX_WALK_TIME = 10     # 最大可接受步行时间（分钟）
BUFFER_WINDOW = 8      # 临界点前缓冲时间（分钟）

class ToiletUrgencyModel:
    """如厕紧迫度综合评分模型"""
    
    def __init__(self, a: float, b_intake: float, b预感: int, c: float, d: float):
        """
        参数初始化
        a: 距上次排尿时长（小时）
        b_intake: 当前液体摄入量（ml）
        b预感: 排尿预感强度（1-10）
        c: 到最近厕所步行时间（分钟）
        d: 任务中断成本（0-10）
        """
        self.a = a
        self.b_intake = b_intake
        self.b_预感 = b预感
        self.c = c
        self.d = d
    
    # ---------- 子因素计算 ----------
    
    def urine_accumulation_factor(self) -> float:
        """
        尿液积累因子 U(a)
        使用对数函数模拟：刚开始积累慢，快满时加速
        """
        if self.a <= 0:
            return 0.1
        # 对数增长，4小时时达到峰值1.0
        return min(1.0, math.log(1 + self.a) / math.log(1 + BLADDER_FULL_TIME))
    
    def intake_pressure_factor(self) -> float:
        """
        摄入压力因子 I(b)
        结合液体摄入量和主观预感
        """
        # 摄入量标准化（假设正常摄入量200-1000ml）
        intake_norm = min(1.0, max(0.0, (self.b_intake - 200) / 800))
        # 预感标准化（已经是1-10）
       预感_norm = self.b_预感 / 10
        # 综合：预感权重更高（主观感受更准确）
        return 0.3 * intake_norm + 0.7 * 预感_norm
    
    def distance_risk_factor(self) -> float:
        """
        距离风险因子 R(c)
        距离越远，失败概率越高（指数增长）
        """
        # 步行10分钟以上风险急剧上升
        return 1 - math.exp(-0.3 * self.c)
    
    def task_cost_factor(self) -> float:
        """
        任务成本因子 C(d)
        成本越高，决策权重越大
        """
        return self.d / 10
    
    # ---------- 综合评分 ----------
    
    def calculate_urgency_score(self) -> float:
        """
        综合紧迫度评分 S
        S = 基础紧迫度 × 风险放大器 × 任务成本系数
        """
        U = self.urine_accumulation_factor()
        I = self.intake_pressure_factor()
        R = self.distance_risk_factor()
        C = self.task_cost_factor()
        
        # 基础紧迫度
        base_urgency = U * 0.5 + I * 0.5
        
        # 风险放大器（距离越远+尿意越强，风险越大）
        risk_multiplier = 1 + R * (U + I) / 2
        
        # 任务调整系数（成本高时倾向于等，成本低时倾向于去）
        task_adjustment = 1 + 0.5 * C if U < 0.7 else 1 - 0.3 * C
        
        S = base_urgency * risk_multiplier * task_adjustment
        return min(1.0, S)  # 封顶1.0
    
    def get_risk_benefit_ratio(self, wait_minutes: float) -> Tuple[float, float, float]:
        """
        计算"现在去"vs"等X分钟"的策略比较
        
        返回: (现在去风险分, 等待风险分, 风险收益比)
        """
        # 现在就去的风险（任务中断风险 - 取决于d）
        risk_now = self.task_cost_factor()
        # 现在就去的收益（避免紧急情况）= 1 - 紧迫度
        benefit_now = 1 - self.calculate_urgency_score()
        
        # 等X分钟后的状态预估
        # 预估等待后的尿意增长（每小时增长约0.25的紧迫度）
        wait_hours = wait_minutes / 60
        projected_urgency = min(1.0, self.calculate_urgency_score() + 0.25 * wait_hours)
        projected_risk = min(1.0, projected_urgency * 0.7 + self.distance_risk_factor() * 0.3)
        # 等待的收益（完成任务的价值）
        benefit_wait = self.task_cost_factor() * 0.5 * wait_minutes / 10
        
        # 现在去的综合风险收益比（越小越好=去）
        ratio_now = risk_now / (benefit_now + 0.01)
        ratio_wait = projected_risk / (benefit_wait + 0.01)
        
        return ratio_now, ratio_wait, ratio_wait / (ratio_now + 0.01)
    
    def recommend_action(self) -> dict:
        """
        基于评分给出行动建议
        """
        S = self.calculate_urgency_score()
        U = self.urine_accumulation_factor()
        
        # 临界阈值
        thresholds = {
            'CRITICAL': 0.85,  # 紧急：立即行动
            'URGENT': 0.65,     # 较急：建议尽快
            'MODERATE': 0.40,   # 中等：可选择性等待
            'LOW': 0.0          # 较低：无需担心
        }
        
        # 任务中断成本等级
        task_level = "高成本任务" if self.d >= 7 else "中成本任务" if self.d >= 4 else "低成本任务"
        
        return {
            'urgency_score': round(S, 3),
            'urgency_level': next(level for level, thresh in thresholds.items() if S >= thresh),
            'urine_level': round(U * 100, 1),
            'distance_risk': round(self.distance_risk_factor() * 100, 1),
            'task_context': task_level,
            'recommendation': self._get_recommendation(S, U, self.d)
        }
    
    def _get_recommendation(self, S: float, U: float, d: float) -> str:
        if S >= 0.85:
            return "⚠️ 立即行动！膀胱已接近临界状态"
        elif S >= 0.65:
            if d >= 7:
                return "🔶 高优先级中断，现在就去"
            else:
                return "🔶 建议立即前往，可快速解决"
        elif S >= 0.40:
            if U >= 0.5 and d <= 3:
                return "🟡 可完成当前小节后前往"
            elif d >= 7:
                return "🟡 可快速完成任务节点后解决"
            else:
                return "🟡 视情况自行判断"
        else:
            return "🟢 无紧迫感，可自由安排"


def demo_scenarios():
    """演示几种典型场景"""
    
    print("=" * 70)
    print("如厕紧迫度评分模型 - 场景演示")
    print("=" * 70)
    
    scenarios = [
        {
            'name': '场景A：会议进行中',
            'desc': '大型汇报会议中，距离上次排尿2小时，喝了500ml水，预感6分，厕所步行3分钟',
            'a': 2.0, 'b_intake': 500, 'b_预感': 6, 'c': 3, 'd': 9
        },
        {
            'name': '场景B：考试中',
            'desc': '期末考试，距离上次排尿1.5小时，喝了300ml水，预感4分，厕所步行2分钟',
            'a': 1.5, 'b_intake': 300, 'b_预感': 4, 'c': 2, 'd': 10
        },
        {
            'name': '场景C：高速驾驶',
            'desc': '高速公路服务区还有30分钟，预感3分，喝了400ml水，上次排尿1小时',
            'a': 1.0, 'b_intake': 400, 'b_预感': 3, 'c': 30, 'd': 8
        },
        {
            'name': '场景D：休息在家',
            'desc': '周末在家看电视，预感2分，喝了200ml水，上次排尿3小时，厕所就在旁边',
            'a': 3.0, 'b_intake': 200, 'b_预感': 2, 'c': 1, 'd': 2
        },
        {
            'name': '场景E：临界状态',
            'desc': '憋了3.5小时，预感爆棚9分，喝了800ml水，厕所在5分钟外',
            'a': 3.5, 'b_intake': 800, 'b_预感': 9, 'c': 5, 'd': 5
        },
    ]
    
    for s in scenarios:
        print(f"\n{'─' * 70}")
        print(f"📌 {s['name']}")
        print(f"   情境：{s['desc']}")
        
        model = ToiletUrgencyModel(s['a'], s['b_intake'], s['b_预感'], s['c'], s['d'])
        
        # 显示各因子
        print(f"\n   ┌─ 因子分解：")
        print(f"   │  尿液积累因子: {model.urine_accumulation_factor():.3f}")
        print(f"   │  摄入压力因子: {model.intake_pressure_factor():.3f}")
        print(f"   │  距离风险因子: {model.distance_risk_factor():.3f}")
        print(f"   │  任务成本因子: {model.task_cost_factor():.3f}")
        
        # 综合评分
        result = model.recommend_action()
        print(f"   ├─ 综合评分: {result['urgency_score']:.3f}")
        print(f"   │  紧迫等级: {result['urgency_level']}")
        print(f"   │  膀胱状态: {result['urine_level']}%")
        print(f"   │  距离风险: {result['distance_risk']:.1f}%")
        print(f"   └─ 建议: {result['recommendation']}")
        
        # 风险收益分析
        print(f"\n   ┌─ 策略风险收益分析：")
        for wait in [0, 5, 10, 15]:
            ratio_now, ratio_later, improvement = model.get_risk_benefit_ratio(wait)
            action = "→ 去" if ratio_now < ratio_later else "→ 等"
            print(f"   │  等{wait}分钟后再去: 风险比={ratio_later:.2f} {action}")

if __name__ == "__main__":
    demo_scenarios()
    
    print("\n" + "=" * 70)
    print("公式总结")
    print("=" * 70)
