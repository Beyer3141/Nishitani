export const STAGES = [
    {
        id: 1,
        name: '西谷防衛圏・笑顔の小惑星帯',
        waves: [1, 2, 3],
        background: 'nishitani_space',
        enemyPool: [
            { type: 'basic', weight: 5 }, { type: 'zigzag', weight: 3 }, { type: 'meishi', weight: 2 }
        ],
        bossType: 'giantTshirt',
        bossName: '巨大Tシャツ',
        dialogue: {
            stageStart: { speaker: '西谷', text: 'ようこそ！私の庭へ。ここにある岩も星も、すべて私がデザインしたんだ。美しいだろう？' },
            bossIntro: { speaker: '巨大Tシャツ', text: 'この白いTシャツの力を見よ！袖からミサイルが出るぞ！' },
        },
    },
    {
        id: 2,
        name: '複製都市・クローンファクトリー',
        waves: [4, 5, 6],
        background: 'factory',
        enemyPool: [
            { type: 'basic', weight: 3 }, { type: 'clone', weight: 4 }, { type: 'shooter', weight: 2 }, { type: 'meishi', weight: 1 }
        ],
        bossType: 'nishitaniRobo',
        bossName: 'ニシタニ・ロボ Mark-V',
        dialogue: {
            stageStart: { speaker: '西谷', text: '争いごとはやめよう。全宇宙が「私」になれば、永遠の平和が訪れる。' },
            bossIntro: { speaker: 'ニシタニ・ロボ', text: '営業スマイルビーム、発射準備完了。' },
        },
    },
    {
        id: 3,
        name: '帝国艦隊・ジャケットの海',
        waves: [7, 8, 9],
        background: 'fleet',
        enemyPool: [
            { type: 'basic', weight: 2 }, { type: 'zigzag', weight: 2 }, { type: 'kamikaze', weight: 2 },
            { type: 'shooter', weight: 2 }, { type: 'tank', weight: 1 }, { type: 'shield', weight: 1 }, { type: 'swarm', weight: 1 }
        ],
        bossType: 'fleetCommander',
        bossName: '艦隊司令官ニシタニ',
        dialogue: {
            stageStart: { speaker: '西谷', text: '痛いじゃないか。でも、その反骨精神……嫌いじゃないよ。' },
            bossIntro: { speaker: '艦隊司令官', text: '君のDNA、私のコレクションに加えたいな。' },
        },
    },
    {
        id: 4,
        name: '虚空の玉座',
        waves: [10],
        background: 'void',
        enemyPool: [
            { type: 'shield', weight: 3 }, { type: 'shooter', weight: 3 }, { type: 'tank', weight: 2 }, { type: 'clone', weight: 2 }
        ],
        bossType: 'emperor',
        bossName: '皇帝ニシタニ',
        dialogue: {
            stageStart: { speaker: '???', text: '虚空の果てに玉座がある……' },
            bossIntro: { speaker: '皇帝ニシタニ', text: 'ここまで私の愛を拒絶した存在は初めてだ。……仕方ないね。とっておきを見せてあげよう。' },
        },
    },
    {
        id: 5,
        name: '顔面戦艦 YASUOMI',
        waves: [11],
        background: 'void',
        enemyPool: [],
        bossType: 'faceBattleship',
        bossName: '顔面戦艦 YASUOMI',
        dialogue: {
            stageStart: { speaker: '西谷', text: 'さあ、最終形態だ。私の笑顔から逃れることはできない。' },
            bossIntro: { speaker: '顔面戦艦', text: '素晴らしい！君のポテンシャルを感じるよ。なぜ拒むんだい？' },
        },
    },
];

export function getStageForWave(waveNumber) {
    for (const stage of STAGES) {
        if (stage.waves.includes(waveNumber)) return stage;
    }
    return STAGES[STAGES.length - 1];
}

export function isLastWaveOfStage(waveNumber) {
    for (const stage of STAGES) {
        if (stage.waves[stage.waves.length - 1] === waveNumber) return true;
    }
    return false;
}

export function getMaxWave() {
    return 11;
}
