const YEARS = [2025, 2030, 2035, 2040, 2045, 2050];
const BASE_TARGET_LABOR = [6900, 6800, 6700, 6500, 6300, 6000]; // 総人口減に合わせた需要減（少し緩やか）

// ベースとなる国内労働人口推計 (万人) - 簡易モデル化
const BASE_DOMESTIC_LABOR = [6900, 6650, 6300, 5950, 5600, 5200];

// AIの一般的な発展カーブ (万人相当の代替) - slider value 100時のベース
const BASE_AI_AUTOMATION = [50, 250, 600, 1100, 1700, 2500];

// グラフのインスタンス
let chartInstance = null;

// UI要素
const aiSlider = document.getElementById('ai-slider');
const aiValueDisplay = document.getElementById('ai-value-display');
const foreignSlider = document.getElementById('foreign-slider');
const foreignValueDisplay = document.getElementById('foreign-value-display');
const retirementSlider = document.getElementById('retirement-slider');
const retirementValueDisplay = document.getElementById('retirement-value-display');

const currentFulfillment = document.getElementById('current-fulfillment');
const currentGap = document.getElementById('current-gap');
const conclusionText = document.getElementById('conclusion-text');


function calculateData() {
    const aiMultiplier = getAiMultiplier(aiSlider.value);
    const foreignFlow = parseInt(foreignSlider.value); // 万人/年
    const retirementBonus = parseInt(retirementSlider.value) - 65; // 65基準で+1年ごとに労働力増

    let dataDomestic = [];
    let dataForeign = [];
    let dataAI = [];
    let dataTarget = [];

    // 2025年をt=0とする
    YEARS.forEach((year, index) => {
        const yearsPassed = year - 2025;
        
        // 1. 国内労働力 (定年延長ボーナス: 1年延長につき約50万人が労働市場に残ると簡易仮定)
        let dom = BASE_DOMESTIC_LABOR[index] + (retirementBonus * 50);
        dataDomestic.push(dom);

        // 2. 外国人労働者 (累積)
        // 既存のベース分はすでに国内労働に一部含まれているとし、ここからの"純増"を計算
        let foreignAccumulated = foreignFlow * yearsPassed;
        dataForeign.push(foreignAccumulated);

        // 3. AI代替労働（人間換算）
        let aiVal = BASE_AI_AUTOMATION[index] * aiMultiplier;
        dataAI.push(aiVal);

        // 4. ターゲット要求労働力
        dataTarget.push(BASE_TARGET_LABOR[index]);
    });

    return { dataDomestic, dataForeign, dataAI, dataTarget };
}

function getAiMultiplier(sliderValue) {
    const val = parseInt(sliderValue);
    // 0: 0.2x (遅い), 100: 1.0x (標準), 200: 2.5x (爆発的)
    if (val <= 100) {
        return 0.2 + (0.8 * (val / 100));
    } else {
        return 1.0 + (1.5 * ((val - 100) / 100));
    }
}

function updateChart() {
    const { dataDomestic, dataForeign, dataAI, dataTarget } = calculateData();

    if (chartInstance) {
        chartInstance.data.datasets[0].data = dataDomestic;
        chartInstance.data.datasets[1].data = dataForeign;
        chartInstance.data.datasets[2].data = dataAI;
        chartInstance.data.datasets[3].data = dataTarget;
        chartInstance.update();
    } else {
        const ctx = document.getElementById('laborChart').getContext('2d');
        Chart.defaults.color = '#94A3B8';
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: YEARS,
                datasets: [
                    {
                        label: '国内労働人口 (定年調整込)',
                        data: dataDomestic,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.4)',
                        fill: true,
                        tension: 0.3,
                        stack: 'supply'
                    },
                    {
                        label: '外国人労働者 (累積増)',
                        data: dataForeign,
                        borderColor: '#34D399',
                        backgroundColor: 'rgba(52, 211, 153, 0.4)',
                        fill: '-1',
                        tension: 0.3,
                        stack: 'supply'
                    },
                    {
                        label: 'AIによる自動化 (人間換算)',
                        data: dataAI,
                        borderColor: '#A855F7',
                        backgroundColor: 'rgba(168, 85, 247, 0.4)',
                        fill: '-1',
                        tension: 0.3,
                        stack: 'supply'
                    },
                    {
                        label: '必要労働力 (社会維持ライン)',
                        data: dataTarget,
                        borderColor: '#F43F5E',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        stack: 'demand'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        stacked: true,
                        min: 3000,
                        max: 9000,
                        title: { display: true, text: '万人', color: '#94A3B8' }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            footer: function(tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach(function(tooltipItem) {
                                    if(tooltipItem.datasetIndex !== 3) { // ターゲットラインは除外
                                        total += tooltipItem.parsed.y;
                                    }
                                });
                                return '総供給量: ' + Math.round(total) + ' 万人';
                            }
                        }
                    }
                }
            }
        });
    }

    // サマリーテキスト・バッジの更新
    updateSummary(dataDomestic, dataForeign, dataAI);
}

function updateSummary(dom, foreign, ai) {
    const target2050 = BASE_TARGET_LABOR[BASE_TARGET_LABOR.length-1];
    // 2050年のインデックスは最後の要素
    const total2050 = dom[dom.length-1] + foreign[foreign.length-1] + ai[ai.length-1];
    
    let gap = Math.round(total2050 - target2050);
    let ratio = Math.round((total2050 / target2050) * 100);

    currentFulfillment.textContent = ratio + '%';
    
    if (gap >= 0) {
        currentGap.textContent = '+' + gap + ' 万人';
        currentGap.style.color = '#34D399';
    } else {
        currentGap.textContent = gap + ' 万人';
        currentGap.style.color = '#F43F5E';
    }

    // AIの文字列表現
    let aiStr = "標準的な普及予測";
    if (aiSlider.value < 60) aiStr = "普及がかなり遅延";
    else if (aiSlider.value < 90) aiStr = "普及がやや遅め";
    else if (aiSlider.value > 150) aiStr = "爆発的なAI進化(AGI)";
    else if (aiSlider.value > 110) aiStr = "急速な普及・自動化";

    aiValueDisplay.textContent = aiStr;
    foreignValueDisplay.textContent = foreignSlider.value;
    retirementValueDisplay.textContent = retirementSlider.value;

    // 解説文の更新
    let conclusion = "";
    if (gap < 0) {
        conclusion = `<strong style="color:#F43F5E">労働力不足（ショート）状態です。</strong><br>
                      現在のアプローチでは${Math.abs(gap)}万人相当の労働力が不足します。<br>
                      AIの推進、移民の積極受け入れ、あるいは定年年齢の引き上げによる調整が必要です。`;
    } else if (gap > 1000) {
        conclusion = `<strong style="color:#A855F7">AI技術による超効率化社会です。</strong><br>
                      労働需要に対して${gap}万人相当の余剰生産能力が生まれます。<br>
                      ベーシックインカムの導入や、週休3日〜4日制など、労働観そのもののパラダイムシフトが起こりえます。`;
    } else {
        conclusion = `<strong style="color:#34D399">ほぼ均衡を維持できています。</strong><br>
                      労働力の減少を、外国人労働者とAIの技術でうまくソフトランディングさせているシナリオです。現場の移行コストをどう抑えるかが課題となります。`;
    }

    conclusionText.innerHTML = conclusion;
}


// イベントリスナーの登録
aiSlider.addEventListener('input', updateChart);
foreignSlider.addEventListener('input', updateChart);
retirementSlider.addEventListener('input', updateChart);

// 初期描画
updateChart();
