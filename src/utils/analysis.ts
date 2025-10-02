import ttest from '@stdlib/stats-ttest';
import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import { kmeans } from 'ml-kmeans';

// Statistical t-test for dimension selection
function performTTest(group1: number[], group2: number[]) {
  try {
    if (group1.length < 2 || group2.length < 2) {
      return { pValue: 1, statistic: 0 };
    }

    // Use Welch's t-test (unequal variances)
    const result = ttest(group1, group2, {
      alternative: 'two-sided',
      alpha: 0.05
    });

    return {
      pValue: result.pValue,
      statistic: result.statistic
    };
  } catch (error) {
    console.error('T-test error:', error);
    return { pValue: 1, statistic: 0 };
  }
}

// Select discriminative dimensions using t-tests
export function selectDiscriminativeDimensions(
  embeddings: number[][],
  labels: { [key: string]: string },
  identifiers: string[],
  numDimensions: number
) {
  const dimensionStats: Array<{
    dimension: number;
    pValue: number;
    statistic: number;
  }> = [];

  // Get labeled groups
  const labeledGroups: { [key: string]: number[] } = {};
  identifiers.forEach((id, index) => {
    const label = labels[id];
    if (label) {
      if (!labeledGroups[label]) {
        labeledGroups[label] = [];
      }
      labeledGroups[label].push(index);
    }
  });

  const groupKeys = Object.keys(labeledGroups);
  if (groupKeys.length < 2) {
    throw new Error('Need at least 2 labeled groups for statistical analysis');
  }

  // For each dimension, perform t-tests between all pairs of groups
  const embeddingDimensions = embeddings[0].length;

  for (let dim = 0; dim < embeddingDimensions; dim++) {
    let minPValue = 1;
    let maxStatistic = 0;

    // Compare all pairs of groups
    for (let i = 0; i < groupKeys.length - 1; i++) {
      for (let j = i + 1; j < groupKeys.length; j++) {
        const group1Indices = labeledGroups[groupKeys[i]];
        const group2Indices = labeledGroups[groupKeys[j]];

        const group1Values = group1Indices.map(idx => embeddings[idx][dim]);
        const group2Values = group2Indices.map(idx => embeddings[idx][dim]);

        const testResult = performTTest(group1Values, group2Values);

        if (testResult.pValue < minPValue) {
          minPValue = testResult.pValue;
          maxStatistic = Math.abs(testResult.statistic);
        }
      }
    }

    dimensionStats.push({
      dimension: dim,
      pValue: minPValue,
      statistic: maxStatistic
    });
  }

  // Sort by p-value (ascending) and select top dimensions
  dimensionStats.sort((a, b) => a.pValue - b.pValue);
  const selectedDimensions = dimensionStats.slice(0, numDimensions);

  return {
    selectedDimensions: selectedDimensions.map(d => d.dimension),
    dimensionStats: selectedDimensions
  };
}

// Perform K-means clustering
export function performClustering(
  embeddings: number[][],
  selectedDimensions: number[],
  numClusters: number
) {
  // Extract selected dimensions
  const reducedEmbeddings = embeddings.map(embedding =>
    selectedDimensions.map(dim => embedding[dim])
  );

  // Standardize the data
  const matrix = new Matrix(reducedEmbeddings);
  const means = matrix.mean('column') as number[];

  // Calculate standard deviations manually
  const stds: number[] = [];
  for (let col = 0; col < matrix.columns; col++) {
    let sum = 0;
    const mean = means[col];
    for (let row = 0; row < matrix.rows; row++) {
      const diff = matrix.get(row, col) - mean;
      sum += diff * diff;
    }
    stds.push(Math.sqrt(sum / (matrix.rows - 1)));
  }

  const standardizedMatrix = matrix.clone();
  for (let col = 0; col < matrix.columns; col++) {
    if (stds[col] > 0) {
      for (let row = 0; row < matrix.rows; row++) {
        const standardized = (matrix.get(row, col) - means[col]) / stds[col];
        standardizedMatrix.set(row, col, standardized);
      }
    }
  }

  // Perform K-means clustering
  const kmeansResult = kmeans(standardizedMatrix.to2DArray(), numClusters, {
    initialization: 'random',
    maxIterations: 100
  });

  return {
    clusters: kmeansResult.clusters,
    centroids: kmeansResult.centroids,
    standardizedData: standardizedMatrix.to2DArray(),
    means: means,
    stds: stds
  };
}

