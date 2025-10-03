# Archeology Project

A web application for statistical text classification and clustering using minimal labeling and dimension selection.

## Overview

Archeology Project implements a novel methodology for small-scale heterogeneous text clustering. It uses OpenAI embeddings, statistical t-tests for dimension selection, and K-means clustering to automatically group text data with minimal manual labeling.

## Features

- **CSV File Upload**: Import text data with identifier and description columns
- **Minimal Labeling**: Label just 1-2 examples per group to guide clustering
- **Pagination**: Browse through large datasets (up to 2000 rows) to find representative examples
- **Statistical Dimension Selection**: Uses Welch's t-test to identify discriminative embedding dimensions
- **K-means Clustering**: Groups data based on selected dimensions
- **PCA Visualization**: 2D scatter plot of cluster results
- **Export Results**: Download clustering results as JSON or CSV

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS 4
- **Embeddings**: OpenAI text-embedding-3-large (1536 dimensions)
- **Analysis Libraries**:
  - `ml-kmeans` - K-means clustering
  - `ml-matrix` - Matrix operations and SVD for PCA
  - `@stdlib/stats-ttest` - Welch's t-test
- **Visualization**: Plotly.js / react-plotly.js
- **CSV Parsing**: PapaParse

## Getting Started

### Prerequisites

- Node.js 20+
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/prempunmagar/clustering-app.git
cd clustering-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### 1. Upload Data
- Upload a CSV file with at least two columns
- Select identifier column (unique ID for each row)
- Select description column (text to analyze)

### 2. Label Examples
- Browse through your data using pagination (10 items per page)
- Create groups (e.g., "Group A", "Group B", "Bug Reports", "Feature Requests")
- Label 1-2 representative examples from each group
- Minimum: 2 groups with at least 1 example each

### 3. Configure Analysis
- **Number of Dimensions**: How many dimensions to use from embeddings (default: 40)
  - Higher = more precise but may overfit
  - Lower = more generalized
- **Number of Clusters**: How many groups to create (default: 2)

### 4. Processing
- **Embeddings Generation**: Processes in chunks of 100 rows to work with Vercel free tier (10s timeout limit)
- **Statistical Analysis**: Runs client-side to avoid payload limits
  - T-test compares labeled groups across all dimensions
  - Selects top N dimensions with lowest p-values (most discriminative)
- **Clustering**: K-means on selected dimensions
- **Visualization**: PCA reduces to 2D for plotting

### 5. Results
- **2D Scatter Plot**: PCA visualization of clusters
- **Cluster Assignments**: View items in each cluster
- **Statistics**: Selected dimensions, p-values, variance explained
- **Export**: Download results as JSON or CSV

## Architecture

### Frontend (`src/components/`)
- `FileUpload.tsx` - CSV upload and parsing
- `DataPreview.tsx` - Column selection
- `LabelingInterface.tsx` - Pagination and manual labeling
- `ConfigurationPanel.tsx` - Parameter settings
- `Results.tsx` - Visualization and export

### Backend API (`src/app/api/`)
- `/api/embeddings` - Generates OpenAI embeddings in batches of 20
  - Max 200 items per request (Vercel timeout limit)
  - Returns 1536-dimension vectors

### Client-side Analysis (`src/utils/analysis.ts`)
- `selectDiscriminativeDimensions()` - Welch's t-test for dimension selection
- `performClustering()` - K-means with standardization
- `performPCA()` - SVD-based PCA for visualization
- `performAnalysis()` - Main orchestration function

## Important Notes

### Vercel Free Tier Compatibility
- **10-second timeout**: Embeddings processed in chunks of 100 from frontend
- **4.5MB payload limit**: Analysis moved to client-side
- Each API call handles max 200 items to stay under limits

### Data Limits
- Maximum 2000 rows per dataset
- Processing time: 2-5 minutes for large datasets

### Variance Explained
- Low variance (e.g., 18%) is normal for high-dimensional text data
- Clusters are computed using all selected dimensions (e.g., 40)
- 2D PCA plot is just a simplified visualization
- Even with low variance, cluster separation can be meaningful

## Environment Variables

```env
OPENAI_API_KEY=sk-...  # Required: OpenAI API key for embeddings
```

For Vercel deployment, add this in Project Settings → Environment Variables for all environments (Production, Preview, Development).

## Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Known Limitations

1. **Vercel Free Tier**: 10-second function timeout requires chunked processing
2. **2D Visualization**: May not capture full cluster structure for complex data
3. **OpenAI Costs**: Each run costs ~$0.10-$0.30 for 2000 rows (text-embedding-3-large pricing)
4. **Memory**: Large datasets (1000+ rows) may be slow on low-end devices during client-side analysis

## Future Improvements

- [ ] Add t-SNE visualization as alternative to PCA
- [ ] Support for more embedding models (local, other APIs)
- [ ] Cluster quality metrics (silhouette score, etc.)
- [ ] Save/load analysis sessions
- [ ] Batch processing for datasets >2000 rows

## License

MIT

## Credits

Built with [Claude Code](https://claude.com/claude-code)
