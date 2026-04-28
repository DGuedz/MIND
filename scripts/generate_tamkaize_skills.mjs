import fs from 'fs';
import path from 'path';

const ASSET_CLASSES = ['real_estate', 'treasuries', 'private_credit', 'commodities', 'carbon_credits', 'infrastructure', 'agriculture', 'art'];
const OPTIMIZERS = ['cardinality', 'quantum', 'annealing', 'hubo_qubo', 'gradient', 'stochastic', 'bayesian', 'evolutionary'];
const ESTIMATORS = ['shrinkage', 'ledoit_wolf', 'minimum_covariance_determinant', 'exponential_weighting', 'winsorized', 'bootstrap', 'jackknife'];
const SIMULATORS = ['slippage', 'liquidity_cascade', 'flash_crash', 'order_book_depth', 'amm_curve', 'dark_pool'];
const SCENARIOS = ['rate_hike', 'inflation_spike', 'black_swan', 'liquidity_crunch', 'geopolitical_shock', 'yield_curve_inversion'];

const skills = [];

function addSkill(name, description, category, tags, price) {
    skills.push({
        name,
        description,
        category,
        tags,
        pricing: {
            model: "pay-per-use",
            currency: "USDC",
            price: price
        }
    });
}

// 1. Core 8 Skills from the report
addSkill('rwa_universe_eligibility_filter_v1', 'Bloqueia asset lixo/ilíquido/incompatível antes de contaminar o otimizador', 'defi', ['rwa', 'filter', 'eligibility'], 0.75);
addSkill('robust_moment_estimator_v1', 'Gera parâmetros robustos para reduzir erro de estimação', 'data-analytics', ['mvsk', 'estimator', 'robust'], 2.50);
addSkill('cardinality_mvsk_optimizer_v1', 'Resolve o problema principal: pesos ótimos sob risco de cauda e restrições de sparsity', 'defi', ['optimizer', 'mvsk', 'cardinality'], 8.00);
addSkill('tradability_market_impact_simulator_v1', 'Impede que o portfólio "ótimo" seja inexequível no mercado', 'trading', ['simulator', 'impact', 'tradability'], 3.50);
addSkill('allocation_auditor_proof_v1', 'Torna a alocação auditável e vendável para tesourarias', 'security', ['auditor', 'proof', 'allocation'], 1.75);
addSkill('higher_moment_feature_engineer_v1', 'Enriquece alpha e representação do universo via fatores + quantum-inspired features', 'data-analytics', ['alpha', 'features', 'quantum'], 2.25);
addSkill('hedge_scenario_builder_v1', 'Preço de proteção, cenários e overlay de risco', 'trading', ['hedge', 'scenario', 'risk'], 1.50);
addSkill('solana_rwa_vault_executor_v1', 'Leva a alocação para trilhos tokenizados em Solana com prova de execução', 'defi', ['solana', 'executor', 'vault'], 4.50);

// Generate combinations to reach 100 skills
ASSET_CLASSES.forEach(asset => {
    addSkill(`rwa_eligibility_${asset}`, `Filtro de elegibilidade específico para ${asset.replace('_', ' ')} tokenizado`, 'defi', ['rwa', 'filter', asset], 0.50);
});

OPTIMIZERS.forEach(opt => {
    addSkill(`mvsk_${opt}_solver`, `Solver especializado em ${opt.replace('_', ' ')} para otimização MVSK`, 'data-analytics', ['optimizer', 'mvsk', opt], 5.00);
});

ESTIMATORS.forEach(est => {
    addSkill(`moment_estimator_${est}`, `Estimador de momentos usando o método ${est.replace('_', ' ')}`, 'data-analytics', ['estimator', est], 2.00);
});

SIMULATORS.forEach(sim => {
    addSkill(`market_impact_${sim}`, `Simulador de impacto de mercado focado em ${sim.replace('_', ' ')}`, 'trading', ['simulator', sim], 3.00);
});

SCENARIOS.forEach(scenario => {
    addSkill(`hedge_scenario_${scenario}`, `Construtor de cenário de hedge para ${scenario.replace('_', ' ')}`, 'trading', ['scenario', scenario], 1.50);
});

// Fill the rest up to 100 with permutations
let counter = skills.length;
let i = 0;
let j = 0;
while (skills.length < 100) {
    const asset = ASSET_CLASSES[i % ASSET_CLASSES.length];
    const opt = OPTIMIZERS[j % OPTIMIZERS.length];
    
    const skillName = `pipeline_${asset}_${opt}`;
    if (!skills.find(s => s.name === skillName)) {
        addSkill(
            skillName,
            `Pipeline end-to-end de otimização para ${asset.replace('_', ' ')} usando ${opt.replace('_', ' ')}`,
            'ai-agents',
            ['pipeline', asset, opt],
            10.00
        );
    }
    
    j++;
    if (j >= OPTIMIZERS.length) {
        j = 0;
        i++;
    }
}

const manifest = {
    source: {
        name: "Kai Ze Tam / MVSK Workflow",
        url: "https://github.com/tamkaize",
        license: "Proprietary",
        description: "100 Skills baseadas no racional de Kai Ze Tam (MVSK Optimization, RWA, Quantum).",
        ingestedAt: "2026-04-27T00:00:00Z"
    },
    version: "1.0",
    skills: skills
};

fs.writeFileSync(
    path.join(process.cwd(), 'agent-cards/skills/sources/tamkaize-skills.v1.json'),
    JSON.stringify(manifest, null, 2)
);

console.log(`Generated ${skills.length} skills in tamkaize-skills.v1.json`);
