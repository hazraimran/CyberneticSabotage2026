import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.sfi.dbn import DBN

dbn = DBN()

# 模拟一个沮丧的学生：打字慢、很多删除、快速重新提交
frustrated_features = {
    "avg_ikl": 800,           # 很慢，>500 触发 high_ikl
    "avg_pel": 6000,          # 错误后停很久，>5000 触发 high_pel
    "backspace_frequency": 0.5, # 很多删除，>0.3 触发 high_backspace
    "pause_count": 5,          # 很多长停顿，>3 触发 high_pause
    "rapid_resubmission": 2,   # 快速重新提交，>0 触发
}

# 模拟一个flow状态的学生：打字流畅、少删除、少停顿
flow_features = {
    "avg_ikl": 150,
    "avg_pel": 0,
    "backspace_frequency": 0.05,
    "pause_count": 1,
    "rapid_resubmission": 0,
}

print("=== 测试沮丧学生 ===")
result = dbn.update(frustrated_features)
print(f"状态概率: {result['probabilities']}")
print(f"主要状态: {result['dominant_state']}")
print(f"触发Triny: {result['trigger_scaffold']}")

print("\n=== 重置后测试Flow学生 ===")
dbn.reset()
result = dbn.update(flow_features)
print(f"状态概率: {result['probabilities']}")
print(f"主要状态: {result['dominant_state']}")
print(f"触发Triny: {result['trigger_scaffold']}")