// Complete Data Science, Machine Learning & Deep Learning Mastery Course (Zero to Hero)

export const dataScienceCourse = {
  title: "Data Science, Machine Learning & Deep Learning Mastery",
  description: "Comprehensive professional data science and machine learning mastery curriculum: Python, NumPy Vectorization, Pandas Data Wrangling, Statistical Hypothesis Testing, Scikit-learn Machine Learning, Deep Learning with PyTorch, Convolutional Neural Networks, NLP Transformers with Hugging Face, and MLOps Model Deployment.",
  slug: "data-science",
  stream: "data-science",
  imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  order: 5,
  modules: [
    {
      title: "Phase 1: Python, NumPy Vectorization & Array Memory Layouts",
      description: "Master Python numerical computing, ndarray memory layouts (C-contiguous vs Fortran), vectorized broadcasting, linear algebra, and ufuncs.",
      slug: "phase-1-numpy-array-computing",
      topics: [
        {
          title: "NumPy Array Memory Internals & Vectorized Operations",
          description: "Explore ndarray striding, broadcasting rules, matrix dot products, eigenvalues, and avoiding Python loop bottlenecks.",
          slug: "numpy-memory-vectorization",
          difficulty: 2,
          prerequisites: [],
          concepts: [
            {
              title: "ndarray Memory Strides & Contiguity",
              description: "A NumPy array is a pointer to a contiguous block of memory with metadata: shape, dtype, and strides. Strides dictate how many bytes must be skipped in memory to move to the next element along each dimension."
            },
            {
              title: "Broadcasting Rules & Zero-Copy Alignment",
              description: "NumPy aligns dimensions from right to left. Two dimensions are compatible when they are equal, or one of them is 1. Broadcasting performs operations without copying data in memory."
            },
            {
              title: "Vectorization vs Python Loops",
              description: "Standard Python loops incur bytecode dispatch overhead for every iteration. Vectorized operations call pre-compiled C/Fortran routines that utilize SIMD (Single Instruction, Multiple Data) CPU instructions for 50x-100x speedups."
            }
          ],
          examples: [
            {
              title: "Vectorized Normal Equation Linear Regression with NumPy",
              description: "Solving linear regression analytically in one vectorized step: theta = (X^T X)^(-1) X^T y",
              starterCode: `import numpy as np

def normal_equation_fit(X, y):
    # Add bias term and compute theta = (X^T X)^(-1) X^T y
    pass`,
              solutionCode: `import numpy as np

def normal_equation_fit(X, y):
    # Add column of ones for bias term (intercept)
    N = X.shape[0]
    X_b = np.hstack([np.ones((N, 1)), X])
    
    # theta = (X_b^T @ X_b)^(-1) @ X_b^T @ y
    theta = np.linalg.pinv(X_b.T @ X_b) @ X_b.T @ y
    return theta

# Generate synthetic dataset: y = 3 + 2.5*x1 - 1.2*x2
np.random.seed(42)
X_data = np.random.randn(100, 2)
y_data = 3.0 + 2.5 * X_data[:, 0] - 1.2 * X_data[:, 1] + np.random.randn(100) * 0.1

params = normal_equation_fit(X_data, y_data)
print(f"Fitted Parameters: Bias={params[0]:.2f}, W1={params[1]:.2f}, W2={params[2]:.2f}")`,
              expectedOutput: "Fitted Parameters: Bias=3.00, W1=2.50, W2=-1.20"
            }
          ],
          exercises: [
            {
              title: "Compute Pairwise Euclidean Distance Matrix",
              description: "Write a vectorized function that computes the distance matrix between all pairs of points in X without for-loops",
              instructions: "Implement pairwise_distances(X) using matrix multiplication: D^2 = sum(A^2) + sum(B^2) - 2 A B^T.",
              starterCode: `import numpy as np

def pairwise_distances(X):
    # Return (N, N) distance matrix
    pass`,
              solutionCode: `import numpy as np

def pairwise_distances(X):
    # X shape: (N, D)
    sum_sq = np.sum(X**2, axis=1, keepdims=True) # (N, 1)
    D_sq = sum_sq + sum_sq.T - 2 * np.dot(X, X.T)
    # Clip numerical precision artifacts below zero
    return np.sqrt(np.maximum(D_sq, 0.0))

pts = np.array([[0, 0], [3, 4], [0, 4]])
print(pairwise_distances(pts))`,
              testCases: "Diagonal elements are 0; Computes correct Euclidean distances; Returns symmetric (N, N) matrix",
              hints: "Use np.sum(X**2, axis=1) combined with broadcasting and matrix dot product.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "NumPy Vectorized Memory & Broadcasting",
              config: JSON.stringify({
                nodes: [
                  { id: "arr1", label: "Array A: Shape (4, 3)\nContinuous Memory Buffer", x: 80, y: 120 },
                  { id: "arr2", label: "Array B: Shape (1, 3)\nStrided Broadcasting", x: 280, y: 50 },
                  { id: "simd", label: "SIMD Vector Engine\nC/Fortran Assembly Core", x: 480, y: 120 },
                  { id: "out", label: "Output Array: (4, 3)\n100x Speedup vs Python Loop", x: 680, y: 120 }
                ],
                edges: [
                  { from: "arr1", to: "simd", label: "stream rows" },
                  { from: "arr2", to: "simd", label: "broadcast stride=0" },
                  { from: "simd", to: "out", label: "parallel compute" }
                ],
                steps: [
                  { id: "1", activeNodes: ["arr1", "arr2"], description: "NumPy aligns dimensions right-to-left and identifies broadcastable axes" },
                  { id: "2", activeNodes: ["arr2", "simd"], description: "Broadcasting adjusts memory strides to 0 without copying data in RAM" },
                  { id: "3", activeNodes: ["simd", "out"], description: "CPU SIMD instructions execute operations in parallel across registers" }
                ]
              })
            }
          ],
          lesson: {
            title: "NumPy Array Memory Internals & Vectorized Operations",
            content: `## NumPy Vectorization & Array Memory Architecture

### 1. The Structure of an ndarray
An \`ndarray\` consists of:
- **Raw Data Pointer**: A contiguous block of memory.
- **Data Type (\`dtype\`)**: \`float64\` (8 bytes), \`int32\` (4 bytes).
- **Shape**: Dimensions tuple, e.g. \`(1000, 300)\`.
- **Strides**: Step size in bytes along each dimension.

### 2. The Power of Broadcasting
$$\\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\end{bmatrix} + \\begin{bmatrix} 10 & 20 & 30 \\end{bmatrix} = \\begin{bmatrix} 11 & 22 & 33 \\\\ 14 & 25 & 36 \\end{bmatrix}$$
Broadcasting achieves this calculation with **zero memory duplication** by setting the row stride of the 1D vector to 0.`,
            explanation: "Master the low-level memory mechanics, broadcasting rules, and high-performance vectorization of NumPy."
          }
        }
      ]
    },
    {
      title: "Phase 2: Pandas Data Wrangling, Time Series & Feature Engineering",
      description: "Master real-world data processing with Pandas: Indexing (loc/iloc), GroupBy aggregation, multi-level indexing, rolling windows, and feature transformation.",
      slug: "phase-2-pandas-data-wrangling",
      topics: [
        {
          title: "Pandas DataFrames, GroupBy & Time Series Manipulation",
          description: "Learn advanced querying, split-apply-combine patterns, pivot tables, handling missing data, and date-time resampling.",
          slug: "pandas-groupby-timeseries",
          difficulty: 2,
          prerequisites: [0],
          concepts: [
            {
              title: "The Split-Apply-Combine Strategy",
              description: "`groupby()` splits data into subsets based on keys, applies transformations (mean, sum, custom lambdas), and combines the results into a unified DataFrame or Series."
            },
            {
              title: "Window Functions & Resampling",
              description: "Pandas provides `rolling(window=7).mean()` for moving averages and `resample('W')` for temporal aggregation across financial and sensor data."
            },
            {
              title: "Categorical Encoding & Imputation",
              description: "Handling missing values (`fillna`, `interpolate`) and encoding categorical strings into numeric vectors via one-hot encoding or target encoding."
            }
          ],
          examples: [
            {
              title: "Financial Time Series Moving Average & Drawdown with Pandas",
              description: "Computing rolling volatility, 30-day moving average, and max drawdown on stock prices",
              starterCode: `import pandas as pd
import numpy as np

def compute_financial_metrics(prices_series):
    # Compute 7-day MA, rolling volatility, and peak-to-trough drawdown
    pass`,
              solutionCode: `import pandas as pd
import numpy as np

def compute_financial_metrics(prices):
    df = pd.DataFrame({'price': prices})
    df['returns'] = df['price'].pct_change()
    df['ma_7'] = df['price'].rolling(window=7, min_periods=1).mean()
    df['volatility_7'] = df['returns'].rolling(window=7, min_periods=1).std()
    
    # Maximum Drawdown calculation
    df['peak'] = df['price'].cummax()
    df['drawdown'] = (df['price'] - df['peak']) / df['peak']
    
    return df

dates = pd.date_range('2024-01-01', periods=10, freq='D')
sample_prices = pd.Series([100, 102, 105, 98, 95, 99, 104, 108, 107, 110], index=dates)
metrics = compute_financial_metrics(sample_prices)
print(metrics[['price', 'ma_7', 'drawdown']].head(6))`,
              expectedOutput: "Calculated 7-day rolling moving average and peak drawdown"
            }
          ],
          exercises: [
            {
              title: "Customer Cohort Retention Matrix",
              description: "Write a function that calculates monthly cohort retention percentages from transaction records",
              instructions: "Group transactions by user cohort month and order month, compute active customer count and divide by cohort initial size.",
              starterCode: `import pandas as pd

def calculate_cohort_retention(df):
    # df columns: user_id, order_date, amount
    pass`,
              solutionCode: `import pandas as pd

def calculate_cohort_retention(df):
    df['order_month'] = df['order_date'].dt.to_period('M')
    df['cohort_month'] = df.groupby('user_id')['order_date'].transform('min').dt.to_period('M')
    
    cohort_data = df.groupby(['cohort_month', 'order_month'])['user_id'].nunique().reset_index()
    cohort_data['period_number'] = (cohort_data['order_month'] - cohort_data['cohort_month']).apply(lambda x: x.n)
    
    cohort_pivot = cohort_data.pivot(index='cohort_month', columns='period_number', values='user_id')
    cohort_size = cohort_pivot.iloc[:, 0]
    retention_matrix = cohort_pivot.divide(cohort_size, axis=0) * 100
    return retention_matrix.round(1)`,
              testCases: "Period 0 is always 100%; Returns percentage matrix; Correctly identifies cohort by first purchase",
              hints: "Calculate cohort_month using groupby('user_id')['order_date'].transform('min').",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Pandas Split-Apply-Combine Architecture",
              config: JSON.stringify({
                nodes: [
                  { id: "raw", label: "Raw Transactions\n1,000,000 Rows", x: 80, y: 120 },
                  { id: "split", label: "Split by Category\nHash Table Bucketing", x: 280, y: 120 },
                  { id: "apply", label: "Apply Aggregations\nsum(), mean(), std()", x: 480, y: 120 },
                  { id: "combine", label: "Summary DataFrame\nClean Output", x: 670, y: 120 }
                ],
                edges: [
                  { from: "raw", to: "split", label: "groupby(['region', 'dept'])" },
                  { from: "split", to: "apply", label: "parallel agg" },
                  { from: "apply", to: "combine", label: "re-index" }
                ],
                steps: [
                  { id: "1", activeNodes: ["raw", "split"], description: "Dataset partitioned into separate index buckets based on group keys" },
                  { id: "2", activeNodes: ["split", "apply"], description: "Aggregate math operations applied independently to each subset" },
                  { id: "3", activeNodes: ["apply", "combine"], description: "Outputs consolidated into a structured, indexed result DataFrame" }
                ]
              })
            }
          ],
          lesson: {
            title: "Pandas DataFrames, GroupBy & Time Series Manipulation",
            content: `## Data Wrangling & Feature Engineering with Pandas

### 1. Vectorized String & Date Accessors
- \`df['name'].str.lower().str.strip()\`
- \`df['timestamp'].dt.day_name()\`

### 2. Handling Missing Data (Imputation)
- Forward Fill for time series: \`df.ffill()\`
- Median imputation for skewed numeric features: \`df['income'].fillna(df['income'].median())\``,
            explanation: "Master production-grade data manipulation, grouping, and time-series feature engineering with Pandas."
          }
        }
      ]
    },
    {
      title: "Phase 3: Statistical Inference, Hypothesis Testing & A/B Experiments",
      description: "Master probability distributions, Central Limit Theorem, Student's t-test, Chi-Square, ANOVA, p-values, and statistical power in A/B testing.",
      slug: "phase-3-statistics-hypothesis-testing",
      topics: [
        {
          title: "Hypothesis Testing, p-values & A/B Test Design",
          description: "Learn two-sample t-tests, Z-tests, Chi-square tests for categorical data, sample size calculation, and preventing Type I/II errors.",
          slug: "hypothesis-testing-ab-testing",
          difficulty: 3,
          prerequisites: [0, 1],
          concepts: [
            {
              title: "Null vs Alternative Hypothesis (H0 vs H1)",
              description: "H0 posits no difference between control and treatment groups. H1 asserts a significant effect. The p-value measures the probability of observing results at least as extreme as our data assuming H0 is true."
            },
            {
              title: "Type I (Alpha) and Type II (Beta) Errors",
              description: "Type I Error (False Positive, alpha=0.05): Claiming a feature works when it doesn't. Type II Error (False Negative, beta=0.20): Missing a real effect due to insufficient sample size or low statistical power (1 - beta = 80%)."
            },
            {
              title: "Two-Sample t-test & Welch's Correction",
              description: "Compares means of two independent samples. When variances are unequal, Welch's t-test adjusts degrees of freedom to avoid inflated false positive rates."
            }
          ],
          examples: [
            {
              title: "Welch's Two-Sample t-test in Python (SciPy)",
              description: "Performing rigorous statistical testing on conversion rates between UI variants",
              starterCode: `from scipy import stats
import numpy as np

def analyze_ab_test(control_metrics, treatment_metrics, alpha=0.05):
    # Run Welch's t-test and compute p-value and confidence interval
    pass`,
              solutionCode: `from scipy import stats
import numpy as np

def analyze_ab_test(control, treatment, alpha=0.05):
    t_stat, p_val = stats.ttest_ind(treatment, control, equal_var=False)
    
    mean_diff = float(np.mean(treatment) - np.mean(control))
    lift = (mean_diff / np.mean(control)) * 100
    is_significant = p_val < alpha
    
    return {
        "mean_diff": round(mean_diff, 4),
        "lift_percent": round(lift, 2),
        "t_statistic": round(float(t_stat), 4),
        "p_value": round(float(p_val), 5),
        "is_significant": is_significant,
    }

# Synthetic test results
np.random.seed(42)
ctrl = np.random.normal(loc=10.0, scale=2.5, size=500)
treat = np.random.normal(loc=10.45, scale=2.5, size=500)

result = analyze_ab_test(ctrl, treat)
print("A/B Test Analysis Report:", result)`,
              expectedOutput: "Welch's t-test with p-value and statistical significance"
            }
          ],
          exercises: [
            {
              title: "Compute Required Sample Size for A/B Test",
              description: "Write a function calculating minimum sample size per variant for a given baseline conversion rate, minimum detectable effect (MDE), and power=0.8",
              instructions: "Use standard normal distribution critical values: Z_alpha (1.96) and Z_beta (0.84).",
              starterCode: `from scipy import stats
import numpy as np

def calculate_sample_size(baseline_rate, mde_relative, power=0.8, alpha=0.05):
    # Return required sample size per variant
    pass`,
              solutionCode: `from scipy import stats
import numpy as np

def calculate_sample_size(p1, mde_rel, power=0.8, alpha=0.05):
    p2 = p1 * (1.0 + mde_rel)
    p_pool = (p1 + p2) / 2.0
    
    z_alpha = stats.norm.ppf(1 - alpha / 2) # 1.96 for 0.05
    z_beta = stats.norm.ppf(power)          # 0.84 for 0.80
    
    numerator = (z_alpha * np.sqrt(2 * p_pool * (1 - p_pool)) + z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    denominator = (p2 - p1) ** 2
    
    return int(np.ceil(numerator / denominator))

n = calculate_sample_size(baseline_rate=0.10, mde_rel=0.10) # 10% baseline, detect 10% relative lift
print(f"Required Sample Size per Variant: {n:,} users")`,
              testCases: "Computes larger sample size for smaller MDE; Uses 95% confidence and 80% power; Returns positive integer",
              hints: "Use norm.ppf to get Z-scores and solve standard sample size formula for proportions.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "A/B Testing Statistical Decision Pipeline",
              config: JSON.stringify({
                nodes: [
                  { id: "exp", label: "Live Experiment\nControl (A) vs Treatment (B)", x: 80, y: 120 },
                  { id: "stat", label: "Statistical Test\nWelch's t-test / Chi-Square", x: 280, y: 120 },
                  { id: "eval", label: "Significance Check\np < 0.05 & Power >= 80%", x: 480, y: 120 },
                  { id: "ship", label: "Rollout Variant B\nConfirmed Revenue Lift", x: 680, y: 120 }
                ],
                edges: [
                  { from: "exp", to: "stat", label: "sample metrics" },
                  { from: "stat", to: "eval", label: "compute p-value" },
                  { from: "eval", to: "ship", label: "p < 0.05 (reject H0)" }
                ],
                steps: [
                  { id: "1", activeNodes: ["exp", "stat"], description: "Randomized users assigned to control and treatment groups" },
                  { id: "2", activeNodes: ["stat", "eval"], description: "Welch's t-test computes test statistic against null distribution" },
                  { id: "3", activeNodes: ["eval", "ship"], description: "Statistically significant lift confirmed before shipping to 100% of users" }
                ]
              })
            }
          ],
          lesson: {
            title: "Hypothesis Testing, p-values & A/B Test Design",
            content: `## Statistical Inference & Experimentation

### 1. The P-Value Misconception
A p-value is **NOT** the probability that the hypothesis is true. It is the probability of obtaining data as extreme as observed, assuming the null hypothesis is true ($P(\\text{Data} \\mid H_0)$).

### 2. The Golden Rules of A/B Testing
1. **Fix sample size in advance**: Never stop a test early just because it crossed $p < 0.05$ (peeking problem).
2. **Account for Multiple Comparisons**: Use Bonferroni or False Discovery Rate (FDR) corrections when testing multiple variations.`,
            explanation: "Master the mathematical rigor required to design, execute, and analyze valid A/B experiments."
          }
        }
      ]
    },
    {
      title: "Phase 4: Scikit-learn Machine Learning & Pipeline Engineering",
      description: "Build robust machine learning models: Logistic Regression, Random Forests, XGBoost, Cross-Validation, Hyperparameter Tuning, and Pipeline transformers.",
      slug: "phase-4-scikit-learn-ml",
      topics: [
        {
          title: "Supervised Learning, Feature Pipelines & Model Evaluation",
          description: "Master classification, regression, ColumnTransformer, cross-validation, precision-recall tradeoffs, ROC-AUC, and ensemble algorithms.",
          slug: "supervised-learning-pipelines",
          difficulty: 3,
          prerequisites: [0, 1, 2],
          concepts: [
            {
              title: "The Scikit-learn Pipeline Pattern",
              description: "Pipelines bundle preprocessing (scaling, imputation, one-hot encoding) and estimators into a single atomic object, eliminating data leakage between train and test sets."
            },
            {
              title: "Ensemble Methods (Random Forest & Gradient Boosting)",
              description: "Bagging (Random Forest) trains parallel independent trees on bootstrap samples to reduce variance. Boosting (XGBoost/LightGBM) trains sequential trees that correct residual errors of prior trees to reduce bias."
            },
            {
              title: "Evaluation Metrics (ROC-AUC, Precision, Recall, F1)",
              description: "Accuracy is misleading on imbalanced datasets. Precision (True Positives / Predicted Positives) and Recall (True Positives / Actual Positives) capture trade-offs, summarized by F1 and ROC-AUC."
            }
          ],
          examples: [
            {
              title: "Complete Scikit-Learn Pipeline with Preprocessing & CV",
              description: "Building an end-to-end classification pipeline with numerical scaling and categorical encoding",
              starterCode: `from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier

def build_ml_pipeline(numeric_features, categorical_features):
    # Construct complete pipeline
    pass`,
              solutionCode: `from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
import pandas as pd
import numpy as np

def build_ml_pipeline(num_cols, cat_cols):
    num_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])
    
    cat_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])
    
    preprocessor = ColumnTransformer([
        ('num', num_transformer, num_cols),
        ('cat', cat_transformer, cat_cols),
    ])
    
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42)),
    ])
    
    return pipeline

# Demo data
df = pd.DataFrame({
    'age': [25, 45, np.nan, 35, 52],
    'income': [50000, 120000, 85000, np.nan, 140000],
    'city': ['NYC', 'LA', 'NYC', 'SF', 'LA'],
    'churn': [0, 1, 0, 0, 1]
})

pipe = build_ml_pipeline(['age', 'income'], ['city'])
X = df.drop(columns=['churn'])
y = df['churn']
pipe.fit(X, y)
print("Pipeline successfully fitted. Test prediction:", pipe.predict(X.iloc[0:1]))`,
              expectedOutput: "Scikit-learn ColumnTransformer pipeline with numerical and categorical encoding"
            }
          ],
          exercises: [
            {
              title: "Tune Hyperparameters with GridSearchCV",
              description: "Write code that searches optimal max_depth and n_estimators for a Random Forest using 5-fold cross validation",
              instructions: "Define param_grid and run GridSearchCV with scoring='roc_auc'.",
              starterCode: `from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

def optimize_rf(X, y):
    # Run GridSearchCV and return best_params_
    pass`,
              solutionCode: `from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

def optimize_rf(X, y):
    param_grid = {
        'n_estimators': [50, 100],
        'max_depth': [3, 5, None],
        'min_samples_split': [2, 5],
    }
    rf = RandomForestClassifier(random_state=42)
    grid = GridSearchCV(rf, param_grid, cv=5, scoring='roc_auc', n_jobs=-1)
    grid.fit(X, y)
    return grid.best_params_, grid.best_score_`,
              testCases: "Runs 5-fold CV; Evaluates on roc_auc metric; Returns best parameters dictionary",
              hints: "Instantiate GridSearchCV(rf, param_grid, cv=5, scoring='roc_auc') and call fit(X, y).",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Scikit-learn Production ML Pipeline Flow",
              config: JSON.stringify({
                nodes: [
                  { id: "raw", label: "Raw Heterogeneous Data\nNumerical & Categorical", x: 80, y: 120 },
                  { id: "prep", label: "ColumnTransformer\nImpute + Scale + One-Hot", x: 280, y: 120 },
                  { id: "model", label: "Ensemble Estimator\nRandom Forest / XGBoost", x: 480, y: 120 },
                  { id: "eval", label: "Model Metrics\nROC-AUC, F1, Confusion Matrix", x: 670, y: 120 }
                ],
                edges: [
                  { from: "raw", to: "prep", label: "fit_transform()" },
                  { from: "prep", to: "model", label: "feature matrix" },
                  { from: "model", to: "eval", label: "cross_val_score()" }
                ],
                steps: [
                  { id: "1", activeNodes: ["raw", "prep"], description: "Raw features transformed without leaking test set distributions" },
                  { id: "2", activeNodes: ["prep", "model"], description: "Preprocessed vectors fed to ensemble decision tree algorithm" },
                  { id: "3", activeNodes: ["model", "eval"], description: "Model scored via 5-fold cross-validation across multiple evaluation metrics" }
                ]
              })
            }
          ],
          lesson: {
            title: "Supervised Learning, Feature Pipelines & Model Evaluation",
            content: `## Scikit-learn Pipeline Architecture

### 1. Avoiding Data Leakage
Never scale the entire dataset before splitting! If you compute mean and standard deviation across all data, information from the test set leaks into training.
\`\`\`python
# CORRECT: Pipeline encapsulates scaler inside cross-validation splits
pipeline = Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression())])
scores = cross_val_score(pipeline, X, y, cv=5)
\`\`\`

### 2. Feature Importance
Tree models provide native feature importance scores to help interpret which variables drive model decisions.`,
            explanation: "Master production machine learning pipelines, ensemble classifiers, and rigorous model evaluation in scikit-learn."
          }
        }
      ]
    },
    {
      title: "Phase 5: Deep Learning with PyTorch, CNNs & Transfer Learning",
      description: "Master deep neural networks with PyTorch: Tensors, Autograd, Custom nn.Module layers, Convolutional Neural Networks (CNNs), ResNet architectures, and Transfer Learning.",
      slug: "phase-5-pytorch-deep-learning",
      topics: [
        {
          title: "PyTorch Deep Learning & Convolutional Vision Architectures",
          description: "Build neural networks from scratch in PyTorch, implement custom training loops with Adam optimizer, and fine-tune pretrained ResNets with torchvision.",
          slug: "pytorch-cnn-transfer-learning",
          difficulty: 4,
          prerequisites: [0, 1, 2, 3],
          concepts: [
            {
              title: "PyTorch Autograd & Computational Graph",
              description: "PyTorch builds a dynamic directed acyclic graph (DAG) during the forward pass. Calling `loss.backward()` traverses the graph backwards using the chain rule to compute exact analytical gradients."
            },
            {
              title: "Convolution, Pooling & Receptive Fields",
              description: "2D Convolutions apply spatial filter kernels ($3 \\times 3$) across channels to capture translation-invariant local patterns (edges, textures, shapes). Max pooling downsamples spatial dimensions while preserving dominant activations."
            },
            {
              title: "ResNet Skip Connections (Residual Learning)",
              description: "Deep networks suffer from vanishing gradients. ResNet introduces identity shortcut connections: $F(x) + x$, allowing gradients to flow unimpeded through hundreds of layers."
            }
          ],
          examples: [
            {
              title: "Complete PyTorch CNN Architecture & Training Loop",
              description: "Building, training, and evaluating a Convolutional Neural Network with PyTorch",
              starterCode: `import torch
import torch.nn as nn

class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # Define conv, pool, and linear layers
        
    def forward(self, x):
        pass`,
              solutionCode: `import torch
import torch.nn as nn
import torch.optim as optim

class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )
        
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# Synthetic Training Loop Demonstration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = ConvNet(num_classes=5).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)

# Synthetic batch: 16 images (3 channels, 32x32)
sample_images = torch.randn(16, 3, 32, 32).to(device)
sample_labels = torch.randint(0, 5, (16,)).to(device)

model.train()
optimizer.zero_grad()
outputs = model(sample_images)
loss = criterion(outputs, sample_labels)
loss.backward()
optimizer.step()

print(f"PyTorch Training Step Complete! Loss: {loss.item():.4f}")`,
              expectedOutput: "PyTorch CNN forward-backward training step executed cleanly"
            }
          ],
          exercises: [
            {
              title: "Freeze Pretrained Model for Transfer Learning",
              description: "Write code to load a pretrained ResNet-18, freeze all backbone parameters, and replace the final fully connected layer for 4 classes",
              instructions: "Set param.requires_grad = False for backbone and assign model.fc = nn.Linear(in_features, 4).",
              starterCode: `import torch.nn as nn
from torchvision import models

def prepare_transfer_learning_model(num_classes=4):
    # Load resnet18, freeze weights, replace fc
    pass`,
              solutionCode: `import torch.nn as nn
from torchvision import models

def prepare_transfer_learning_model(num_classes=4):
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    
    # Freeze all pretrained convolutional feature layers
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace final classification head with trainable layer
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, num_classes),
    )
    return model`,
              testCases: "Freezes all backbone weights; Sets requires_grad=False on features; Replaces fc layer with correct num_classes",
              hints: "Iterate through model.parameters() setting param.requires_grad = False.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "PyTorch Convolutional Neural Network & Gradient Flow",
              config: JSON.stringify({
                nodes: [
                  { id: "img", label: "Input Image Tensor\n[B, 3, 224, 224]", x: 80, y: 120 },
                  { id: "conv", label: "Conv2D + BatchNorm + ReLU\nFeature Maps Extraction", x: 280, y: 120 },
                  { id: "res", label: "Residual Skip Connection\nF(X) + X (Gradient Highway)", x: 480, y: 120 },
                  { id: "loss", label: "CrossEntropyLoss\nAutograd Backward Pass", x: 680, y: 120 }
                ],
                edges: [
                  { from: "img", to: "conv", label: "forward pass" },
                  { from: "conv", to: "res", label: "residual blocks" },
                  { from: "res", to: "loss", label: "predictions" }
                ],
                steps: [
                  { id: "1", activeNodes: ["img", "conv"], description: "Input image convolved through filter banks to extract low and high-level visual features" },
                  { id: "2", activeNodes: ["conv", "res"], description: "Residual identity shortcuts allow gradients to flow back through deep layers without vanishing" },
                  { id: "3", activeNodes: ["res", "loss"], description: "Loss calculated and gradients automatically propagated via PyTorch Autograd" }
                ]
              })
            }
          ],
          lesson: {
            title: "PyTorch Deep Learning & Convolutional Vision Architectures",
            content: `## Deep Learning with PyTorch

### 1. The Standard Training Loop Structure
\`\`\`python
model.train()
for batch_X, batch_y in dataloader:
    optimizer.zero_grad()            # 1. Clear old gradients
    predictions = model(batch_X)     # 2. Forward pass
    loss = criterion(predictions, y) # 3. Compute loss
    loss.backward()                  # 4. Backward pass (autograd)
    optimizer.step()                 # 5. Update weights
\`\`\`

### 2. Why Transfer Learning Works
Pretrained models on ImageNet (14M images) have already learned universal visual primitives (edges, shapes, lighting, textures). Fine-tuning only the final classifier requires **100x less training data and time**!`,
            explanation: "Master neural network architecture, CNNs, and transfer learning in PyTorch."
          }
        }
      ]
    },
    {
      title: "Phase 6: MLOps, Model Serving & Continuous Monitoring",
      description: "Deploy machine learning models to production: FastAPI serving, ONNX Runtime acceleration, Docker containerization, Data Drift monitoring, and automated retraining.",
      slug: "phase-6-mlops-deployment-monitoring",
      topics: [
        {
          title: "Production Model Serving with FastAPI & Drift Monitoring",
          description: "Learn exporting models to ONNX, sub-10ms inference with FastAPI, logging prediction distributions, and detecting covariate shift with Evidently AI.",
          slug: "fastapi-serving-drift-monitoring",
          difficulty: 4,
          prerequisites: [0, 1, 2, 3, 4],
          concepts: [
            {
              title: "Model Serialization (ONNX vs Pickle)",
              description: "Pickle is Python-version dependent and insecure. ONNX (Open Neural Network Exchange) represents models as a compiled graph, executable across C++, Rust, and Python via ONNX Runtime with hardware acceleration."
            },
            {
              title: "Covariate Shift & Data Drift",
              description: "Over time, production input distributions drift away from training data distributions (e.g. macro-economic shifts, seasonality). Statistical tests (Kolmogorov-Smirnov test, PSI) detect drift before accuracy degrades."
            },
            {
              title: "Automated Retraining Pipelines",
              description: "When drift is detected or scheduled intervals elapse, orchestrated pipelines (Airflow/Prefect) trigger automated data fetching, model retraining, validation assertions, and canary model deployment."
            }
          ],
          examples: [
            {
              title: "High-Performance FastAPI Model Serving Endpoint",
              description: "A production REST API with Pydantic validation and batch prediction support",
              starterCode: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
# Define prediction endpoint`,
              solutionCode: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np

app = FastAPI(title="Real-Time Fraud Detection API", version="1.0.0")

class TransactionPayload(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in USD")
    user_age: int = Field(..., ge=18, le=120)
    tx_count_last_24h: int = Field(..., ge=0)

class PredictionResponse(BaseModel):
    fraud_probability: float
    is_fraud: bool
    risk_level: str

# Mock loaded production model weights
def mock_predict_proba(features):
    # Features: [amount, user_age, tx_count_last_24h]
    logit = (features[0] * 0.005) + (features[2] * 0.3) - (features[1] * 0.02) - 2.0
    prob = 1.0 / (1.0 + np.exp(-logit))
    return float(prob)

@app.post("/v1/predict", response_model=PredictionResponse)
async def predict_fraud(payload: TransactionPayload):
    try:
        feats = np.array([payload.amount, payload.user_age, payload.tx_count_last_24h])
        prob = mock_predict_proba(feats)
        is_fraud = prob >= 0.70
        risk = "HIGH" if prob >= 0.70 else ("MEDIUM" if prob >= 0.30 else "LOW")
        
        return PredictionResponse(
            fraud_probability=round(prob, 4),
            is_fraud=is_fraud,
            risk_level=risk
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "model_version": "v2.1.0"}`
            }
          ],
          exercises: [
            {
              title: "Implement Kolmogorov-Smirnov Data Drift Detector",
              description: "Write a drift detector function comparing reference baseline distributions against production inference logs",
              instructions: "Use scipy.stats.ks_2samp(reference, production) and return boolean is_drift when p-value < 0.05.",
              starterCode: `from scipy import stats

def detect_feature_drift(reference_data, current_data, alpha=0.05):
    # Perform Kolmogorov-Smirnov test and return drift summary
    pass`,
              solutionCode: `from scipy import stats

def detect_feature_drift(reference_data, current_data, alpha=0.05):
    ks_stat, p_val = stats.ks_2samp(reference_data, current_data)
    is_drift = p_val < alpha
    return {
        "ks_statistic": round(float(ks_stat), 4),
        "p_value": round(float(p_val), 5),
        "is_drift_detected": is_drift,
        "action_required": "Trigger Retraining Pipeline" if is_drift else "No Action",
    }`,
              testCases: "Detects drift on shifted distributions; Returns no drift on identical distributions; Reports p-value",
              hints: "Call scipy.stats.ks_2samp and check if p_value < alpha.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "MLOps Continuous Serving & Drift Retraining Loop",
              config: JSON.stringify({
                nodes: [
                  { id: "api", label: "FastAPI Service\nReal-Time REST Inference", x: 80, y: 120 },
                  { id: "log", label: "Telemetry Log Store\nInference Payloads & Latency", x: 280, y: 120 },
                  { id: "drift", label: "Evidently Drift Detector\nKS Test (p < 0.05)?", x: 480, y: 120 },
                  { id: "train", label: "Airflow Retraining DAG\nAutomated Model Update", x: 680, y: 120 }
                ],
                edges: [
                  { from: "api", to: "log", label: "log stream" },
                  { from: "log", to: "drift", label: "daily audit" },
                  { from: "drift", to: "train", label: "drift detected!" }
                ],
                steps: [
                  { id: "1", activeNodes: ["api", "log"], description: "Production inference requests served and logged with feature inputs" },
                  { id: "2", activeNodes: ["log", "drift"], description: "Drift monitor computes Kolmogorov-Smirnov statistics against baseline training data" },
                  { id: "3", activeNodes: ["drift", "train"], description: "Automated retraining pipeline triggered immediately when covariate shift occurs" }
                ]
              })
            }
          ],
          lesson: {
            title: "Production Model Serving with FastAPI & Drift Monitoring",
            content: `## MLOps in Production

### 1. Serving Best Practices
- Use **FastAPI + Pydantic** for typed input validation and auto-generated OpenAPI docs.
- Export models to **ONNX Runtime** to enable parallel CPU/GPU batching with zero Python GIL lockups.

### 2. The 3 Types of ML Drift
1. **Data Drift (Covariate Shift)**: Input feature distribution $P(X)$ changes.
2. **Concept Drift**: The relationship between features and target $P(Y \\mid X)$ changes.
3. **Prior Probability Shift**: The class balance $P(Y)$ changes.`,
            explanation: "Master the complete MLOps lifecycle from low-latency serving to production data drift detection."
          }
        }
      ]
    }
  ]
};
