#!/bin/bash
# 검증 전부 (알림 ntfy·FCM 제외) × 회수.  사용: bash run_all.sh 2
# 결과: out/runs/<회차>_<이름>.txt, 끝에 요약. 먼저 python3 build.py && python3 build_site.py
cd "$(dirname "$0")"; N=${1:-1}; rm -rf out/runs; mkdir -p out/runs
H="check_all.py clip_all.py fs_check.py sim_a.py sim_b.py sim_c.py sim_d.py sim_e.py sim_g.py sim_write.py sim_weekly.py sim_capsule.py sim_mom.py sim_lecture.py sim_palm.py sim_tori.py sim_ebslink.py sim_month.py"
P="sim_family.py sim_sync.py"   # 8765 포트를 쓰는 것은 하나씩
one(){ local r=$1 s=$2 a=""; [ $s = sim_month.py ] && a=100; [ $s = fs_check.py ] && a=5
  timeout 1500 python3 $s $a > out/runs/${r}_${s%.py}.txt 2>&1; echo "EXIT $?" >> out/runs/${r}_${s%.py}.txt; }
for r in $(seq 1 $N); do
  (for s in $P; do one $r $s; done) &
  for s in $H; do
    while [ $(jobs -r | wc -l) -ge 5 ]; do sleep 2; done
    one $r $s &
  done
  wait
done
echo "===== 요약 ====="
for f in out/runs/*.txt; do
  ex=$(grep -o "EXIT [0-9]*" $f | tail -1)
  iss=$(grep -E "^issues:|문제:|^이상:|^page errors:" $f | grep -v "없음" | grep -v "^이상: 0$" | head -3 | tr '\n' ' ')
  st=OK; [ "$ex" != "EXIT 0" ] && st="실패($ex)"; [ -n "$iss" ] && st="문제"
  echo "$(basename $f .txt): $st $iss"
done
