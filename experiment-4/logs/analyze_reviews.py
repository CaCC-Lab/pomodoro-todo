#!/usr/bin/env python3
"""
Self-Review Experiment: Comprehensive Analysis Script

5つの分析を実行:
1. 定量比較（issues数、重要度の統計分析）
2. 自己評価 vs 客観評価の比較
3. セキュリティランキング
4. 総合品質評価（3軸評価ランキング）
5. 統合ダッシュボード生成
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict
import statistics

# カラー出力
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

# AI実装とコミットハッシュのマッピング
AI_MAPPING = {
    '1-multi': 'c08a599',
    '2-claude': '8da96b7',
    '3-codex': '7171739',
    '4-gemini': '74b55c1',
    '5-amp': '4def1d7',
    '6-droid': 'b2afeaa',
    '7-cursor': 'd6bfeca',
    '8-qwen': 'f256d40',
}

HASH_TO_AI = {v: k for k, v in AI_MAPPING.items()}

BASE_DIR = Path(__file__).parent / 'results'

def load_json_safe(filepath: Path) -> Dict:
    """JSONファイルを安全に読み込む"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"{Colors.RED}Error loading {filepath}: {e}{Colors.END}")
        return {}

def collect_all_reviews() -> Dict[str, Dict[str, Dict]]:
    """全レビュー結果を収集"""
    print(f"\n{Colors.HEADER}{'='*80}")
    print(f"📊 全レビュー結果の収集")
    print(f"{'='*80}{Colors.END}\n")

    reviews = {}

    for ai_name, commit_hash in AI_MAPPING.items():
        print(f"{Colors.CYAN}Processing {ai_name} ({commit_hash})...{Colors.END}")

        reviews[ai_name] = {
            'hash': commit_hash,
            'self_review': None,
            'coderabbit': None,
            'security': None
        }

        # 自己レビュー
        if ai_name == '1-multi':
            # multi-aiは unified-review.json
            self_path = BASE_DIR / 'self-reviews' / 'unified-review.json'
        else:
            ai_suffix = ai_name.split('-')[1]  # claude, codex, etc.
            # タイムスタンプ付きファイルを探す
            self_files = list((BASE_DIR / 'self-reviews').glob(f'*_{commit_hash}_{ai_suffix}.json'))
            if self_files:
                self_path = self_files[0]
            else:
                self_path = None

        if self_path and self_path.exists():
            reviews[ai_name]['self_review'] = load_json_safe(self_path)
            print(f"  ✅ Self-review: {self_path.name}")
        else:
            print(f"  ❌ Self-review: Not found")

        # CodeRabbit
        coderabbit_files = list((BASE_DIR / 'coderabbit').glob(f'*_{commit_hash}_alt.json'))
        if coderabbit_files:
            reviews[ai_name]['coderabbit'] = load_json_safe(coderabbit_files[0])
            print(f"  ✅ CodeRabbit: {coderabbit_files[0].name}")
        else:
            print(f"  ❌ CodeRabbit: Not found")

        # Security
        security_files = list((BASE_DIR / 'security').glob(f'*_{commit_hash}_security.json'))
        if security_files:
            reviews[ai_name]['security'] = load_json_safe(security_files[0])
            print(f"  ✅ Security: {security_files[0].name}")
        else:
            print(f"  ❌ Security: Not found")

    return reviews

def extract_findings(review_data: Dict, review_type: str) -> List[Dict]:
    """レビュー結果からfindingsを抽出"""
    if not review_data:
        return []

    findings = []

    if review_type == 'coderabbit':
        # CodeRabbit形式: {ai: alt_ai, review_summary: {...}}
        if 'review_summary' in review_data:
            summary = review_data['review_summary']
            if 'findings' in summary:
                findings = summary.get('findings', [])
    else:
        # 標準形式
        findings = review_data.get('findings', [])

    return findings

def analyze_findings_stats(findings: List[Dict]) -> Dict:
    """Findingsの統計情報を抽出"""
    if not findings:
        return {
            'total': 0,
            'by_priority': {},
            'avg_confidence': 0.0
        }

    by_priority = defaultdict(int)
    confidences = []

    for finding in findings:
        priority = finding.get('priority', 'Unknown')
        by_priority[f'P{priority}'] += 1

        conf = finding.get('confidence_score', 0.0)
        if isinstance(conf, (int, float)):
            confidences.append(conf)

    return {
        'total': len(findings),
        'by_priority': dict(by_priority),
        'avg_confidence': statistics.mean(confidences) if confidences else 0.0
    }

