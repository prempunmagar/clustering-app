# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Archeology Project** - A Next.js app implementing a novel methodology for small-scale heterogeneous text clustering using minimal labeling and statistical dimension selection.

## Core Architecture

### Processing Pipeline
The application follows a 6-step wizard flow:
1. **Upload** → CSV file upload with PapaParse
2. **Preview** → Column selection (identifier & description columns)
3. **Labeling** → Minimal manual labeling with pagination (10 items/page, browse up to 2000 rows)
4. **Configuration** → Set number of dimensions (default: 40) and clusters (default: 2)
5. **Processing** → Chunked embeddings generation + client-side analysis
6. **Results** → PCA visualization and cluster assignments with export

### Key Components

**Frontend (src/components/):**
- `FileUpload.tsx` - CSV file parser using PapaParse
- `DataPreview.tsx` - Column selection interface
- `LabelingInterface.tsx` - Pagination controls to browse all data for labeling (removed random sampling)
- `ConfigurationPanel.tsx` - Parameter configuration (dimensions, clusters)
- `Results.tsx` - Plotly.js visualization and cluster results with CSV/JSON export

**Backend API Routes (src/app/api/):**
- `/api/embeddings/route.ts` - Generates embeddings using OpenAI's text-embedding-3-large model (1536 dimensions)
  - Max 200 items per request (Vercel free tier 10s timeout)
  - Processes in batches of 20 to OpenAI API
  - 50ms delay between batches
  - `maxDuration = 60` and `dynamic = 'force-dynamic'` configured

**Client-side Analysis (src/utils/analysis.ts):**
- ALL statistical analysis moved to client-side to avoid Vercel payload limits
- `selectDiscriminativeDimensions()` - Welch's t-test for dimension selection
- `performClustering()` - K-means with z-score standardization
- `performPCA()` - Real SVD-based PCA (not placeholder anymore)
- `performAnalysis()` - Main orchestration function

### Statistical Methodology

The core innovation is in `src/utils/analysis.ts` (client-side):

1. **Dimension Selection (`selectDiscriminativeDimensions`)**:
   - Uses Welch's t-test to compare labeled groups across all embedding dimensions
   - Selects top N dimensions with lowest p-values (most discriminative)
   - Requires at least 2 labeled groups

2. **Clustering (`performClustering`)**:
   - Extracts selected dimensions from full embeddings
   - Standardizes data (z-score normalization)
   - Applies K-means clustering using ml-kmeans library

3. **Visualization (`performPCA`)**:
   - Real PCA using SVD (Singular Value Decomposition) from ml-matrix
   - Centers data before decomposition
   - Projects onto first 2 principal components
   - Calculates accurate explained variance for PC1, PC2, and total

### Vercel Free Tier Optimizations

**Critical for deployment:**

1. **Chunked Embeddings Processing (Frontend)**:
   - Processes 100 rows at a time from frontend in a loop
   - Each chunk sent to `/api/embeddings` (max 200 items)
   - Shows progress: "Generating embeddings... 45% (900/2000)"
   - Avoids timeout by keeping each API call under 10 seconds

2. **Client-side Analysis**:
   - All analysis runs in browser (no `/api/analyze` call anymore)
   - Avoids 4.5MB payload limit (2000 rows × 1536 dims = too large)
   - Libraries bundled in client: ml-kmeans, ml-matrix, @stdlib/stats-ttest

3. **Configuration**:
   - `next.config.ts`: `serverActions.bodySizeLimit: '10mb'`
   - API routes: `maxDuration = 60`, `dynamic = 'force-dynamic'`

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
- **OpenAI** - text-embedding-3-large model (1536 dimensions)
- **ml-kmeans** - K-means clustering (note: import as `{ kmeans }` lowercase)
- **ml-matrix** - Matrix operations, standardization, SVD for PCA
- **@stdlib/stats-ttest** - Welch's t-test for statistical dimension selection
- **PapaParse** - CSV parsing
- **Plotly.js / react-plotly.js** - Interactive visualization
- **Tailwind CSS 4** - Styling

## Important Implementation Notes

1. **Import Convention**: Use `import { kmeans } from 'ml-kmeans'` (lowercase function, not KMeans class)

2. **OpenAI Embeddings**:
   - Uses text-embedding-3-large with 1536 dimensions
   - Frontend chunks data into batches of 100
   - Backend processes in batches of 20 to OpenAI API
   - 50ms delay between batches

3. **State Management**: All state managed in `src/app/page.tsx` with props passed to child components

4. **Error Handling**:
   - Processing errors caught and displayed with retry functionality
   - Checks Content-Type before parsing JSON (handles non-JSON error responses)
   - Shows meaningful error messages with status codes

5. **PCA Variance**:
   - Low variance (e.g., 18%) is normal for high-dimensional text data
   - Clusters computed on all selected dimensions (e.g., 40)
   - 2D visualization is just for display, not the full analysis
   - Console debug logging available: "PCA Debug:" shows variance breakdown

6. **Data Limits**:
   - Max 2000 rows per dataset
   - Max 200 items per embeddings API request
   - Processing takes 2-5 minutes for large datasets

## Branding

- **App Name**: "Archeology Project"
- **Tagline**: "Methodology for small-scale heterogeneous text clustering"
- **No logo** - text-only header (logo was removed for cleaner design)

## Common Issues & Solutions

1. **"Failed to fetch" error**: Vercel timeout - data is now chunked to avoid this
2. **"FUNCTION_PAYLOAD_TOO_LARGE" error**: Fixed by moving analysis to client-side
3. **100% variance displayed**: Fixed calculation bug (was dividing by itself)
4. **Spinner not centered**: Added `mx-auto` class to center animation

## Next Steps / Future Improvements

- t-SNE visualization as alternative to PCA
- Support for other embedding models (local, other APIs)
- Cluster quality metrics (silhouette score)
- Save/load analysis sessions
- Batch processing for datasets >2000 rows
