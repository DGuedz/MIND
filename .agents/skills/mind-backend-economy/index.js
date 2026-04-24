// MIND Backend Economy Skill - VSC Token Optimization
// Strict compliance with VSC economy mode policies

class MindBackendEconomy {
  constructor() {
    this.policies = {
      NO_EMOJIS: true,
      MINIMAL_FORMATTING: true,
      ESSENTIAL_CONTENT: true,
      CLEAR_CTAS: true,
      TOKEN_OPTIMIZED: true
    };
    
    this.metrics = {
      tokensSaved: 0,
      optimizationsApplied: 0,
      complianceChecks: 0
    };
  }

  // Apply VSC economy mode to any content
  applyEconomyMode(content) {
    this.metrics.complianceChecks++;
    
    let optimized = content;
    
    // Remove decorative emojis (policy: NO_EMOJIS)
    optimized = this.removeDecorativeEmojis(optimized);
    
    // Minimize formatting (policy: MINIMAL_FORMATTING)
    optimized = this.minimizeFormatting(optimized);
    
    // Focus on essential content (policy: ESSENTIAL_CONTENT)
    optimized = this.extractEssentialContent(optimized);
    
    // Ensure clear calls-to-action (policy: CLEAR_CTAS)
    optimized = this.clarifyCTAs(optimized);
    
    // Calculate token savings
    const originalLength = content.length;
    const optimizedLength = optimized.length;
    this.metrics.tokensSaved += (originalLength - optimizedLength);
    this.metrics.optimizationsApplied++;
    
    return optimized;
  }

  removeDecorativeEmojis(content) {
    // Remove all decorative emojis, keep only functional indicators
    return content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                 .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
                 .replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  }

  minimizeFormatting(content) {
    // Reduce excessive formatting while maintaining structure
    return content
      .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '**$1**') // Reduce bold levels
      .replace(/\_\_\_\_(.*?)\_\_\_\_/g, '__$1__')   // Reduce underline levels
      .replace(/\n{3,}/g, '\n\n')                    // Limit consecutive newlines
      .replace(/\s{2,}/g, ' ');                      // Reduce multiple spaces
  }

  extractEssentialContent(content) {
    // Focus on core message, remove redundant explanations
    const lines = content.split('\n');
    const essentialLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('<!--') &&
             !trimmed.startsWith('* Note:') &&
             !trimmed.startsWith('* Tip:');
    });
    
    return essentialLines.join('\n');
  }

  clarifyCTAs(content) {
    // Ensure calls-to-action are direct and unambiguous
    return content
      .replace(/please consider/g, 'execute')
      .replace(/you might want to/g, '')
      .replace(/it would be great if/g, 'perform')
      .replace(/we should probably/g, 'execute');
  }

  getMetrics() {
    return {
      tokensSaved: this.metrics.tokensSaved,
      optimizationsApplied: this.metrics.optimizationsApplied,
      complianceChecks: this.metrics.complianceChecks,
      averageSavingsPerCheck: this.metrics.tokensSaved / Math.max(1, this.metrics.complianceChecks)
    };
  }

  // Validate content against VSC economy policies
  validateCompliance(content) {
    const checks = {
      hasDecorativeEmojis: /[\u{1F300}-\u{1F9FF}]/gu.test(content),
      hasExcessiveFormatting: /\*\*\*\*|\_\_\_\_|\n{4,}|\s{3,}/.test(content),
      hasNonEssentialContent: /please consider|you might want to|it would be great if|we should probably/i.test(content),
      hasAmbiguousCTAs: /maybe|perhaps|possibly|consider/i.test(content)
    };

    return {
      compliant: !Object.values(checks).some(check => check),
      violations: Object.entries(checks)
        .filter(([_, value]) => value)
        .map(([key]) => key)
    };
  }
}

// Export for skill usage
module.exports = MindBackendEconomy;