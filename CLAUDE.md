# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Statistical Dimension Selection for Text Classification** application - a Next.js app implementing a novel methodology for small-scale heterogeneous text clustering using minimal labeling and statistical dimension selection.

## Core Architecture

### Processing Pipeline
The application follows a 6-step wizard flow:
1. **Upload** → CSV file upload
2. **Preview** → Column selection (identifier & description columns)
3. **Labeling** → Minimal manual labeling of a few examples
4. **Configuration** → Set number of dimensions and clusters
5. **Processing** → Backend analysis
6. **Results** → Visualization and cluster assignments

### Key Components

**Frontend (src/components/):**
- `FileUpload.tsx` - CSV file parser using PapaParse
- `DataPreview.tsx` - Column selection interface
- `LabelingInterface.tsx` - Manual labeling UI for minimal examples
- `ConfigurationPanel.tsx` - Parameter configuration (dimensions, clusters)
- `Results.tsx` - Plotly.js visualization and cluster results

**Backend API Routes (src/app/api/):**
- `/api/embeddings/route.ts` - Generates embeddings using OpenAI's text-embedding-3-large model (1536 dimensions)
- `/api/analyze/route.ts` - Performs statistical analysis and clustering:
  - T-test based dimension selection
  - K-means clustering on selected dimensions
  - PCA for 2D visualization

### Statistical Methodology

The core innovation is in `src/app/api/analyze/route.ts`:

1. **Dimension Selection (`selectDiscriminativeDimensions`)**:
   - Uses Welch's t-test to compare labeled groups across all embedding dimensions
   - Selects top N dimensions with lowest p-values (most discriminative)
   - Requires at least 2 labeled groups

2. **Clustering (`performClustering`)**:
   - Extracts selected dimensions from full embeddings
   - Standardizes data (z-score normalization)
   - Applies K-means clustering using ml-kmeans library

3. **Visualization (`performPCA`)**:
   - Simplified PCA projection to 2D for visualization
   - Currently uses first two dimensions (placeholder for full PCA)

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Environment Setup

Required environment variable in `.env.local`:
- `OPENAI_API_KEY` - OpenAI API key for text embeddings

For Vercel deployment, add this to Project Settings > Environment Variables for all environments.

## Key Dependencies

- **Next.js 15** with App Router and Turbopack
- **OpenAI** - text-embedding-3-large model for embeddings
- **ml-kmeans** - K-means clustering (note: import as `{ kmeans }` lowercase)
- **ml-matrix** - Matrix operations for data standardization
- **@stdlib/stats-ttest** - Welch's t-test for statistical dimension selection
- **PapaParse** - CSV parsing
- **Plotly.js / react-plotly.js** - Interactive visualization
- **Tailwind CSS 4** - Styling

## Important Implementation Notes

1. **Import Convention**: Use `import { kmeans } from 'ml-kmeans'` (lowercase function, not KMeans class)

2. **OpenAI Embeddings**:
   - Uses text-embedding-3-large with 1536 dimensions
   - Processes in batches of 50 to avoid rate limits
   - 100ms delay between batches

3. **State Management**: All state managed in `src/app/page.tsx` with props passed to child components

4. **Error Handling**: Processing errors are caught and displayed with retry functionality in the processing step