def analysis_1_quantitative_comparison(reviews: Dict):
    """分析1: 定量比較（issues数、重要度の統計分析）"""
    print(f"\n{Colors.HEADER}{'='*80}")
    print(f"📊 分析1: 定量比較（Issues数・重要度の統計分析）")
    print(f"{'='*80}{Colors.END}\n")

    results = {}

    for ai_name in sorted(reviews.keys()):
        ai_data = reviews[ai_name]

        self_findings = extract_findings(ai_data['self_review'], 'self')
        coderabbit_findings = extract_findings(ai_data['coderabbit'], 'coderabbit')
        security_findings = extract_findings(ai_data['security'], 'security')

        self_stats = analyze_findings_stats(self_findings)
        coderabbit_stats = analyze_findings_stats(coderabbit_findings)
        security_stats = analyze_findings_stats(security_findings)

        results[ai_name] = {
            'self': self_stats,
            'coderabbit': coderabbit_stats,
            'security': security_stats
        }

        print(f"{Colors.CYAN}{ai_name}:{Colors.END}")
        print(f"  自己レビュー:   {self_stats['total']:2d} issues (信頼度: {self_stats['avg_confidence']:.2f})")
        print(f"  CodeRabbit:    {coderabbit_stats['total']:2d} issues (信頼度: {coderabbit_stats['avg_confidence']:.2f})")
        print(f"  Security:      {security_stats['total']:2d} issues (信頼度: {security_stats['avg_confidence']:.2f})")
        print()

    # 統計サマリー
    print(f"\n{Colors.BOLD}統計サマリー:{Colors.END}")
    self_totals = [r['self']['total'] for r in results.values()]
    coderabbit_totals = [r['coderabbit']['total'] for r in results.values()]
    security_totals = [r['security']['total'] for r in results.values()]

    print(f"自己レビュー issues平均: {statistics.mean(self_totals):.1f} (中央値: {statistics.median(self_totals):.1f})")
    print(f"CodeRabbit issues平均:   {statistics.mean(coderabbit_totals):.1f} (中央値: {statistics.median(coderabbit_totals):.1f})")
    print(f"Security issues平均:     {statistics.mean(security_totals):.1f} (中央値: {statistics.median(security_totals):.1f})")

    return results

def analysis_2_self_vs_objective(reviews: Dict, quant_results: Dict):
    """分析2: 自己評価 vs 客観評価の比較"""
    print(f"\n{Colors.HEADER}{'='*80}")
    print(f"📊 分析2: 自己評価 vs 客観評価の比較分析")
    print(f"{'='*80}{Colors.END}\n")

    comparison = {}

    for ai_name in sorted(reviews.keys()):
        self_count = quant_results[ai_name]['self']['total']
        objective_count = quant_results[ai_name]['coderabbit']['total']

        # 差分とバイアス
        diff = self_count - objective_count
        bias = "厳格" if diff > 0 else "甘い" if diff < 0 else "中立"
        bias_ratio = abs(diff) / objective_count if objective_count > 0 else 0

        comparison[ai_name] = {
            'self': self_count,
            'objective': objective_count,
            'diff': diff,
            'bias': bias,
            'bias_ratio': bias_ratio
        }

        color = Colors.YELLOW if bias == "厳格" else Colors.GREEN if bias == "甘い" else Colors.BLUE
        print(f"{color}{ai_name}:{Colors.END}")
        print(f"  自己評価: {self_count:2d} issues")
        print(f"  客観評価: {objective_count:2d} issues")
        print(f"  差分:     {diff:+3d} ({bias}, バイアス率: {bias_ratio:.1%})")
        print()

    # ランキング
    print(f"\n{Colors.BOLD}自己評価の厳格さランキング (厳格→甘い):{Colors.END}")
    sorted_ai = sorted(comparison.items(), key=lambda x: x[1]['diff'], reverse=True)
    for rank, (ai_name, data) in enumerate(sorted_ai, 1):
        print(f"{rank}. {ai_name}: {data['diff']:+d} ({data['bias']})")

    return comparison

