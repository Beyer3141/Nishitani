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
            stageStart: [
                { speaker: 'プレイヤー', text: '何だこの宇宙は…全部あいつの顔だ…' },
                { speaker: '西谷', text: 'やぁ！初めてのお客さんだね。まずは名刺交換しよう！' },
                { speaker: 'プレイヤー', text: 'いらねぇよ！' },
            ],
            bossIntro: [
                { speaker: '巨大Tシャツ', text: 'このTシャツ、3枚1000円だぞ！お得だろう！' },
                { speaker: '西谷', text: '彼は私の一番弟子だ。着心地の良さで攻めてくるよ。' },
            ],
            bossDefeat: [
                { speaker: '西谷', text: 'あのTシャツ、クリーニング代が高いんだぞ…' },
            ],
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
            stageStart: [
                { speaker: '西谷', text: '争いごとはやめよう。全宇宙が「私」になれば、永遠の平和が訪れる。' },
                { speaker: 'プレイヤー', text: 'それは平和じゃなくて地獄だ。' },
                { speaker: '西谷', text: '失礼な。天国だよ。毎日が営業スマイルだ。' },
            ],
            bossIntro: [
                { speaker: 'ニシタニ・ロボ', text: '営業スマイルビーム、出力120%。' },
                { speaker: 'プレイヤー', text: 'ロボまで営業してんのか。' },
                { speaker: 'ニシタニ・ロボ', text: '人事評価に影響しますので。' },
            ],
            bossDefeat: [
                { speaker: 'ニシタニ・ロボ', text: 'メモリ容量…98%が…笑顔データ…' },
            ],
        },
    },
    {
        id: 3,
        name: '帝国艦隊・ジャケットの海',
        waves: [7, 8],
        background: 'fleet',
        enemyPool: [
            { type: 'basic', weight: 2 }, { type: 'zigzag', weight: 2 }, { type: 'kamikaze', weight: 2 },
            { type: 'shooter', weight: 2 }, { type: 'tank', weight: 1 }, { type: 'shield', weight: 1 }, { type: 'swarm', weight: 1 }
        ],
        bossType: 'fleetCommander',
        bossName: '艦隊司令官ニシタニ',
        dialogue: {
            stageStart: [
                { speaker: '西谷', text: '痛いじゃないか。でも、その反骨精神……嫌いじゃないよ。' },
                { speaker: 'プレイヤー', text: 'お前のこと嫌いだけどな。' },
                { speaker: '西谷', text: '照れなくていいんだよ？' },
            ],
            bossIntro: [
                { speaker: '艦隊司令官', text: '全艦、営業スマイル展開！' },
                { speaker: 'プレイヤー', text: '軍隊まで営業かよ。' },
                { speaker: '艦隊司令官', text: '君のDNA、私のコレクションに加えたいな。' },
            ],
            bossDefeat: [
                { speaker: '艦隊司令官', text: 'まさか…私の笑顔が…通じないだと…？' },
            ],
        },
    },
    {
        id: 4,
        name: '営業地獄・決算フロア',
        waves: [9, 10],
        background: 'office',
        enemyPool: [
            { type: 'meishi', weight: 4 }, { type: 'sniper', weight: 3 }, { type: 'teleport', weight: 2 },
            { type: 'bomb', weight: 2 }, { type: 'shooter', weight: 1 }
        ],
        bossType: 'salesManager',
        bossName: '営業部長ニシタニ',
        dialogue: {
            stageStart: [
                { speaker: '???', text: '…ここは…オフィスビル？' },
                { speaker: '営業部長ニシタニ', text: 'おいおい、ノックもなしに入ってくるのかい？' },
                { speaker: 'プレイヤー', text: '宇宙のど真ん中にオフィスがあるのが異常だ。' },
                { speaker: '営業部長ニシタニ', text: '営業に休みはない。決算前なんでね。' },
            ],
            bossIntro: [
                { speaker: '営業部長ニシタニ', text: '名刺の在庫が10万枚あるんだ。全部君にプレゼントするよ。' },
                { speaker: 'プレイヤー', text: '攻撃するなら弾にしてくれ。' },
                { speaker: '営業部長ニシタニ', text: 'お望み通りだ！電話営業レーザー、起動！' },
            ],
            bossDefeat: [
                { speaker: '営業部長ニシタニ', text: '決算…間に合わない…来期に…持ち越し…' },
            ],
        },
    },
    {
        id: 5,
        name: '虚空の玉座',
        waves: [11],
        background: 'void',
        enemyPool: [
            { type: 'shield', weight: 3 }, { type: 'shooter', weight: 3 }, { type: 'tank', weight: 2 },
            { type: 'clone', weight: 2 }, { type: 'sniper', weight: 1 }
        ],
        bossType: 'emperor',
        bossName: '皇帝ニシタニ',
        dialogue: {
            stageStart: [
                { speaker: '???', text: '虚空の果てに玉座がある……' },
                { speaker: '皇帝ニシタニ', text: '待っていたよ。君だけだ、ここまで来たのは。' },
                { speaker: 'プレイヤー', text: 'お前を倒しに来た。' },
                { speaker: '皇帝ニシタニ', text: '倒す？違うよ。君は私に会いに来たんだ。' },
            ],
            bossIntro: [
                { speaker: '皇帝ニシタニ', text: 'ここまで私の愛を拒絶した存在は初めてだ。' },
                { speaker: 'プレイヤー', text: '愛じゃなくて迷惑だ。' },
                { speaker: '皇帝ニシタニ', text: '同じことさ。とっておきを見せてあげよう。' },
            ],
            bossDefeat: [
                { speaker: '皇帝ニシタニ', text: 'ふふ…まだ奥の手がある…最終形態を…見せてあげよう…' },
            ],
        },
    },
    {
        id: 6,
        name: '顔面戦艦 YASUOMI',
        waves: [12],
        background: 'void',
        enemyPool: [],
        bossType: 'faceBattleship',
        bossName: '顔面戦艦 YASUOMI',
        dialogue: {
            stageStart: [
                { speaker: '西谷', text: 'さあ、最終形態だ。宇宙そのものが私になる。' },
                { speaker: 'プレイヤー', text: '宇宙がお前の顔とか悪夢だろ。' },
                { speaker: '西谷', text: '夢じゃないよ。現実さ。' },
            ],
            bossIntro: [
                { speaker: '顔面戦艦', text: '素晴らしい！君のポテンシャルを感じるよ。' },
                { speaker: 'プレイヤー', text: '黙れ巨大顔面。' },
                { speaker: '顔面戦艦', text: 'その言葉、名刺の裏に書いておくよ。' },
            ],
            bossDefeat: [
                { speaker: '西谷', text: '見事だ…でも忘れないで。' },
                { speaker: '西谷', text: '私はいつでも…君の心の中で…営業スマイルしているよ。' },
                { speaker: 'プレイヤー', text: 'もう勘弁してくれ…' },
            ],
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
    return 12;
}
