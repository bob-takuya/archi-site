#!/usr/bin/env python3
"""
Data Mapping Verification Agent
Investigates the disconnect between database schema and application expectations.
"""

import json
import re
from pathlib import Path

def analyze_field_mapping_issues():
    """
    Comprehensive analysis of field mapping disconnects
    """
    analysis = {
        "timestamp": "2025-07-12T14:15:00Z",
        "analysis_type": "Data Mapping Verification",
        "critical_issues_found": [],
        "field_mapping_mismatches": [],
        "service_interface_mismatches": [],
        "recommendations": []
    }
    
    # 1. Analyze TypeScript interface expectations vs database field names
    typescript_interface_fields = {
        "ZAR_ID": "number",
        "ZAR_NAME": "string", 
        "ZAR_KANA": "string?",
        "ZAR_NAMEENG": "string?",
        "ZAR_BIRTHYEAR": "number?",
        "ZAR_DEATHYEAR": "number?", 
        "ZAR_BIRTHPLACE": "string?",
        "ZAR_NATIONALITY": "string?",
        "ZAR_CATEGORY": "string?",
        "ZAR_SCHOOL": "string?",
        "ZAR_OFFICE": "string?",
        "ZAR_BIO": "string?",
        "ZAR_MAINWORKS": "string?",
        "ZAR_AWARDS": "string?",
        "ZAR_IMAGE": "string?",
        "ZAR_CREATED": "string?",
        "ZAR_MODIFIED": "string?"
    }
    
    # 2. Fields used in ArchitectsPage queries (WRONG PREFIX!)
    architects_page_query_fields = {
        "ZAT_NATIONALITY": "used in line 185",
        "ZAT_CATEGORY": "used in line 187", 
        "ZAT_SCHOOL": "used in line 189",
        "ZAT_BIRTHYEAR": "used in line 191",
        "ZAT_DEATHYEAR": "used in line 193"
    }
    
    # 3. ArchitectService actual field names (CORRECT PREFIX!)
    architect_service_fields = {
        "ZAR_ID": "in WHERE clause line 16",
        "ZAR_NAME": "sort field line 37",
        "ZAR_KANA": "search field line 56",
        "ZAR_NAMEENG": "search field line 56", 
        "ZAR_NATIONALITY": "filter field line 61",
        "ZAR_CATEGORY": "filter field line 66",
        "ZAR_SCHOOL": "filter field line 71",
        "ZAR_BIRTHYEAR": "filter fields line 76-81",
        "ZAR_DEATHYEAR": "filter field line 86"
    }
    
    # CRITICAL ISSUE #1: Field name prefix mismatch
    analysis["critical_issues_found"].append({
        "issue": "Field Name Prefix Mismatch",
        "severity": "CRITICAL",
        "description": "ArchitectsPage uses ZAT_ prefix but database and TypeScript interface use ZAR_ prefix",
        "impact": "Queries will fail to return data or return wrong columns",
        "evidence": {
            "typescript_interface_uses": "ZAR_ prefix for all fields",
            "architect_service_uses": "ZAR_ prefix for all fields", 
            "architects_page_uses": "ZAT_ prefix in queries (lines 185-193)",
            "database_likely_uses": "ZAR_ prefix based on service queries"
        }
    })
    
    # Map the mismatched fields
    for zat_field, location in architects_page_query_fields.items():
        zar_equivalent = zat_field.replace("ZAT_", "ZAR_")
        analysis["field_mapping_mismatches"].append({
            "incorrect_field": zat_field,
            "correct_field": zar_equivalent,
            "location": f"ArchitectsPage.tsx {location}",
            "fix_needed": f"Replace {zat_field} with {zar_equivalent}"
        })
    
    # CRITICAL ISSUE #2: Service interface mismatch
    analysis["critical_issues_found"].append({
        "issue": "Service Method Interface Mismatch", 
        "severity": "CRITICAL",
        "description": "ArchitectsPage calls getAllArchitects with wrong parameters",
        "impact": "Function calls will fail with TypeScript errors",
        "evidence": {
            "architects_page_calls": "getAllArchitects(page, limit, search, tags, sort, order, nat, cat, sch, birthFrom, birthTo, death)",
            "actual_service_signature": "getAllArchitects(page, limit, searchTerm, tags, sortBy, sortOrder, options_object)",
            "parameters_mismatch": "Individual parameters vs options object"
        }
    })
    
    analysis["service_interface_mismatches"].append({
        "called_signature": "ArchitectService.getAllArchitects(page, 10, search, tags, sort, order, nat, cat, sch, birthFrom, birthTo, death)",
        "actual_signature": "getAllArchitects(page=1, limit=12, searchTerm='', tags=[], sortBy='ZAR_NAME', sortOrder='asc', options={})",
        "parameters_expected": {
            "page": "number",
            "limit": "number", 
            "searchTerm": "string",
            "tags": "string[]",
            "sortBy": "string",
            "sortOrder": "string",
            "options": {
                "nationality": "string?",
                "category": "string?", 
                "school": "string?",
                "birthYearFrom": "number?",
                "birthYearTo": "number?",
                "deathYear": "number?"
            }
        },
        "parameters_provided": [
            "page: number",
            "10: number", 
            "search: string",
            "tags: string[]",
            "sort: string",
            "order: string",
            "nat: string",
            "cat: string", 
            "sch: string",
            "birthFrom: number",
            "birthTo: number",
            "death: number"
        ]
    })
    
    # CRITICAL ISSUE #3: Response structure mismatch
    analysis["critical_issues_found"].append({
        "issue": "Response Structure Mismatch",
        "severity": "HIGH", 
        "description": "ArchitectsPage expects 'items' property but service returns 'results'",
        "impact": "UI will show empty list even with valid data",
        "evidence": {
            "architects_page_expects": "result.items (line 167)",
            "service_returns": "ArchitectsResponse.results", 
            "typescript_interface": "results: Architect[]"
        }
    })
    
    # CRITICAL ISSUE #4: UI component field access
    analysis["critical_issues_found"].append({
        "issue": "UI Component Field Access Issues",
        "severity": "HIGH",
        "description": "UI components access fields that don't match TypeScript interface",
        "impact": "Display shows undefined values",
        "evidence": {
            "architect_card_accesses": [
                "architect.id (line 648) - should be architect.ZAR_ID",
                "architect.name (line 663) - should be architect.ZAR_NAME", 
                "architect.nationality (line 666) - should be architect.ZAR_NATIONALITY",
                "architect.birthYear (line 666) - should be architect.ZAR_BIRTHYEAR",
                "architect.deathYear (line 666) - should be architect.ZAR_DEATHYEAR",
                "architect.tags (line 669) - not defined in interface"
            ]
        }
    })
    
    # Generate comprehensive recommendations
    analysis["recommendations"] = [
        {
            "priority": "IMMEDIATE",
            "action": "Fix Field Name Prefixes in ArchitectsPage",
            "details": "Replace all ZAT_ prefixes with ZAR_ prefixes in lines 185-193",
            "code_changes": [
                "Line 185: ZAT_NATIONALITY → ZAR_NATIONALITY", 
                "Line 187: ZAT_CATEGORY → ZAR_CATEGORY",
                "Line 189: ZAT_SCHOOL → ZAR_SCHOOL",
                "Line 191: ZAT_BIRTHYEAR → ZAR_BIRTHYEAR", 
                "Line 193: ZAT_DEATHYEAR → ZAR_DEATHYEAR"
            ]
        },
        {
            "priority": "IMMEDIATE",
            "action": "Fix Service Method Call Parameters",
            "details": "Update ArchitectsPage to call getAllArchitects with correct signature",
            "code_changes": [
                "Change from: getAllArchitects(page, 10, search, tags, sort, order, nat, cat, sch, birthFrom, birthTo, death)",
                "Change to: getAllArchitects(page, 10, search, tags, sort, order, { nationality: nat, category: cat, school: sch, birthYearFrom: birthFrom, birthYearTo: birthTo, deathYear: death })"
            ]
        },
        {
            "priority": "IMMEDIATE", 
            "action": "Fix Response Property Access",
            "details": "Update ArchitectsPage to access 'results' instead of 'items'",
            "code_changes": [
                "Line 167: result.items → result.results"
            ]
        },
        {
            "priority": "HIGH",
            "action": "Create Data Mapping Layer", 
            "details": "Create a mapping function to transform database fields to UI-friendly names",
            "implementation": "Create ArchitectMapper to transform ZAR_* fields to camelCase"
        },
        {
            "priority": "HIGH",
            "action": "Update UI Component Field Access",
            "details": "Either use ZAR_ prefixed fields or create mapped objects",
            "options": [
                "Option 1: Use architect.ZAR_NAME directly in UI",
                "Option 2: Create mapper that transforms to architect.name"
            ]
        },
        {
            "priority": "MEDIUM",
            "action": "Add TypeScript Strict Mode",
            "details": "Enable strict TypeScript checking to catch these issues at compile time"
        }
    ]
    
    # Corrected field mapping
    analysis["corrected_field_mapping"] = {
        "database_to_typescript": {
            "ZAR_ID": "id (or keep ZAR_ID)",
            "ZAR_NAME": "name (or keep ZAR_NAME)",
            "ZAR_NATIONALITY": "nationality (or keep ZAR_NATIONALITY)",
            "ZAR_BIRTHYEAR": "birthYear (or keep ZAR_BIRTHYEAR)", 
            "ZAR_DEATHYEAR": "deathYear (or keep ZAR_DEATHYEAR)",
            "ZAR_CATEGORY": "category (or keep ZAR_CATEGORY)",
            "ZAR_SCHOOL": "school (or keep ZAR_SCHOOL)"
        },
        "required_mapper_function": """
function mapArchitectFromDatabase(dbArchitect: Architect): MappedArchitect {
  return {
    id: dbArchitect.ZAR_ID,
    name: dbArchitect.ZAR_NAME,
    kana: dbArchitect.ZAR_KANA,
    nameEng: dbArchitect.ZAR_NAMEENG,
    birthYear: dbArchitect.ZAR_BIRTHYEAR,
    deathYear: dbArchitect.ZAR_DEATHYEAR,
    nationality: dbArchitect.ZAR_NATIONALITY,
    category: dbArchitect.ZAR_CATEGORY,
    school: dbArchitect.ZAR_SCHOOL,
    // ... other fields
  };
}
        """
    }
    
    analysis["summary"] = {
        "total_critical_issues": len([issue for issue in analysis["critical_issues_found"] if issue["severity"] == "CRITICAL"]),
        "total_high_issues": len([issue for issue in analysis["critical_issues_found"] if issue["severity"] == "HIGH"]),
        "primary_cause": "Field name prefix mismatch (ZAT_ vs ZAR_) and service interface mismatch",
        "estimated_fix_time": "2-4 hours",
        "impact_on_users": "Complete data display failure - no architect data shown in UI"
    }
    
    return analysis

def main():
    """Main analysis execution"""
    print("🔍 Data Mapping Verification Agent - Starting Analysis...")
    
    analysis = analyze_field_mapping_issues()
    
    # Save detailed analysis
    output_file = Path("/Users/homeserver/ai-creative-team/archi-site/temp/data_mapping_verification_report.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print(f"\n🚨 CRITICAL ISSUES FOUND: {analysis['summary']['total_critical_issues']}")
    print(f"⚠️  HIGH PRIORITY ISSUES: {analysis['summary']['total_high_issues']}")
    print(f"\n💡 PRIMARY CAUSE: {analysis['summary']['primary_cause']}")
    print(f"⏱️  ESTIMATED FIX TIME: {analysis['summary']['estimated_fix_time']}")
    print(f"👥 USER IMPACT: {analysis['summary']['impact_on_users']}")
    
    print(f"\n📄 Detailed analysis saved to: {output_file}")
    print("\n🔧 IMMEDIATE FIXES NEEDED:")
    for rec in analysis["recommendations"][:3]:
        print(f"   • {rec['action']}")
    
    return analysis

if __name__ == "__main__":
    main()