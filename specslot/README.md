# SpecSlot project page

Static project page for **https://yangjiongfan.site/specslot/**. No build step, framework, or package installation is needed. The parent homepage is unchanged.

## Preview

Run from the homepage repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/specslot/`. Use HTTP, not `file://`, because benchmark data is imported as an ES module.

## Files

- `index.html`: page content, author links, galleries, resources, and citation.
- `styles.css`: responsive white/cool-gray design with restrained blue and purple accents.
- `script.js`: method tabs, benchmark and mechanism charts, full-prompt gallery, paired samples, image viewer, citation copying, and video configuration.
- `carousel.js`: shared progress-led navigation and automatic timing for both galleries.
- `results.js`: exact benchmark values from the current paper.
- `mechanisms.js`: carrier and routing ablations from the paper, plus measured branch-scaling probe means used in Figure 7.
- `prompts.js`: complete original DPG-Bench prompts and source records. Short gallery labels are navigation only, not substitute prompts.
- `assets/SpecSlot.pdf`: snapshot of the current arXiv manuscript. Replace when the paper changes.
- `assets/provenance.json`: source and crop record for the generated images. WebP images are lossless conversions; no generated content is retouched. The video poster alone is a resized, layout-only montage.

## Video overview

The final SpecSlot overview (V4.1) is included as `assets/specslot-overview.mp4` and enabled through the `VIDEO` object in `script.js`. It uses the existing montage cover and native playback controls, with no autoplay or caption track. The player keeps its 16:9 aspect ratio on desktop and mobile.

- Duration: 4:15.333; 1920 × 1080 at 30 fps.
- Encoding: H.264/yuv420p and AAC stereo, with MP4 fast-start metadata.
- Audio: English narration and quiet original piano, already mixed into the MP4.
- Size: 18,733,486 bytes.
- SHA-256: `7e7d0647d3509d6abbbed39f9c96153abe5dcd32355d42506c1c982b3b59b9ce`.

To replace the video later, update the MP4 and the `VIDEO.src` path if needed. `VIDEO.captions` is optional and currently empty. An empty `VIDEO.src` restores the coming-soon placeholder. No framework, external video service or build step is required.

## Content updates

- Update `results.js` and the corresponding highlights / result summaries together when numbers change.
- Forward GFLOPs must not be described as wall-clock latency. DPG-Bench and GenEval are distinct scores. The page does not claim a general SOTA result.
- `W × K` is a fixed architectural allocation, not a content-adaptive policy. At fixed N, W and K trade off.
- The centered Overview card uses the current paper abstract verbatim, stopping before the results. The allocation explanation and complete benchmark rows remain visible. Carrier choice is explained beside its table; routing retains its quality–compute plot and full table. The two-basis panel distinguishes frozen-checkpoint probes from generated-image FID.
- The branch-scaling slider selects six measured flow times. It does not interpolate between times or invent measurements. Numerical sources and aggregation are documented in `mechanisms.js`.
- Gallery prompts match the original ELLA DPG-Bench prompt files. The selected qualitative images come from the epoch-550 export; the quantitative T2I table reports the paper's 400-epoch evaluation. Do not relabel the gallery as that evaluation.
- T2I advances every 8 seconds and ImageNet every 5 seconds, using a faint, non-interactive progress line. There are no play/pause controls or application-level pause conditions. Hover, focus, scrolling, and opening an enlarged image do not interrupt the background carousel. Manual selection starts a fresh interval; the enlarged image stays on the selected sample. The next slide is prepared in advance, and ImageNet pairs are decoded together and committed atomically. The progress line and slide changes share one clock. Browsers may throttle animation in inactive tabs.
- The paired ImageNet images share class labels and noise draws, as documented in the paper. All galleries are selected illustrations.
- The Paper buttons link to [arXiv:2610.40647](https://arxiv.org/abs/2610.40647). `assets/SpecSlot.pdf` remains available for page-specific references.
- Typography uses Google Fonts (DM Sans / Newsreader), with local system fallbacks. All images, diagrams, data, and scripts are served from this subdirectory.
- Opening and scroll animations respect reduced-motion preferences. The brief opening animation is nonblocking and appears once per browser session.

## Deployment

The directory works with the homepage's existing static hosting. Review and merge the `feat/specslot-final-video` branch into `main` through the normal deployment process. The video is served with the other static page assets.

## Review performed

- Cross-checked all 15 benchmark rows and headline differences against `paper_arxiv/sections/experiments.tex`.
- Confirmed author order and affiliations against the paper.
- Checked desktop and mobile rendering, 320–1920 px widths, all result tabs, sample switching, modal zoom / Escape dismissal, keyboard tabs, and local asset links.
- Checked every displayed gallery prompt against its full original text, including the enlarged view.
- Checked mechanism plots and tables, all six measured flow times, chart-label spacing, and reduced-motion / opening-animation behavior.
- Verified continuous carousel advancement during hover, keyboard focus, scrolling offscreen, and an open image viewer. Confirmed the enlarged image stays fixed, paired images update together, and a deliberately stalled image decode times out and skips to a valid slide.
- Original homepage files and paper files remain unchanged.
