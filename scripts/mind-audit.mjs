#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const MIND_ROOT = "/Users/doublegreen/Library/Mobile Documents/com~apple~CloudDocs/MIND";
const AUDIT_CONFIG = {
  checkTypescript: true,
  checkImports: true,
  checkEnv: true,
  checkSecurity: true,
  checkPerformance: true,
  checkDocumentation: true,
  checkDeployment: true
};

class MindAuditor {
  constructor() {
    this.issues = [];
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      warnings: 0,
      errors: 0
    };
  }

  async audit() {
    console.log("🔍 Iniciando auditoria completa do MIND Protocol...\n");
    
    await this.checkProjectStructure();
    await this.checkTypescriptFiles();
    await this.checkEnvironmentFiles();
    await this.checkSecurity();
    await this.checkDocumentation();
    await this.checkDeployment();
    await this.checkPerformance();
    
    this.generateReport();
  }

  async checkProjectStructure() {
    console.log("📁 Verificando estrutura do projeto...");
    
    const requiredDirs = [
      'agent-cards',
      'apps',
      'scripts',
      'docs',
      '.github'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(MIND_ROOT, dir);
      if (!fs.existsSync(dirPath)) {
        this.addIssue('error', `Diretório necessário não encontrado: ${dir}`, dirPath);
      }
    }

    // Check agent-cards structure
    const agentCardsPath = path.join(MIND_ROOT, 'agent-cards');
    if (fs.existsSync(agentCardsPath)) {
      const requiredAgentFiles = ['products', 'specs', 'src/sdks'];
      for (const subDir of requiredAgentFiles) {
        const subPath = path.join(agentCardsPath, subDir);
        if (!fs.existsSync(subPath)) {
          this.addIssue('warning', `Estrutura de agent-cards incompleta: ${subDir}`, subPath);
        }
      }
    }
  }

  async checkTypescriptFiles() {
    if (!AUDIT_CONFIG.checkTypescript) return;
    
    console.log("📝 Verificando arquivos TypeScript...");
    
    const tsFiles = await this.findFiles(MIND_ROOT, '.ts');
    const tsxFiles = await this.findFiles(MIND_ROOT, '.tsx');
    const allFiles = [...tsFiles, ...tsxFiles];
    
    this.stats.filesScanned += allFiles.length;

    for (const file of allFiles) {
      await this.checkTypeScriptFile(file);
    }
  }

  async checkTypeScriptFile(filePath) {
    try {
      const content = await fsp.readFile(filePath, 'utf8');
      
      // Check for common issues
      if (content.includes('any') && !content.includes('// eslint-disable-next-line @typescript-eslint/no-explicit-any')) {
        this.addIssue('warning', 'Uso de tipo `any` detectado', filePath);
      }

      if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('demo')) {
        this.addIssue('warning', 'console.log em código de produção', filePath);
      }

      // Check import paths
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
          // Check if relative import exists
          const resolvedPath = this.resolveImportPath(filePath, importPath);
          if (!fs.existsSync(resolvedPath) && !resolvedPath.endsWith('.d.ts')) {
            this.addIssue('error', `Import não resolvido: ${importPath}`, filePath);
          }
        }
      }

    } catch (error) {
      this.addIssue('error', `Erro ao ler arquivo: ${error.message}`, filePath);
    }
  }

  resolveImportPath(filePath, importPath) {
    const dir = path.dirname(filePath);
    
    if (importPath.startsWith('.')) {
      return path.resolve(dir, importPath);
    }
    
    if (importPath.startsWith('/')) {
      return path.join(MIND_ROOT, importPath.slice(1));
    }
    
    // For node_modules, we can't easily check existence
    return importPath;
  }

  async checkEnvironmentFiles() {
    if (!AUDIT_CONFIG.checkEnv) return;
    
    console.log("🔧 Verificando arquivos de ambiente...");
    
    const envExample = path.join(MIND_ROOT, '.env.example');
    const envFile = path.join(MIND_ROOT, '.env');
    
    if (fs.existsSync(envExample)) {
      const exampleContent = await fsp.readFile(envExample, 'utf8');
      const requiredVars = exampleContent.split('\n')
        .filter(line => line.trim() && !line.startsWith('#') && line.includes('='))
        .map(line => line.split('=')[0].trim());
      
      if (fs.existsSync(envFile)) {
        const envContent = await fsp.readFile(envFile, 'utf8');
        const envVars = envContent.split('\n')
          .filter(line => line.trim() && !line.startsWith('#') && line.includes('='))
          .map(line => line.split('=')[0].trim());
        
        for (const requiredVar of requiredVars) {
          if (!envVars.includes(requiredVar)) {
            this.addIssue('warning', `Variável de ambiente faltando: ${requiredVar}`, envFile);
          }
        }
      } else {
        this.addIssue('warning', 'Arquivo .env não encontrado (baseado em .env.example)', envFile);
      }
    }
  }

  async checkSecurity() {
    if (!AUDIT_CONFIG.checkSecurity) return;
    
    console.log("🔒 Verificando segurança...");
    
    // Check for hardcoded secrets
    const allFiles = await this.findFiles(MIND_ROOT, ['.ts', '.tsx', '.js', '.json', '.env']);
    
    const secretPatterns = [
      /api[_-]?key[\s=:]*['"][^'"]{10,}['"]/gi,
      /secret[\s=:]*['"][^'"]{8,}['"]/gi,
      /password[\s=:]*['"][^'"]{6,}['"]/gi,
      /private[_-]?key[\s=:]*['"][^'"]{40,}['"]/gi
    ];

    for (const file of allFiles) {
      try {
        const content = await fsp.readFile(file, 'utf8');
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            this.addIssue('error', 'Possível segredo hardcoded detectado', file);
            break;
          }
        }

        // Check for eval
        if (content.includes('eval(') && !file.includes('test')) {
          this.addIssue('error', 'Uso de eval() detectado', file);
        }

      } catch (error) {
        // Skip files we can't read
      }
    }
  }

  async checkDocumentation() {
    if (!AUDIT_CONFIG.checkDocumentation) return;
    
    console.log("📚 Verificando documentação...");
    
    const requiredDocs = [
      'README.md',
      'AGENTS.md',
      'SOLANA_PROTOCOL_SPEC.md'
    ];

    for (const doc of requiredDocs) {
      const docPath = path.join(MIND_ROOT, doc);
      if (!fs.existsSync(docPath)) {
        this.addIssue('warning', `Documentação necessária não encontrada: ${doc}`, docPath);
      } else {
        const content = await fsp.readFile(docPath, 'utf8');
        if (content.length < 100) {
          this.addIssue('warning', `Documentação muito curta: ${doc}`, docPath);
        }
      }
    }
  }

  async checkDeployment() {
    if (!AUDIT_CONFIG.checkDeployment) return;
    
    console.log("🚀 Verificando configurações de deployment...");
    
    // Check Vercel config
    const vercelConfig = path.join(MIND_ROOT, 'vercel.json');
    if (fs.existsSync(vercelConfig)) {
      try {
        const config = JSON.parse(await fsp.readFile(vercelConfig, 'utf8'));
        if (!config.builds || !config.builds.length) {
          this.addIssue('warning', 'Configuração Vercel incompleta', vercelConfig);
        }
      } catch (error) {
        this.addIssue('error', `Erro ao ler vercel.json: ${error.message}`, vercelConfig);
      }
    }

    // Check GitHub workflows
    const workflowsDir = path.join(MIND_ROOT, '.github', 'workflows');
    if (fs.existsSync(workflowsDir)) {
      const workflowFiles = await this.findFiles(workflowsDir, '.yml');
      for (const workflow of workflowFiles) {
        await this.checkWorkflowFile(workflow);
      }
    }
  }

  async checkWorkflowFile(workflowPath) {
    try {
      const content = await fsp.readFile(workflowPath, 'utf8');
      
      if (!content.includes('on:') || !content.includes('jobs:')) {
        this.addIssue('warning', 'Workflow GitHub incompleto', workflowPath);
      }

      // Check for common security issues in workflows
      if (content.includes('secrets.GITHUB_TOKEN') && !content.includes('permissions:')) {
        this.addIssue('warning', 'Workflow sem permissões explícitas definidas', workflowPath);
      }

    } catch (error) {
      this.addIssue('error', `Erro ao ler workflow: ${error.message}`, workflowPath);
    }
  }

  async checkPerformance() {
    if (!AUDIT_CONFIG.checkPerformance) return;
    
    console.log("⚡ Verificando performance...");
    
    // Check for large files
    const largeFiles = await this.findLargeFiles(MIND_ROOT, 1000000); // 1MB
    for (const file of largeFiles) {
      this.addIssue('warning', `Arquivo muito grande (>1MB): ${path.basename(file)}`, file);
    }

    // Check for duplicate files
    await this.checkDuplicateFiles();
  }

  async findFiles(dir, extensions) {
    const results = [];
    
    async function scan(currentDir) {
      try {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (Array.isArray(extensions) ? extensions.includes(ext) : ext === extensions) {
              results.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }

    await scan(dir);
    return results;
  }

  async findLargeFiles(dir, sizeLimit) {
    const results = [];
    
    async function scan(currentDir) {
      try {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const stats = await fsp.stat(fullPath);
            if (stats.size > sizeLimit) {
              results.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }

    await scan(dir);
    return results;
  }

  async checkDuplicateFiles() {
    // Basic duplicate check by filename
    const allFiles = await this.findFiles(MIND_ROOT, ['.ts', '.tsx', '.js', '.json']);
    const fileMap = new Map();
    
    for (const file of allFiles) {
      const basename = path.basename(file);
      if (fileMap.has(basename)) {
        this.addIssue('warning', `Possível arquivo duplicado: ${basename}`, file);
      } else {
        fileMap.set(basename, file);
      }
    }
  }

  addIssue(level, message, filePath) {
    const relativePath = path.relative(MIND_ROOT, filePath);
    const issue = {
      level,
      message,
      file: relativePath,
      timestamp: new Date().toISOString()
    };
    
    this.issues.push(issue);
    
    if (level === 'error') {
      this.stats.errors++;
    } else if (level === 'warning') {
      this.stats.warnings++;
    }
    
    this.stats.issuesFound++;
  }

  generateReport() {
    console.log("\n" + "=".repeat(80));
    console.log("📊 RELATÓRIO DE AUDITORIA - MIND PROTOCOL");
    console.log("=".repeat(80));
    
    console.log(`\n📈 Estatísticas:`);
    console.log(`   • Arquivos escaneados: ${this.stats.filesScanned}`);
    console.log(`   • Problemas encontrados: ${this.stats.issuesFound}`);
    console.log(`   • Erros: ${this.stats.errors}`);
    console.log(`   • Avisos: ${this.stats.warnings}`);
    
    if (this.issues.length === 0) {
      console.log("\n✅ Nenhum problema encontrado! O projeto está em excelente estado.");
      return;
    }
    
    console.log("\n🚨 PROBLEMAS ENCONTRADOS:");
    
    const errors = this.issues.filter(i => i.level === 'error');
    const warnings = this.issues.filter(i => i.level === 'warning');
    
    if (errors.length > 0) {
      console.log("\n❌ ERROS CRÍTICOS:");
      errors.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.file}] ${issue.message}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log("\n⚠️  AVISOS:");
      warnings.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.file}] ${issue.message}`);
      });
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("💡 RECOMENDAÇÕES:");
    
    if (errors.length > 0) {
      console.log("1. Resolva os erros críticos primeiro");
      console.log("2. Verifique imports e dependências");
    }
    
    if (warnings.length > 0) {
      console.log("3. Revise os avisos de segurança");
      console.log("4. Complete a documentação faltante");
    }
    
    console.log("5. Execute testes completos após correções");
    console.log("=".repeat(80));
  }
}

// Execute audit
async function main() {
  try {
    const auditor = new MindAuditor();
    await auditor.audit();
    
    // Save detailed report
    const reportPath = path.join(MIND_ROOT, 'audit-report.json');
    await fsp.writeFile(
      reportPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: auditor.stats,
        issues: auditor.issues,
        config: AUDIT_CONFIG
      }, null, 2)
    );
    
    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Erro durante auditoria:', error.message);
    process.exit(1);
  }
}

main();