// Real PCA for visualization using SVD
export function performPCA(data: number[][]) {
  if (data.length === 0 || data[0].length === 0) {
    return {
      projectedData: data.map((_, i) => [i, 0]),
      explainedVariance: [1.0, 0.0],
      totalVariance: 1.0
    };
  }

  const matrix = new Matrix(data);

  // Handle edge case where we have fewer dimensions than needed
  if (matrix.columns < 2) {
    return {
      projectedData: data.map((row, i) => [row[0] || 0, i * 0.1]),
      explainedVariance: [1.0, 0.0],
      totalVariance: 1.0
    };
  }

  // Center the data (subtract mean from each column)
  const means = matrix.mean('column') as number[];
  const centeredMatrix = matrix.clone();
  for (let col = 0; col < matrix.columns; col++) {
    for (let row = 0; row < matrix.rows; row++) {
      centeredMatrix.set(row, col, matrix.get(row, col) - means[col]);
    }
  }

  // Perform SVD (Singular Value Decomposition)
  const svd = new SingularValueDecomposition(centeredMatrix, {
    computeLeftSingularVectors: true,
    computeRightSingularVectors: false
  });

  // Get the first 2 principal components
  const pc1 = svd.leftSingularVectors.getColumn(0);
  const pc2 = svd.leftSingularVectors.getColumn(1);

  // Project data onto first 2 principal components
  const projectedData = pc1.map((val, idx) => [val, pc2[idx]]);

  // Calculate explained variance
  const singularValues = svd.diagonal;
  const eigenvalues = singularValues.map(sv => sv * sv / (matrix.rows - 1));
  const totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0);

  const explainedVariance = [
    eigenvalues[0] / totalVariance,
    eigenvalues[1] / totalVariance
  ];

  console.log('PCA Debug:', {
    numDimensions: matrix.columns,
    numSamples: matrix.rows,
    numComponents: eigenvalues.length,
    pc1Variance: (explainedVariance[0] * 100).toFixed(2) + '%',
    pc2Variance: (explainedVariance[1] * 100).toFixed(2) + '%',
    totalExplained: ((explainedVariance[0] + explainedVariance[1]) * 100).toFixed(2) + '%'
  });

  return {
    projectedData,
    explainedVariance,
    totalVariance: explainedVariance[0] + explainedVariance[1]
  };
}

export function performAnalysis(
  embeddings: number[][],
  labels: { [key: string]: string },
  identifiers: string[],
  config: {
    numDimensions: number;
    numClusters: number;
  }
) {
  // Step 1: Select discriminative dimensions using t-tests
  const { selectedDimensions, dimensionStats } = selectDiscriminativeDimensions(
    embeddings,
    labels,
    identifiers,
    config.numDimensions
  );

  // Step 2: Perform clustering using selected dimensions
  const clusteringResult = performClustering(
    embeddings,
    selectedDimensions,
    config.numClusters
  );

  // Step 3: Perform PCA for visualization
  const pcaResult = performPCA(clusteringResult.standardizedData);

  // Step 4: Prepare results
  const results = {
    clusterAssignments: clusteringResult.clusters,
    visualization: {
      points: pcaResult.projectedData.map((point, index) => ({
        x: point[0],
        y: point[1],
        identifier: identifiers[index],
        cluster: clusteringResult.clusters[index],
        label: labels[identifiers[index]] || null
      })),
      explainedVariance: pcaResult.explainedVariance,
      totalVarianceExplained: pcaResult.totalVariance
    },
    statistics: {
      selectedDimensions,
      dimensionStats: dimensionStats.map(stat => ({
        dimension: stat.dimension,
        pValue: stat.pValue,
        significance: stat.pValue < 0.05 ? 'significant' : 'not significant'
      })),
      numClusters: config.numClusters,
      numDimensions: config.numDimensions,
      totalSamples: embeddings.length,
      labeledSamples: Object.keys(labels).length
    },
    clusters: Array.from({ length: config.numClusters }, (_, clusterIndex) => {
      const clusterItems = identifiers
        .map((id, index) => ({ id, index }))
        .filter(item => clusteringResult.clusters[item.index] === clusterIndex)
        .map(item => ({
          identifier: item.id,
          label: labels[item.id] || null
        }));

      return {
        id: clusterIndex,
        items: clusterItems,
        size: clusterItems.length
      };
    })
  };

  return results;
}
