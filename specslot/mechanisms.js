// Local paper sources: paper_arxiv/sections/mechanistic.tex:24-42 (carrier),
// paper_arxiv/sections/appendix.tex:303-319 (evidence timing),
// paper_arxiv/sections/experiments.tex:99-112 (routing),
// paper_arxiv/sections/ablation.tex:101 (routing-control interpretation), and
// paper_arxiv/sections/mechanistic.tex:9-16 (Figure 7, output-branch probes).
// Table values are copied from the current paper, not estimated from plots.
export const MECHANISMS = {
  carrier: {
    title: 'Why slot 0 is the carrier',
    description: 'In the spectral base, slot 0 predicts the lowest radial DCT group, including DC and coarse variation within each output window. Higher-index slots predict higher-frequency groups associated with finer detail. Coordinating broad structure across image regions motivates giving slot 0 global access. Its frequency group also reaches signal-above-noise earliest along the noise-to-image flow, making it a natural choice for early cross-anchor exchange.',
    detail: 'Local attention lets the carrier share global context with its anchor’s other slots and collect their detail updates for later global blocks. Fine detail can therefore communicate indirectly, without sending every slot through global attention. The carrier ablation supports this choice: slot 0 gives the lowest FID among the four tested assignments.',
    scope: 'ImageNet-256; W256/K4/B1536, GGLL routing, and compute held fixed. Only the slot receiving cross-anchor access changes.',
    columns: [
      { key: 'model', label: 'Global carrier' },
      { key: 'fid', label: 'FID', direction: 'down' },
      { key: 'is', label: 'IS', direction: 'up' },
    ],
    rows: [
      { model: 'Slot 0 (lowest radial)', fid: 6.59, is: 215.20 },
      { model: 'Slot 1', fid: 6.91, is: 220.38 },
      { model: 'Slot 2', fid: 7.21, is: 203.90 },
      { model: 'Slot 3', fid: 6.97, is: 214.87 },
    ],
  },
  routing: {
    title: 'Global structure, local detail',
    description: 'Routing matters beyond FLOPs. GGLL reaches lower FID and higher throughput than the compute-matched dense-global control. Changing the block order to GLGL worsens FID at the same forward cost. Full-global attention reaches the lowest FID, but uses more compute, showing the quality-compute trade-off targeted by carrier routing.',
    scope: 'ImageNet-256, W256/K4/B1536. These are separately trained schedules; Dense-global-CM uses a narrower trunk to match forward compute. Efficiency columns come from one profiler run.',
    columns: [
      { key: 'model', label: 'Routing schedule' },
      { key: 'fid', label: 'FID', direction: 'down' },
      { key: 'is', label: 'IS', direction: 'up' },
      { key: 'gflops', label: 'Forward GFLOPs', direction: 'down' },
      { key: 'throughput', label: 'img/s', direction: 'up' },
    ],
    rows: [
      { model: 'GGLL', fid: 6.59, is: 215.20, gflops: 129.20, throughput: 9.06 },
      { model: 'GLGL', fid: 6.95, is: 218.95, gflops: 129.20, throughput: 9.00 },
      { model: 'Dense-global-CM', fid: 6.81, is: 210.20, gflops: 128.96, throughput: 5.80 },
      { model: 'Full-global', fid: 5.84, is: 237.54, gflops: 225.82, throughput: 5.11 },
    ],
  },
  basis: {
    title: 'Two bases, complementary work',
    description: 'Spectral prediction supplies the main scaffold; the spatial correction contributes more late in the flow and in higher radial bands. Scaling either branch reveals that both are needed by the frozen model, with much larger velocity-error penalties late in the flow.',
    scope: 'Figure 7: frozen W256/K4 checkpoint, 128 paired states per measured point. Branch scaling changes the readout only; the chart reports relative velocity MSE, not FID or retrained-model quality.',
    columns: [],
    rows: [],
  },
};

// Figure 7(c), exact original probe data:
// hybrid_mechanisms/sd-w256-k4-b1536-input-mix-no-merge/counterfactual_metrics.csv
// Protocol: the same directory's contract.json:13-31 (128 images, six times,
// eight scales). Each of the 96 (t, branch, scale) groups has 128 paired states.
// Official aggregation: Spectral_Direct/tools/render_sd_hybrid_mechanism_figures.py:184-205;
// arithmetic mean of relative_velocity_mse, grouped by t, branch, and scale.
// The raw branch name "frequency" is displayed as "spectral" below.
// Values retain nine decimal places; no interpolation, smoothing, or renormalization.
// At scale 1, source means differ from 1 by at most 0.000203381. Preserve these
// measured values and use y=1 only as the intact-model reference line.
export const BASIS_SCALING = [
  {
    t: 0.05,
    scales: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    spatial: [1.102976693, 1.055105098, 1.021995845, 1.003648925, 1.000064318, 1.011242047, 1.037182106, 1.133349213],
    spectral: [2.121581459, 1.617131221, 1.262061623, 1.056381876, 1.000064318, 1.093104906, 1.335569668, 2.268637359],
    nPerPoint: 128,
  },
  {
    t: 0.15,
    scales: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    spatial: [1.362392854, 1.206058656, 1.093560925, 1.024899653, 1.000074860, 1.019086514, 1.081934614, 1.339140248],
    spectral: [3.600364847, 2.467326963, 1.656265959, 1.167204680, 1.000074860, 1.154892151, 1.631738148, 3.551415903],
    nPerPoint: 128,
  },
  {
    t: 0.30,
    scales: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    spatial: [1.892207818, 1.502981301, 1.224550639, 1.056915815, 1.000076825, 1.054033687, 1.218786374, 1.880679288],
    spectral: [5.605838275, 3.591421640, 2.152322547, 1.288586328, 1.000076825, 1.286834666, 2.148993814, 5.599395375],
    nPerPoint: 128,
  },
  {
    t: 0.50,
    scales: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    spatial: [3.264916691, 2.277454406, 1.570814215, 1.144996080, 1.000000000, 1.135825992, 1.552474038, 3.228236368],
    spectral: [9.076216908, 5.546917289, 3.024447880, 1.508890194, 1.000000000, 1.497859550, 3.002675506, 9.033067638],
    nPerPoint: 128,
  },
  {
    t: 0.70,
    scales: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    spatial: [6.969829428, 4.366223420, 2.503370918, 1.381272054, 0.999926797, 1.359335159, 2.459497105, 6.882081884],
    spectral: [16.904337883, 9.956340448, 4.989606199, 2.004293902, 0.999926797, 1.976695091, 4.934911153, 16.795724781],
    nPerPoint: 128,
  },
  {
    t: 0.90,
    scales: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    spatial: [32.138321739, 18.563632292, 8.848982023, 2.994370125, 0.999796619, 2.865261653, 8.590765039, 31.621887678],
    spectral: [64.066225095, 36.527652227, 16.837056617, 4.995081137, 0.999796619, 4.852119979, 16.552840824, 63.501002164],
    nPerPoint: 128,
  },
];