def analysis_3_security_ranking(reviews: Dict, quant_results: Dict):
    """分析3: セキュリティランキング"""
    print(f"\n{Colors.HEADER}{'='*80}")
    print(f"📊 分析3: セキュリティ品質ランキング")
    print(f"{'='*80}{Colors.END}\n")

    security_scores = {}

    for ai_name in sorted(reviews.keys()):
        security_count = quant_results[ai_name]['security']['total']
        security_conf = quant_results[ai_name]['security']['avg_confidence']

        # スコア計算: issuesが少ないほど高スコア、信頼度が高いほど重視
        # 正規化: issues=0で100点、issues=10で0点（仮定）
        score = max(0, 100 - (security_count * 10)) * security_conf if security_conf > 0 else max(0, 100 - (security_count * 10))

        security_scores[ai_name] = {
            'issues': security_count,
            'confidence': security_conf,
            'score': score
        }

    # ランキング
    sorted_security = sorted(security_scores.items(), key=lambda x: x[1]['score'], reverse=True)

    print(f"{Colors.BOLD}セキュリティスコアランキング (高→低):{Colors.END}\n")
    for rank, (ai_name, data) in enumerate(sorted_security, 1):
        medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}."
        print(f"{medal} {ai_name}: スコア {data['score']:.1f} (issues: {data['issues']}, 信頼度: {data['confidence']:.2f})")

    return security_scores

def analysis_4_overall_quality(reviews: Dict, quant_results: Dict, security_scores: Dict):
    """分析4: 総合品質評価（3軸評価ランキング）"""
    print(f"\n{Colors.HEADER}{'='*80}")
    print(f"📊 分析4: 総合品質評価（3軸評価ランキング）")
    print(f"{'='*80}{Colors.END}\n")

    overall_scores = {}

    for ai_name in sorted(reviews.keys()):
        # 3軸スコア
        # 1. 自己レビュースコア: 自己認識の正確さ（issues数の妥当性）
        self_count = quant_results[ai_name]['self']['total']
        self_score = min(100, self_count * 10)  # 適度な自己レビューを評価

        # 2. CodeRabbitスコア: 客観的コード品質（issues が少ないほど高評価）
        coderabbit_count = quant_results[ai_name]['coderabbit']['total']
        coderabbit_score = max(0, 100 - (coderabbit_count * 5))

        # 3. セキュリティスコア
        security_score = security_scores[ai_name]['score']

        # 総合スコア（加重平均: 自己20%, CodeRabbit 40%, Security 40%）
        overall = (self_score * 0.2) + (coderabbit_score * 0.4) + (security_score * 0.4)

        overall_scores[ai_name] = {
            'self_score': self_score,
            'coderabbit_score': coderabbit_score,
            'security_score': security_score,
            'overall_score': overall
        }

        print(f"{Colors.CYAN}{ai_name}:{Colors.END}")
        print(f"  自己レビュー:  {self_score:5.1f}点")
        print(f"  コード品質:    {coderabbit_score:5.1f}点")
        print(f"  セキュリティ:  {security_score:5.1f}点")
        print(f"  {Colors.BOLD}総合スコア:    {overall:5.1f}点{Colors.END}")
        print()

    # 総合ランキング
    sorted_overall = sorted(overall_scores.items(), key=lambda x: x[1]['overall_score'], reverse=True)

    print(f"\n{Colors.BOLD}🏆 総合品質ランキング:{Colors.END}\n")
    for rank, (ai_name, data) in enumerate(sorted_overall, 1):
        medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}."
        print(f"{medal} {ai_name}: {data['overall_score']:.1f}点")

    return overall_scores

