"""
==============================================================================
🚀 WEBTRAVEL - STEP-UP RAMP-UP STRESS TEST (TÌM ĐIỂM GIỚI HẠN CHỊU TẢI)
==============================================================================
Mục đích: Tăng tải liên tục theo từng bậc (Stage 1 -> 2 -> 3...) cho đến khi
hệ thống xuất hiện lỗi, quá tải hoặc nghẽn mạng thì tự động dừng lại và báo cáo
điểm giới hạn chịu tải tối đa (Max Breaking Point).
==============================================================================
"""

import sys
import os
import time
import json
import statistics
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

# Force UTF-8 encoding on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ANSI Color formatting
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
CYAN = '\033[96m'
BLUE = '\033[94m'
MAGENTA = '\033[95m'
BOLD = '\033[1m'
RESET = '\033[0m'

def load_env():
    """Đọc file .env để lấy cấu hình Supabase"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    config = {
        'url': 'https://ptfuochzymjaopksvcnw.supabase.co',
        'key': ''
    }
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('VITE_SUPABASE_URL='):
                    config['url'] = line.split('=', 1)[1].strip()
                elif line.startswith('VITE_SUPABASE_ANON_KEY='):
                    config['key'] = line.split('=', 1)[1].strip()
    return config

def make_request(method, url, headers, data=None, timeout=8):
    """Thực hiện HTTP request và đo độ trễ (ms)"""
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    start_time = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode('utf-8')
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                'status': response.status,
                'elapsed_ms': elapsed_ms,
                'success': 200 <= response.status < 300,
                'error': None
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        try:
            err_body = e.read().decode('utf-8')
        except Exception:
            err_body = e.reason
        return {
            'status': e.code,
            'elapsed_ms': elapsed_ms,
            'success': False,
            'error': f'HTTP {e.code}: {err_body[:100]}'
        }
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            'status': 0,
            'elapsed_ms': elapsed_ms,
            'success': False,
            'error': str(e)[:100]
        }

def run_stage(stage_num, total_requests, concurrency, supabase_url, headers):
    """Chạy một bậc tải và kiểm tra xem có vượt ngưỡng chịu đựng không"""
    print(f"\n{BOLD}{CYAN}▶ BẬC {stage_num}: TẢI {total_requests} REQUESTS | ĐỒNG THỜI {concurrency} VIRTUAL USERS{RESET}")
    
    def worker_task(idx):
        # Kết hợp ngẫu nhiên các truy vấn đọc tour, điểm đến, mã giảm giá
        if idx % 3 == 0:
            url = f"{supabase_url}/rest/v1/tours?select=*&status=neq.deleted&limit=15"
        elif idx % 3 == 1:
            url = f"{supabase_url}/rest/v1/destinations?select=*&limit=8"
        else:
            url = f"{supabase_url}/rest/v1/coupons?select=*&is_active=eq.true"
        return make_request('GET', url, headers)
        
    results = []
    start_time = time.perf_counter()
    
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker_task, i) for i in range(total_requests)]
        
        completed = 0
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            completed += 1
            
            # Real-time progress bar
            pct = int((completed / total_requests) * 100)
            bar_len = 30
            filled = int(bar_len * completed // total_requests)
            bar = '█' * filled + '░' * (bar_len - filled)
            status_color = GREEN if res['success'] else RED
            print(f"\r  [{bar}] {completed}/{total_requests} ({pct}%) - Last: {status_color}{res['elapsed_ms']:.0f}ms{RESET}   ", end='', flush=True)
            
    total_time_sec = time.perf_counter() - start_time
    print() # Newline
    
    # Statistical analysis
    latencies = [r['elapsed_ms'] for r in results]
    success_count = sum(1 for r in results if r['success'])
    fail_count = total_requests - success_count
    fail_rate = (fail_count / total_requests) * 100.0
    
    avg_lat = statistics.mean(latencies) if latencies else 0
    min_lat = min(latencies) if latencies else 0
    max_lat = max(latencies) if latencies else 0
    p95_lat = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max_lat
    rps = total_requests / total_time_sec if total_time_sec > 0 else 0
    
    print(f"  {GREEN}✔ Xử lý xong trong {total_time_sec:.2f}s{RESET} | Tốc độ: {BOLD}{rps:.1f} req/s (RPS){RESET}")
    print(f"  • Thành công: {GREEN}{success_count}/{total_requests} ({100-fail_rate:.1f}%){RESET} | Lỗi: {RED if fail_count > 0 else GREEN}{fail_count}{RESET}")
    print(f"  • Độ trễ: Min {min_lat:.0f}ms | {BOLD}Avg {avg_lat:.0f}ms{RESET} | P95 {p95_lat:.0f}ms | Max {max_lat:.0f}ms")
    
    # Check failure / breaking conditions
    is_broken = False
    break_reason = ""
    
    if fail_rate > 5.0:
        is_broken = True
        break_reason = f"Tỷ lệ lỗi vượt quá 5% (Ghi nhận {fail_rate:.1f}% lỗi)"
    elif avg_lat > 2000:
        is_broken = True
        break_reason = f"Độ trễ trung bình quá cao ({avg_lat:.0f}ms > 2000ms - nghẽn đường truyền)"
    elif any(r['status'] == 429 for r in results):
        is_broken = True
        break_reason = "Bị chạm ngưỡng Rate Limiting (HTTP 429 Too Many Requests)"
    elif any(r['status'] >= 500 for r in results):
        is_broken = True
        break_reason = "Server Supabase phản hồi lỗi nội bộ 5xx (Server Overload)"
        
    return {
        'stage': stage_num,
        'total': total_requests,
        'concurrency': concurrency,
        'success': success_count,
        'failed': fail_count,
        'fail_rate': fail_rate,
        'rps': rps,
        'avg_ms': avg_lat,
        'p95_ms': p95_lat,
        'is_broken': is_broken,
        'break_reason': break_reason
    }

def main():
    print(f"{BOLD}{MAGENTA}")
    print("=" * 75)
    print(" 🔥 WEBTRAVEL - TÌM ĐIỂM GIỚI HẠN CHỊU TẢI CỰC ĐẠI (RAMP-UP STRESS TEST) 🔥")
    print("=" * 75)
    print(f"{RESET}")
    
    env = load_env()
    supabase_url = env['url']
    api_key = env['key']
    
    if not api_key:
        print(f"{RED}❌ LỖI: Không tìm thấy VITE_SUPABASE_ANON_KEY trong file .env!{RESET}")
        sys.exit(1)
        
    print(f"• Endpoint API : {CYAN}{supabase_url}/rest/v1{RESET}")
    print(f"• Chiến lược   : Tăng tải liên tục theo từng bậc (Stage 1 -> Stage 6)")
    print(f"• Điều kiện dừng: Tỷ lệ lỗi > 5% HOẶC Độ trễ > 2.0s HOẶC Gặp lỗi HTTP 429/500")
    
    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    # Danh sách các bậc tải tăng dần (Ramp-up Stages)
    stages = [
        {'requests': 50,   'concurrency': 10},   # Bậc 1: Tải nhẹ
        {'requests': 100,  'concurrency': 25},   # Bậc 2: Tải bình thường
        {'requests': 250,  'concurrency': 50},   # Bậc 3: Tải cao
        {'requests': 500,  'concurrency': 80},   # Bậc 4: Tải rất cao (Flash Sale traffic)
        {'requests': 1000, 'concurrency': 120},  # Bậc 5: Tải cực đại (Mega Sale)
        {'requests': 2000, 'concurrency': 200},  # Bậc 6: Stress giới hạn tối đa
    ]
    
    stage_history = []
    max_safe_stage = None
    
    for idx, stage in enumerate(stages, 1):
        # Nghỉ nhẹ 1 giây giữa các bậc để giải phóng connection pool
        time.sleep(1)
        
        report = run_stage(
            stage_num=idx,
            total_requests=stage['requests'],
            concurrency=stage['concurrency'],
            supabase_url=supabase_url,
            headers=headers
        )
        stage_history.append(report)
        
        if report['is_broken']:
            print(f"\n{BOLD}{RED}🛑 PHÁT HIỆN ĐIỂM NGHẼN / QUÁ TẢI Ở BẬC {idx}:{RESET}")
            print(f"  • Nguyên nhân: {RED}{report['break_reason']}{RESET}")
            print(f"  • Tự động dừng bài test để bảo vệ hệ thống Database!")
            break
        else:
            max_safe_stage = report
            print(f"  {GREEN}✔ BẬC {idx} VƯỢT QUA AN TOÀN! Chuẩn bị tăng lên bậc tiếp theo...{RESET}")
            
    # --- FINAL BREAKING POINT REPORT ---
    print(f"\n{BOLD}{'=' * 75}")
    print(f" 🏆 BÁO CÁO ĐIỂM GIỚI HẠN CHỊU TẢI CỰC ĐẠI (BREAKING POINT REPORT)")
    print(f"{'=' * 75}{RESET}")
    
    print(f"{'Bậc':<6} | {'Requests':<10} | {'VUs (Luồng)':<12} | {'Tốc độ (RPS)':<14} | {'Độ trễ TB':<12} | {'Trạng thái'}")
    print("-" * 75)
    for st in stage_history:
        status_str = f"{GREEN}✔ Hoàn hảo{RESET}" if not st['is_broken'] else f"{RED}✖ Quá tải ({st['break_reason'][:20]}...){RESET}"
        print(f"{st['stage']:<6} | {st['total']:<10} | {st['concurrency']:<12} | {st['rps']:<12.1f}/s | {st['avg_ms']:<10.0f}ms | {status_str}")
    print("-" * 75)
    
    if max_safe_stage:
        print(f"\n🎯 {BOLD}{GREEN}ĐIỂM CHỊU TẢI AN TOÀN TỐI ĐA (MAX SAFE CAPACITY):{RESET}")
        print(f"• Số người dùng ảo đồng thời tối đa: {BOLD}{max_safe_stage['concurrency']} Virtual Users (VUs){RESET}")
        print(f"• Tốc độ phục vụ tối đa đạt được   : {BOLD}{max_safe_stage['rps']:.1f} requests/giây (RPS){RESET}")
        print(f"• Khả năng chịu tải tương đương    : {BOLD}Hơn {int(max_safe_stage['rps'] * 60):,} lượt xem trang / phút{RESET}")
    print(f"{'=' * 75}\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}⚠️ Đã dừng kiểm thử tải theo yêu cầu người dùng.{RESET}")
