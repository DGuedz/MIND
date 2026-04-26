#!/usr/bin/env node

/**
 * MIND Protocol - Real-Time Quality & Monitoring Dashboard
 * This script monitors service health, test results, and performance metrics.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const SERVICES = {
  gateway: 'http://localhost:3000/health',
  intent: 'http://localhost:3001/health',
  market: 'http://localhost:3002/health',
  approval: 'http://localhost:3003/health',
  registry: 'http://localhost:3004/health',
  proof: 'http://localhost:3005/health',
  execution: 'http://localhost:3006/health',
  signer: 'http://localhost:3007/health',
  a2a: 'http://localhost:3008/health',
  eventRouter: 'http://localhost:3016/health'
};

const ALERT_THRESHOLDS = {
  testCoverage: 80,
  latencyMs: 500,
  errorRate: 0.05
};

async function checkServiceHealth(name, url) {
  try {
    const start = Date.now();
    const response = await fetch(url, { timeout: 2000 });
    const latency = Date.now() - start;
    
    if (response.ok) {
      return { name, status: 'UP', latency, error: null };
    } else {
      return { name, status: 'DOWN', latency, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { name, status: 'DOWN', latency: 0, error: error.message };
  }
}

async function runDashboard() {
  console.log("====================================================");
  console.log("🧠 MIND PROTOCOL - REAL-TIME QUALITY MONITORING");
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log("====================================================");

  const results = await Promise.all(
    Object.entries(SERVICES).map(([name, url]) => checkServiceHealth(name, url))
  );

  console.log("\n📡 Service Health Status:");
  results.forEach(res => {
    const statusIcon = res.status === 'UP' ? '✅' : '❌';
    const latencyInfo = res.status === 'UP' ? `(${res.latency}ms)` : '';
    const errorInfo = res.error ? `- Error: ${res.error}` : '';
    console.log(`${statusIcon} ${res.name.padEnd(12)}: ${res.status.padEnd(6)} ${latencyInfo} ${errorInfo}`);
  });

  const allUp = results.every(r => r.status === 'UP');
  const avgLatency = results.filter(r => r.status === 'UP').reduce((acc, r) => acc + r.latency, 0) / results.length;

  console.log("\n📊 Global Metrics:");
  console.log(`- Services Health: ${allUp ? 'EXCELLENT' : 'CRITICAL'}`);
  console.log(`- Avg Latency: ${avgLatency.toFixed(2)}ms`);
  
  if (!allUp) {
    console.log("\n🚨 ALERT: Some services are DOWN! Immediate action required.");
    // In a real scenario, this would send a Slack/Telegram/Discord notification
  }

  console.log("\n====================================================");
}

runDashboard();