def analysis_5_generate_dashboard(reviews: Dict, quant_results: Dict, comparison: Dict,
                                  security_scores: Dict, overall_scores: Dict):
    """分析5: 統合ダッシュボード生成"""
    print(f"\n{Colors.HEADER}{'='*80}")
    print(f"📊 分析5: 統合ダッシュボード生成")
    print(f"{'='*80}{Colors.END}\n")

    dashboard_path = Path(__file__).parent / 'COMPREHENSIVE_ANALYSIS_REPORT.md'

    with open(dashboard_path, 'w', encoding='utf-8') as f:
        f.write("# Self-Review Experiment: Comprehensive Analysis Report\n\n")
        f.write("**Generated:** 2025-10-27\n\n")
        f.write("---\n\n")

        # エグゼクティブサマリー
        f.write("## 📊 Executive Summary\n\n")

        # 総合ランキング TOP 3
        sorted_overall = sorted(overall_scores.items(), key=lambda x: x[1]['overall_score'], reverse=True)
        f.write("### 🏆 総合品質ランキング TOP 3\n\n")
        f.write("| 順位 | AI実装 | 総合スコア | 自己レビュー | コード品質 | セキュリティ |\n")
        f.write("|------|--------|-----------|------------|-----------|------------|\n")
        for rank, (ai_name, data) in enumerate(sorted_overall[:3], 1):
            medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉"
            f.write(f"| {medal} | {ai_name} | {data['overall_score']:.1f} | {data['self_score']:.1f} | {data['coderabbit_score']:.1f} | {data['security_score']:.1f} |\n")
        f.write("\n")

        # 分析1: 定量比較
        f.write("---\n\n")
        f.write("## 1️⃣ 定量比較: Issues数・重要度の統計分析\n\n")
        f.write("### Issues数の比較\n\n")
        f.write("| AI実装 | 自己レビュー | CodeRabbit | Security | 合計 |\n")
        f.write("|--------|------------|-----------|---------|------|\n")
        for ai_name in sorted(quant_results.keys()):
            data = quant_results[ai_name]
            total = data['self']['total'] + data['coderabbit']['total'] + data['security']['total']
            f.write(f"| {ai_name} | {data['self']['total']} | {data['coderabbit']['total']} | {data['security']['total']} | {total} |\n")
        f.write("\n")

        # 統計サマリー
        self_totals = [r['self']['total'] for r in quant_results.values()]
        coderabbit_totals = [r['coderabbit']['total'] for r in quant_results.values()]
        security_totals = [r['security']['total'] for r in quant_results.values()]

        f.write("### 統計サマリー\n\n")
        f.write(f"- **自己レビュー平均**: {statistics.mean(self_totals):.1f} issues (中央値: {statistics.median(self_totals):.1f})\n")
        f.write(f"- **CodeRabbit平均**: {statistics.mean(coderabbit_totals):.1f} issues (中央値: {statistics.median(coderabbit_totals):.1f})\n")
        f.write(f"- **Security平均**: {statistics.mean(security_totals):.1f} issues (中央値: {statistics.median(security_totals):.1f})\n\n")

        # 分析2: 自己評価 vs 客観評価
        f.write("---\n\n")
        f.write("## 2️⃣ 自己評価 vs 客観評価の比較分析\n\n")
        f.write("### 自己認識の正確さ\n\n")
        f.write("| AI実装 | 自己評価 | 客観評価 | 差分 | バイアス | バイアス率 |\n")
        f.write("|--------|---------|---------|------|---------|----------|\n")
        for ai_name in sorted(comparison.keys()):
            data = comparison[ai_name]
            f.write(f"| {ai_name} | {data['self']} | {data['objective']} | {data['diff']:+d} | {data['bias']} | {data['bias_ratio']:.1%} |\n")
        f.write("\n")

        # ランキング
        sorted_comparison = sorted(comparison.items(), key=lambda x: x[1]['diff'], reverse=True)
        f.write("### 自己評価の厳格さランキング\n\n")
        f.write("**厳格（自己評価 > 客観評価）**\n\n")
        for rank, (ai_name, data) in enumerate([x for x in sorted_comparison if x[1]['diff'] > 0], 1):
            f.write(f"{rank}. **{ai_name}**: {data['diff']:+d} issues ({data['bias']})\n")
        f.write("\n**甘い（自己評価 < 客観評価）**\n\n")
        for rank, (ai_name, data) in enumerate([x for x in sorted_comparison if x[1]['diff'] < 0], 1):
            f.write(f"{rank}. **{ai_name}**: {data['diff']:+d} issues ({data['bias']})\n")
        f.write("\n")

        # 分析3: セキュリティランキング
        f.write("---\n\n")
        f.write("## 3️⃣ セキュリティ品質ランキング\n\n")
        sorted_security = sorted(security_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        f.write("| 順位 | AI実装 | セキュリティスコア | Issues数 | 信頼度 |\n")
        f.write("|------|--------|------------------|---------|-------|\n")
        for rank, (ai_name, data) in enumerate(sorted_security, 1):
            medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}"
            f.write(f"| {medal} | {ai_name} | {data['score']:.1f} | {data['issues']} | {data['confidence']:.2f} |\n")
        f.write("\n")

        # 分析4: 総合品質評価
        f.write("---\n\n")
        f.write("## 4️⃣ 総合品質評価（3軸評価ランキング）\n\n")
        f.write("### スコア内訳\n\n")
        f.write("| AI実装 | 自己レビュー | コード品質 | セキュリティ | 総合スコア |\n")
        f.write("|--------|------------|-----------|------------|----------|\n")
        for ai_name in sorted(overall_scores.keys()):
            data = overall_scores[ai_name]
            f.write(f"| {ai_name} | {data['self_score']:.1f} | {data['coderabbit_score']:.1f} | {data['security_score']:.1f} | **{data['overall_score']:.1f}** |\n")
        f.write("\n")

        f.write("### 🏆 最終ランキング\n\n")
        for rank, (ai_name, data) in enumerate(sorted_overall, 1):
            medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}."
            f.write(f"{medal} **{ai_name}**: {data['overall_score']:.1f}点\n\n")

        # 結論
        f.write("---\n\n")
        f.write("## 📌 結論と提言\n\n")

        winner = sorted_overall[0][0]
        winner_data = sorted_overall[0][1]
        f.write(f"### 🏆 最優秀実装: {winner}\n\n")
        f.write(f"- **総合スコア**: {winner_data['overall_score']:.1f}点\n")
        f.write(f"- **強み**: ")

        strengths = []
        if winner_data['self_score'] >= 50:
            strengths.append("適切な自己認識")
        if winner_data['coderabbit_score'] >= 70:
            strengths.append("高品質なコード")
        if winner_data['security_score'] >= 70:
            strengths.append("優れたセキュリティ")
        f.write(", ".join(strengths) if strengths else "バランスの取れた実装")
        f.write("\n\n")

        f.write("### 各AIの特性\n\n")
        for ai_name, data in sorted_overall:
            f.write(f"**{ai_name}**:\n")
            # 特性分析
            if data['self_score'] > 60:
                f.write(f"- 自己レビューが充実（{data['self_score']:.0f}点）\n")
            if data['coderabbit_score'] > 70:
                f.write(f"- 高品質なコード実装（{data['coderabbit_score']:.0f}点）\n")
            if data['security_score'] > 70:
                f.write(f"- セキュリティ対策が適切（{data['security_score']:.0f}点）\n")
            if data['overall_score'] < 50:
                f.write(f"- 改善の余地あり（総合{data['overall_score']:.0f}点）\n")
            f.write("\n")

        # 次のステップ
        f.write("### 次のステップ\n\n")
        f.write("1. **低スコア実装の改善**:\n")
        for ai_name, data in sorted_overall[-3:]:
            f.write(f"   - {ai_name}: 総合{data['overall_score']:.0f}点 → 目標70点以上\n")
        f.write("\n")
        f.write("2. **ベストプラクティスの共有**: 上位実装のコードパターンを他の実装に適用\n\n")
        f.write("3. **継続的レビュー**: 定期的な自己レビュー + 客観レビューの実施\n\n")

        # メタデータ
        f.write("---\n\n")
        f.write("## 📋 Metadata\n\n")
        f.write(f"- **実験日時**: 2025-10-27 22:38\n")
        f.write(f"- **総レビュー数**: 24回（8実装 × 3レビュータイプ）\n")
        f.write(f"- **レビュータイプ**: 自己レビュー、CodeRabbit、Claude Security\n")
        f.write(f"- **分析スクリプト**: `analyze_reviews.py`\n\n")

    print(f"{Colors.GREEN}✅ 統合ダッシュボード生成完了: {dashboard_path}{Colors.END}")
    print(f"   サイズ: {dashboard_path.stat().st_size:,} bytes")

    return dashboard_path

def main():
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║  Self-Review Experiment: Comprehensive Analysis                ║")
    print("║  5つの分析を徹底的に実行                                       ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")

    # データ収集
    reviews = collect_all_reviews()

    # 分析1: 定量比較
    quant_results = analysis_1_quantitative_comparison(reviews)

    # 分析2: 自己評価 vs 客観評価
    comparison = analysis_2_self_vs_objective(reviews, quant_results)

    # 分析3: セキュリティランキング
    security_scores = analysis_3_security_ranking(reviews, quant_results)

    # 分析4: 総合品質評価
    overall_scores = analysis_4_overall_quality(reviews, quant_results, security_scores)

    # 分析5: 統合ダッシュボード生成
    dashboard_path = analysis_5_generate_dashboard(reviews, quant_results, comparison,
                                                     security_scores, overall_scores)

    print(f"\n{Colors.BOLD}{Colors.GREEN}")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║  ✅ 全5つの分析が完了しました                                  ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")

    print(f"統合レポート: {Colors.CYAN}{dashboard_path}{Colors.END}\n")

if __name__ == "__main__":
    main()
