// Source: paper_arxiv/sections/experiments.tex, Tables main-imagenet and t2i.
// GFLOPs are conditional forward costs, not sampling latency or training cost.
// Direction is "up" for higher-is-better and "down" for lower-is-better.
export const RESULTS = [
  {
    id: 'imagenet512',
    title: 'ImageNet-512',
    subtitle: '120-epoch aligned training; five seeds; 50K images per seed. Conditional forward GFLOPs and peak Heun-50 throughput on H800 BF16.',
    columns: [
      { key: 'model', label: 'Model' },
      { key: 'cfg', label: 'CFG' },
      { key: 'fid', label: 'FID', direction: 'down' },
      { key: 'is', label: 'IS', direction: 'up' },
      { key: 'gflops', label: 'Forward GFLOPs', direction: 'down' },
      { key: 'throughput', label: 'img/s', direction: 'up' },
    ],
    rows: [
      { model: 'JiT-B/32', ours: false, cfg: 2.90, fid: 15.88, is: 162.12, gflops: 51.50, throughput: 30.61 },
      { model: 'JiT-B/16', ours: false, cfg: 2.90, fid: 8.45, is: 196.61, gflops: 219.56, throughput: 7.93 },
      { model: 'SF-B/32', ours: false, cfg: 9.50, fid: 11.41, is: 172.48, gflops: 54.72, throughput: 30.88 },
      { model: 'JiT-CM', ours: false, cfg: 2.90, fid: 11.98, is: 178.72, gflops: 141.21, throughput: 8.51 },
      { model: 'SpecSlot (W256/K2)', ours: true, cfg: 10.50, fid: 10.94, is: 183.69, gflops: 94.52, throughput: 18.32 },
      { model: 'SpecSlot (W256/K4)', ours: true, cfg: 8.25, fid: 9.14, is: 208.24, gflops: 135.64, throughput: 12.69 },
    ],
  },
  {
    id: 'imagenet256',
    title: 'ImageNet-256',
    subtitle: '120-epoch aligned training; five seeds; 50K images per seed. Conditional forward GFLOPs and peak Heun-50 throughput on H800 BF16.',
    columns: [
      { key: 'model', label: 'Model' },
      { key: 'cfg', label: 'CFG' },
      { key: 'fid', label: 'FID', direction: 'down' },
      { key: 'is', label: 'IS', direction: 'up' },
      { key: 'gflops', label: 'Forward GFLOPs', direction: 'down' },
      { key: 'throughput', label: 'img/s', direction: 'up' },
    ],
    rows: [
      { model: 'JiT-B/16', ours: false, cfg: 2.90, fid: 7.51, is: 174.81, gflops: 50.45, throughput: 33.08 },
      { model: 'JiT-B/8', ours: false, cfg: 2.90, fid: 4.34, is: 225.72, gflops: 218.50, throughput: 8.15 },
      { model: 'SF-B/16', ours: false, cfg: 2.90, fid: 7.81, is: 172.35, gflops: 50.85, throughput: 32.89 },
      { model: 'JiT-CM', ours: false, cfg: 2.90, fid: 6.68, is: 182.56, gflops: 124.24, throughput: 8.94 },
      { model: 'SpecSlot (W256/K2)', ours: true, cfg: 5.00, fid: 7.27, is: 219.49, gflops: 82.63, throughput: 21.32 },
      { model: 'SpecSlot (W256/K4)', ours: true, cfg: 4.00, fid: 6.59, is: 215.20, gflops: 129.20, throughput: 9.06 },
    ],
  },
  {
    id: 't2i',
    title: 'Text-to-image',
    subtitle: '256 px; 400 epochs; five seeds; shared prompts and 50-step Heun sampler. Scores are percentages; forward GFLOPs include the trainable text adapter.',
    columns: [
      { key: 'model', label: 'Model' },
      { key: 'cfg', label: 'CFG' },
      { key: 'dpg', label: 'DPG-Bench', direction: 'up' },
      { key: 'geneval', label: 'GenEval', direction: 'up' },
      { key: 'gflops', label: 'Forward GFLOPs', direction: 'down' },
    ],
    rows: [
      { model: 'JiT-B/16', ours: false, cfg: 2.90, dpg: 59.22, geneval: 24.89, gflops: 50.71 },
      { model: 'JiT-B/8', ours: false, cfg: 2.90, dpg: 61.15, geneval: 29.78, gflops: 218.77 },
      { model: 'SpecSlot (W256/K4)', ours: true, cfg: 4.00, dpg: 62.21, geneval: 26.99, gflops: 129.86 },
    ],
  },
];

// Percentage changes are computed against the explicitly named baseline:
// (219.56 - 135.64) / 219.56 = 38.2%; (218.77 - 129.86) / 218.77 = 40.6%.
export const HIGHLIGHTS = [
  {
    value: '9.14',
    label: 'FID on ImageNet-512',
    detail: 'SpecSlot W256/K4 at 135.64 forward GFLOPs: 2.84 lower FID than the JiT-CM control at 141.21 GFLOPs.',
  },
  {
    value: '38.2%',
    label: 'fewer forward FLOPs',
    detail: 'On ImageNet-512, W256/K4 uses 135.64 vs. 219.56 GFLOPs for JiT-B/16, with a 0.69 higher FID (9.14 vs. 8.45).',
  },
  {
    value: '62.21',
    label: 'DPG-Bench score',
    detail: 'W256/K4 scores 62.21 vs. 61.15 for JiT-B/8 at 40.6% fewer forward FLOPs. JiT-B/8 remains ahead on GenEval.',
  },
];
