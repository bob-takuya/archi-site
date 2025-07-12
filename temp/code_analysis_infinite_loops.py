#!/usr/bin/env python3
"""
Code Analysis Agent - Infinite Loop and Blocking Operation Detection

This script analyzes the architects page code to identify potential infinite loops,
recursive calls, and blocking operations that could cause the loading to get stuck.
"""

import os
import re
import json
import ast
from pathlib import Path
from typing import List, Dict, Any, Tuple

class CodeAnalyzer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.issues = []
        self.performance_issues = []
        
    def analyze_all_files(self) -> Dict[str, Any]:
        """Analyze all relevant files for performance issues"""
        print("🔍 Starting code analysis for infinite loops and blocking operations...")
        
        # Analyze TypeScript/JavaScript files
        js_files = list(self.base_path.glob("**/*.tsx")) + \
                  list(self.base_path.glob("**/*.ts")) + \
                  list(self.base_path.glob("**/*.js")) + \
                  list(self.base_path.glob("**/*.jsx"))
        
        # Filter relevant files
        relevant_files = [f for f in js_files if self._is_relevant_file(f)]
        
        print(f"📁 Found {len(relevant_files)} relevant files to analyze")
        
        for file_path in relevant_files:
            print(f"🔍 Analyzing: {file_path.relative_to(self.base_path)}")
            self.analyze_file(file_path)
        
        return self.generate_report()
    
    def _is_relevant_file(self, file_path: Path) -> bool:
        """Check if file is relevant for analysis"""
        # Skip node_modules, build outputs, and test files
        path_str = str(file_path)
        skip_patterns = [
            'node_modules',
            'dist',
            'build',
            '.test.',
            '.spec.',
            'playwright-results'
        ]
        
        return not any(pattern in path_str for pattern in skip_patterns)
    
    def analyze_file(self, file_path: Path):
        """Analyze a single file for performance issues"""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Analyze for React-specific issues
            self.analyze_react_hooks(content, file_path)
            self.analyze_async_operations(content, file_path)
            self.analyze_loops_and_recursion(content, file_path)
            self.analyze_event_handlers(content, file_path)
            self.analyze_database_operations(content, file_path)
            self.analyze_state_updates(content, file_path)
            
        except Exception as e:
            print(f"❌ Error analyzing {file_path}: {e}")
    
    def analyze_react_hooks(self, content: str, file_path: Path):
        """Analyze React hooks for potential infinite re-renders"""
        # Check for useEffect without dependencies
        useeffect_pattern = r'useEffect\s*\(\s*[^,]*\s*\)'
        matches = re.finditer(useeffect_pattern, content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            self.issues.append({
                'type': 'infinite_render_risk',
                'severity': 'high',
                'file': str(file_path.relative_to(self.base_path)),
                'line': line_num,
                'description': 'useEffect without dependency array - potential infinite re-renders',
                'code_snippet': match.group(0)[:100] + '...',
                'recommendation': 'Add dependency array to useEffect'
            })
        
        # Check for useEffect with missing dependencies
        useeffect_deps_pattern = r'useEffect\s*\(\s*.*?\s*,\s*\[(.*?)\]\s*\)'
        deps_matches = re.finditer(useeffect_deps_pattern, content, re.MULTILINE | re.DOTALL)
        
        for match in deps_matches:
            effect_content = match.group(0)
            deps_array = match.group(1)
            
            # Look for state variables used in effect but not in dependencies
            state_vars = re.findall(r'\b(\w+)\s*(?:\(|\.)', effect_content)
            declared_deps = [dep.strip() for dep in deps_array.split(',') if dep.strip()]
            
            missing_deps = [var for var in state_vars if var not in declared_deps and var not in ['console', 'window', 'document']]
            
            if missing_deps and deps_array.strip():
                line_num = content[:match.start()].count('\n') + 1
                self.issues.append({
                    'type': 'missing_dependencies',
                    'severity': 'medium',
                    'file': str(file_path.relative_to(self.base_path)),
                    'line': line_num,
                    'description': f'Potential missing dependencies in useEffect: {missing_deps}',
                    'code_snippet': match.group(0)[:150] + '...',
                    'recommendation': 'Add missing dependencies to useEffect dependency array'
                })
    
    def analyze_async_operations(self, content: str, file_path: Path):
        """Analyze async operations for potential blocking issues"""
        # Check for await in loops
        await_in_loop_pattern = r'for\s*\([^)]*\)\s*\{[^}]*await[^}]*\}'
        matches = re.finditer(await_in_loop_pattern, content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            self.issues.append({
                'type': 'blocking_async_loop',
                'severity': 'high',
                'file': str(file_path.relative_to(self.base_path)),
                'line': line_num,
                'description': 'Await in synchronous loop - blocks execution',
                'code_snippet': match.group(0)[:150] + '...',
                'recommendation': 'Use Promise.all() or implement proper async iteration'
            })
        
        # Check for recursive async functions
        async_function_pattern = r'async\s+function\s+(\w+)'
        async_functions = re.findall(async_function_pattern, content)
        
        for func_name in async_functions:
            # Check if function calls itself
            self_call_pattern = rf'\b{func_name}\s*\('
            if re.search(self_call_pattern, content):
                matches = list(re.finditer(self_call_pattern, content))
                if len(matches) > 1:  # Function definition + self call
                    line_num = content[:matches[1].start()].count('\n') + 1
                    self.issues.append({
                        'type': 'recursive_async_function',
                        'severity': 'high',
                        'file': str(file_path.relative_to(self.base_path)),
                        'line': line_num,
                        'description': f'Recursive async function "{func_name}" - potential infinite recursion',
                        'code_snippet': f'{func_name}() calls itself',
                        'recommendation': 'Add proper termination conditions and depth limits'
                    })
    
    def analyze_loops_and_recursion(self, content: str, file_path: Path):
        """Analyze for potentially infinite loops"""
        # Check for while(true) loops without break conditions
        while_true_pattern = r'while\s*\(\s*true\s*\)\s*\{([^}]+)\}'
        matches = re.finditer(while_true_pattern, content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            loop_body = match.group(1)
            if 'break' not in loop_body and 'return' not in loop_body:
                line_num = content[:match.start()].count('\n') + 1
                self.issues.append({
                    'type': 'infinite_loop_risk',
                    'severity': 'critical',
                    'file': str(file_path.relative_to(self.base_path)),
                    'line': line_num,
                    'description': 'while(true) loop without visible break condition',
                    'code_snippet': match.group(0)[:150] + '...',
                    'recommendation': 'Add proper break conditions or timeout mechanism'
                })
        
        # Check for do-while loops with constant conditions
        do_while_pattern = r'do\s*\{([^}]+)\}\s*while\s*\([^)]+\)'
        matches = re.finditer(do_while_pattern, content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            self.performance_issues.append({
                'type': 'do_while_loop',
                'severity': 'medium',
                'file': str(file_path.relative_to(self.base_path)),
                'line': line_num,
                'description': 'do-while loop detected - verify termination conditions',
                'code_snippet': match.group(0)[:150] + '...',
                'recommendation': 'Ensure loop termination conditions are correct'
            })
    
    def analyze_event_handlers(self, content: str, file_path: Path):
        """Analyze event handlers for performance issues"""
        # Check for event handlers without proper cleanup
        event_listener_pattern = r'addEventListener\s*\(\s*[\'"](\w+)[\'"]'
        add_listeners = re.findall(event_listener_pattern, content)
        
        remove_listener_pattern = r'removeEventListener\s*\(\s*[\'"](\w+)[\'"]'
        remove_listeners = re.findall(remove_listener_pattern, content)
        
        unmatched_listeners = set(add_listeners) - set(remove_listeners)
        
        if unmatched_listeners:
            self.issues.append({
                'type': 'memory_leak_risk',
                'severity': 'medium',
                'file': str(file_path.relative_to(self.base_path)),
                'line': 0,
                'description': f'Event listeners without cleanup: {unmatched_listeners}',
                'code_snippet': f'addEventListener for: {", ".join(unmatched_listeners)}',
                'recommendation': 'Add removeEventListener in cleanup/useEffect return'
            })
        
        # Check for inline event handlers that might cause excessive re-renders
        inline_handler_pattern = r'(?:onClick|onChange|onKeyPress|onSubmit)\s*=\s*\{[^}]*(?:=>|function)[^}]*\}'
        matches = list(re.finditer(inline_handler_pattern, content))
        
        if len(matches) > 5:  # Multiple inline handlers
            self.performance_issues.append({
                'type': 'excessive_inline_handlers',
                'severity': 'low',
                'file': str(file_path.relative_to(self.base_path)),
                'line': 0,
                'description': f'Multiple inline event handlers ({len(matches)}) - may cause re-renders',
                'code_snippet': f'{len(matches)} inline handlers found',
                'recommendation': 'Consider using useCallback for event handlers'
            })
    
    def analyze_database_operations(self, content: str, file_path: Path):
        """Analyze database operations for performance bottlenecks"""
        # Check for database operations in loops
        db_operation_pattern = r'(?:getResultsArray|getSingleResult|executeQuery)\s*\('
        db_matches = list(re.finditer(db_operation_pattern, content))
        
        for match in db_matches:
            # Check if this operation is inside a loop
            before_match = content[:match.start()]
            loop_indicators = ['for ', 'while ', 'forEach', 'map(']
            
            # Simple heuristic: check for loop keywords in the same block
            lines_before = before_match.split('\n')[-10:]  # Last 10 lines
            context = '\n'.join(lines_before)
            
            if any(indicator in context for indicator in loop_indicators):
                line_num = before_match.count('\n') + 1
                self.issues.append({
                    'type': 'db_operation_in_loop',
                    'severity': 'high',
                    'file': str(file_path.relative_to(self.base_path)),
                    'line': line_num,
                    'description': 'Database operation potentially inside loop - performance bottleneck',
                    'code_snippet': match.group(0),
                    'recommendation': 'Move database operations outside loops or batch them'
                })
        
        # Check for missing error handling in database operations
        async_db_pattern = r'await\s+(?:getResultsArray|getSingleResult|executeQuery)\s*\([^)]*\)'
        db_awaits = re.finditer(async_db_pattern, content)
        
        for match in db_awaits:
            # Check if wrapped in try-catch
            before_match = content[:match.start()]
            after_match = content[match.end():]
            
            # Simple check for nearby try-catch
            has_try = 'try' in before_match[-200:]
            has_catch = 'catch' in after_match[:200:]
            
            if not (has_try and has_catch):
                line_num = before_match.count('\n') + 1
                self.performance_issues.append({
                    'type': 'missing_error_handling',
                    'severity': 'medium',
                    'file': str(file_path.relative_to(self.base_path)),
                    'line': line_num,
                    'description': 'Database operation without visible error handling',
                    'code_snippet': match.group(0),
                    'recommendation': 'Add try-catch for database operations'
                })
    
    def analyze_state_updates(self, content: str, file_path: Path):
        """Analyze state updates for potential issues"""
        # Check for state updates in rapid succession
        setstate_pattern = r'set\w+\s*\([^)]*\)'
        setstate_matches = list(re.finditer(setstate_pattern, content))
        
        # Group by proximity (same line or adjacent lines)
        grouped_updates = []
        current_group = []
        
        for match in setstate_matches:
            line_num = content[:match.start()].count('\n') + 1
            
            if not current_group or line_num - current_group[-1]['line'] <= 2:
                current_group.append({'match': match, 'line': line_num})
            else:
                if len(current_group) > 1:
                    grouped_updates.append(current_group)
                current_group = [{'match': match, 'line': line_num}]
        
        if len(current_group) > 1:
            grouped_updates.append(current_group)
        
        for group in grouped_updates:
            if len(group) > 3:  # More than 3 state updates in proximity
                first_line = group[0]['line']
                self.performance_issues.append({
                    'type': 'multiple_state_updates',
                    'severity': 'medium',
                    'file': str(file_path.relative_to(self.base_path)),
                    'line': first_line,
                    'description': f'Multiple state updates in proximity ({len(group)}) - may cause re-renders',
                    'code_snippet': f'{len(group)} state updates near line {first_line}',
                    'recommendation': 'Consider batching state updates or using useReducer'
                })
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        report = {
            'timestamp': str(Path(__file__).stat().st_mtime),
            'analysis_summary': {
                'total_issues': len(self.issues),
                'critical_issues': len([i for i in self.issues if i['severity'] == 'critical']),
                'high_severity': len([i for i in self.issues if i['severity'] == 'high']),
                'medium_severity': len([i for i in self.issues if i['severity'] == 'medium']),
                'low_severity': len([i for i in self.issues if i['severity'] == 'low']),
                'performance_issues': len(self.performance_issues)
            },
            'critical_issues': [i for i in self.issues if i['severity'] == 'critical'],
            'high_priority_issues': [i for i in self.issues if i['severity'] == 'high'],
            'all_issues': self.issues,
            'performance_issues': self.performance_issues,
            'recommendations': self.generate_recommendations()
        }
        
        return report
    
    def generate_recommendations(self) -> List[Dict[str, Any]]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Critical issues
        critical_count = len([i for i in self.issues if i['severity'] == 'critical'])
        if critical_count > 0:
            recommendations.append({
                'priority': 'immediate',
                'category': 'critical_bugs',
                'issue': f'{critical_count} critical issues found',
                'action': 'Fix infinite loops and blocking operations immediately',
                'impact': 'These issues can cause complete application freeze'
            })
        
        # High severity issues
        high_count = len([i for i in self.issues if i['severity'] == 'high'])
        if high_count > 0:
            recommendations.append({
                'priority': 'high',
                'category': 'performance_blocking',
                'issue': f'{high_count} high-severity performance issues',
                'action': 'Address useEffect dependency issues and async operation problems',
                'impact': 'These issues likely cause the loading to get stuck'
            })
        
        # Database performance
        db_issues = [i for i in self.issues if i['type'] in ['db_operation_in_loop', 'missing_error_handling']]
        if db_issues:
            recommendations.append({
                'priority': 'high',
                'category': 'database_performance',
                'issue': f'{len(db_issues)} database performance issues',
                'action': 'Optimize database operations and add proper error handling',
                'impact': 'Database bottlenecks are likely causing slow loading'
            })
        
        # Memory leaks
        memory_issues = [i for i in self.issues if 'memory_leak' in i['type']]
        if memory_issues:
            recommendations.append({
                'priority': 'medium',
                'category': 'memory_management',
                'issue': f'{len(memory_issues)} potential memory leak sources',
                'action': 'Add proper cleanup for event listeners and subscriptions',
                'impact': 'Memory leaks cause performance degradation over time'
            })
        
        return recommendations

def main():
    """Main analysis function"""
    print("🔍 Code Analysis Agent - Infinite Loop and Blocking Operation Detection")
    print("=" * 70)
    
    # Determine the base path (archi-site directory)
    current_dir = Path(__file__).parent
    base_path = current_dir.parent  # Go up one level from temp to archi-site
    
    if not base_path.exists():
        print(f"❌ Base path not found: {base_path}")
        return
    
    print(f"📁 Analyzing codebase at: {base_path}")
    
    # Initialize analyzer
    analyzer = CodeAnalyzer(str(base_path))
    
    # Run analysis
    report = analyzer.analyze_all_files()
    
    # Save report
    report_path = current_dir / "code_analysis_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n📊 Analysis Complete!")
    print("=" * 50)
    print(f"📄 Report saved to: {report_path}")
    print(f"🚨 Critical issues: {report['analysis_summary']['critical_issues']}")
    print(f"⚠️  High severity: {report['analysis_summary']['high_severity']}")
    print(f"📊 Medium severity: {report['analysis_summary']['medium_severity']}")
    print(f"📈 Performance issues: {report['analysis_summary']['performance_issues']}")
    print(f"💡 Recommendations: {len(report['recommendations'])}")
    
    # Print top issues
    if report['critical_issues']:
        print("\n🚨 CRITICAL ISSUES:")
        for issue in report['critical_issues'][:3]:
            print(f"  - {issue['file']}:{issue['line']} - {issue['description']}")
    
    if report['high_priority_issues']:
        print("\n⚠️  HIGH PRIORITY ISSUES:")
        for issue in report['high_priority_issues'][:5]:
            print(f"  - {issue['file']}:{issue['line']} - {issue['description']}")
    
    # Print key recommendations
    if report['recommendations']:
        print("\n💡 KEY RECOMMENDATIONS:")
        for rec in report['recommendations'][:3]:
            print(f"  - {rec['priority'].upper()}: {rec['action']}")
    
    print(f"\n✅ Analysis complete. Check {report_path} for detailed findings.")

if __name__ == "__main__":
    main()