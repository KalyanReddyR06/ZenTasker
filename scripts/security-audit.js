#!/usr/bin/env node

/**
 * Security Audit Script for ZenTasker
 * This script checks for common security vulnerabilities and best practices
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security checks configuration
const SECURITY_CHECKS = {
  hardcodedSecrets: {
    patterns: [
      /apiKey\s*[:=]\s*["'][^"']+["']/gi,
      /password\s*[:=]\s*["'][^"']+["']/gi,
      /secret\s*[:=]\s*["'][^"']+["']/gi,
      /token\s*[:=]\s*["'][^"']+["']/gi,
      /key\s*[:=]\s*["'][^"']+["']/gi
    ],
    severity: 'HIGH'
  },
  consoleLogs: {
    patterns: [
      /console\.log\(/gi,
      /console\.error\(/gi,
      /console\.warn\(/gi,
      /console\.info\(/gi
    ],
    severity: 'MEDIUM'
  },
  evalUsage: {
    patterns: [
      /eval\s*\(/gi,
      /new\s+Function\s*\(/gi,
      /setTimeout\s*\(\s*["'][^"']*["']/gi,
      /setInterval\s*\(\s*["'][^"']*["']/gi
    ],
    severity: 'CRITICAL'
  },
  innerHTML: {
    patterns: [
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi,
      /document\.write\s*\(/gi
    ],
    severity: 'HIGH'
  },
  sqlInjection: {
    patterns: [
      /SELECT.*\+.*\$/gi,
      /INSERT.*\+.*\$/gi,
      /UPDATE.*\+.*\$/gi,
      /DELETE.*\+.*\$/gi
    ],
    severity: 'HIGH'
  },
  xssVulnerabilities: {
    patterns: [
      /dangerouslySetInnerHTML/gi,
      /<script/gi,
      /javascript:/gi
    ],
    severity: 'HIGH'
  }
};

// File extensions to check
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage'];

/**
 * Check if a file should be scanned
 */
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return FILE_EXTENSIONS.includes(ext);
}

/**
 * Check if a directory should be excluded
 */
function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName);
}

/**
 * Scan a file for security issues
 */
function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    Object.entries(SECURITY_CHECKS).forEach(([checkName, check]) => {
      check.patterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
            issues.push({
              file: filePath,
              line: lineNumber,
              issue: checkName,
              severity: check.severity,
              match: match.trim(),
              description: getIssueDescription(checkName)
            });
          });
        }
      });
    });
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
  }
  
  return issues;
}

/**
 * Get issue description
 */
function getIssueDescription(issueType) {
  const descriptions = {
    hardcodedSecrets: 'Hardcoded secrets found. Use environment variables instead.',
    consoleLogs: 'Console statements found. Remove in production.',
    evalUsage: 'Dangerous eval usage detected. This is a security risk.',
    innerHTML: 'innerHTML usage detected. Use textContent or sanitize input.',
    sqlInjection: 'Potential SQL injection vulnerability detected.',
    xssVulnerabilities: 'Potential XSS vulnerability detected.'
  };
  
  return descriptions[issueType] || 'Security issue detected.';
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
  const issues = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeDir(item)) {
          issues.push(...scanDirectory(fullPath));
        }
      } else if (stat.isFile() && shouldScanFile(fullPath)) {
        issues.push(...scanFile(fullPath));
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return issues;
}

/**
 * Generate security report
 */
function generateReport(issues) {
  const report = {
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'CRITICAL').length,
      high: issues.filter(i => i.severity === 'HIGH').length,
      medium: issues.filter(i => i.severity === 'MEDIUM').length,
      low: issues.filter(i => i.severity === 'LOW').length
    },
    issues: issues,
    timestamp: new Date().toISOString()
  };
  
  return report;
}

/**
 * Print report to console
 */
function printReport(report) {
  console.log('\n🔒 Security Audit Report');
  console.log('='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Total Issues: ${report.summary.total}`);
  console.log(`   Critical: ${report.summary.critical}`);
  console.log(`   High: ${report.summary.high}`);
  console.log(`   Medium: ${report.summary.medium}`);
  console.log(`   Low: ${report.summary.low}`);
  console.log(`\n⏰ Timestamp: ${report.timestamp}`);
  
  if (report.issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    console.log('-'.repeat(50));
    
    const groupedIssues = report.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});
    
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
      if (groupedIssues[severity]) {
        console.log(`\n${severity} Severity Issues:`);
        groupedIssues[severity].forEach(issue => {
          console.log(`  📁 ${issue.file}:${issue.line}`);
          console.log(`     ${issue.description}`);
          console.log(`     Match: ${issue.match.substring(0, 50)}...`);
        });
      }
    });
  } else {
    console.log('\n✅ No security issues found!');
  }
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Main function
 */
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log('🔍 Starting security audit...');
  console.log(`📁 Scanning: ${projectRoot}`);
  
  const issues = scanDirectory(projectRoot);
  const report = generateReport(issues);
  
  printReport(report);
  
  // Exit with error code if critical or high severity issues found
  if (report.summary.critical > 0 || report.summary.high > 0) {
    console.log('\n❌ Security audit failed! Critical or high severity issues found.');
    process.exit(1);
  } else {
    console.log('\n✅ Security audit passed!');
    process.exit(0);
  }
}

// Run the audit
main(); 