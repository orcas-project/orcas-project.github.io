# ORCAs

**Orchestrated Coding Agents for Scalable Demonstration Generation via Planning Program Synthesis**

ORCAs builds reusable task-and-motion planning programs from language instructions and simulator measurements, then executes them in parallel to generate robot demonstrations.

[Project website](https://orcas-project.github.io/) · [Paper](assets/orcas-paper.pdf)

This repository contains the project website, including the method overview, demonstration videos, and research results. The site uses plain HTML, CSS, and JavaScript; no frontend dependencies are required.

## Local preview

```bash
python3 serve.py
```

Open [localhost:8765](http://localhost:8765/). Use `--port 8766` to select another port. The preview server supports video playback and seeking and uses only Python's standard library.

## Editing

- `index.html` — page content, results, and resource links
- `styles.css` — typography and responsive layout
- `script.js` — navigation, video players, and interactive figures
- `assets/` — videos, figures, paper, and fonts
- `scripts/prepare_site.py` — assembles the files deployed to GitHub Pages
- `.github/workflows/pages.yml` — manual GitHub Pages deployment

This repository contains the finished website and public assets. Video-production sources, experiment logs, datasets, and manuscript sources are not included.

## Copying to a new repository

Copy the files into an empty directory, including `.github/`, `.gitignore`, and `.nojekyll`. Do not copy `.git/`, `_site/`, or `public-export/`. Initialize a new Git repository in the destination to start with fresh history.

If the destination owner or repository name differs, update the project website link in this README and the Website source link in `index.html`. The deployment workflow generates canonical and social-image URLs from the destination's GitHub Pages configuration.

## Deployment

The site can be hosted on GitHub Pages. In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source, then run the **Publish ORCAs website** workflow manually. Deployment is disabled while the repository is private; pushing changes does not publish the site.

To prepare the deployment files locally, use an empty output directory:

```bash
python3 scripts/prepare_site.py \
  --base-url https://orcas-project.github.io/ \
  --output _site
```

## Font license

Manrope is distributed under the [SIL Open Font License 1.1](assets/fonts/OFL-Manrope.txt).
