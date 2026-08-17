export const enterpriseDevopsCicdCourse = {
  "title": "Enterprise DevOps, CI/CD Pipelines & Cloud Architecture",
  "description": "Exhaustive mastery of GitHub Actions, GitLab CI, Bitbucket Pipelines, Docker containerization, Kubernetes orchestration, AWS/GCP cloud deployments, and production observability.",
  "slug": "enterprise-devops-cicd-cloud",
  "stream": "devops",
  "imageUrl": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80",
  "order": 1,
  "modules": [
    {
      "title": "Phase 1: CI/CD Pipelines & Version Control Workflows",
      "description": "Automated build, test, and release pipelines across GitHub Actions, GitLab CI, and Bitbucket Pipelines.",
      "slug": "phase-1-cicd-git-workflows",
      "topics": [
        {
          "title": "GitHub Actions CI/CD Mastery",
          "description": "Building automated CI/CD workflows with GitHub Actions: Workflows, Jobs, Steps, Runners, Matrix builds, Secrets, and Artifacts.",
          "slug": "github-actions-cicd-mastery",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Workflow YAML Syntax",
              "description": "Defining triggers (on push, pull_request), jobs, environment secrets, and action steps."
            },
            {
              "title": "Automated Testing & Linting",
              "description": "Running unit tests, ESLint, typechecks, and building Docker images on every PR."
            },
            {
              "title": "Zero-Downtime Deployment Triggers",
              "description": "Deploying automatically to staging and production on merge to main."
            }
          ],
          "examples": [
            {
              "title": "GitHub Actions CI Workflow YAML",
              "description": "Complete CI workflow for testing and linting a Node/React application",
              "starterCode": "name: CI Pipeline\\non: [push, pull_request]\\njobs:\\n  test:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - uses: actions/checkout@v4\\n      - uses: actions/setup-node@v4\\n        with:\\n          node-version: 20\\n      - run: npm ci\\n      - run: npm test\\n      - run: npm run build",
              "solutionCode": "name: CI Pipeline\\non: [push, pull_request]\\njobs:\\n  test:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - uses: actions/checkout@v4\\n      - uses: actions/setup-node@v4\\n        with:\\n          node-version: 20\\n      - run: npm ci\\n      - run: npm test\\n      - run: npm run build",
              "expectedOutput": "CI Pipeline Executed Successfully"
            }
          ],
          "exercises": [
            {
              "title": "Write a GitHub Actions YAML",
              "description": "Create a CI workflow file",
              "starterCode": "name: CI",
              "solutionCode": "name: CI",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "CI/CD Pipeline Flow",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "GitHub Actions CI/CD Mastery",
            "content": "### \ud83c\udf1f 1. Definition (What is GitHub Actions?)\nGitHub Actions is a continuous integration and continuous delivery (CI/CD) platform that automates your build, test, and deployment pipeline right within GitHub.\n\n---\n\n### \u26a1 2. What Does It Do?\n- **Automates Tests**: Runs unit tests and linter on every pull request.\n- **Prevents Broken Code**: Blocks merges if any test fails.\n- **Automates Releases**: Deploys to AWS, Vercel, or Kubernetes on tag creation.\n\n---\n\n### \ud83c\udfaf 3. When & Why to Use (Use Cases)\n- Production web applications requiring 100% test passing before deployment.\n- Multi-environment staging and release approval gates.\n\n---\n\n### \ud83d\udcbb 4. Syntax & Code Pattern\n```yaml\nname: Deploy Production\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm run build\n```",
            "explanation": "GitHub Actions is the industry standard for modern automated software delivery."
          }
        },
        {
          "title": "GitLab CI/CD & Bitbucket Pipelines",
          "description": "Comparing `.gitlab-ci.yml` and `bitbucket-pipelines.yml` with runner configurations and secret variables.",
          "slug": "gitlab-ci-bitbucket-pipelines",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "GitLab CI Stages & Artifacts",
              "description": "Configuring stages: build, test, staging, production with artifact caching."
            },
            {
              "title": "Bitbucket Pipelines Step Execution",
              "description": "Defining Docker-based steps in Bitbucket Pipelines with environment variables."
            }
          ],
          "examples": [
            {
              "title": "GitLab CI YAML",
              "description": "Sample gitlab-ci.yml",
              "starterCode": "stages:\\n  - test\\n  - deploy",
              "solutionCode": "stages:\\n  - test\\n  - deploy"
            }
          ],
          "exercises": [
            {
              "title": "Configure GitLab CI",
              "description": "Write pipeline",
              "starterCode": "stages: []",
              "solutionCode": "stages: []",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "GitLab Pipeline",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "GitLab CI/CD & Bitbucket Pipelines",
            "content": "Mastering enterprise CI/CD across GitLab and Bitbucket.",
            "explanation": "GitLab and Bitbucket power thousands of enterprise repositories."
          }
        }
      ]
    },
    {
      "title": "Phase 2: Docker Containers & Kubernetes Orchestration",
      "description": "Multi-stage Docker builds, docker-compose microservices, Kubernetes Pods, Services, and Ingress.",
      "slug": "phase-2-docker-kubernetes",
      "topics": [
        {
          "title": "Docker Containers & Multi-Stage Production Builds",
          "description": "Writing optimized Dockerfiles, alpine images, multi-stage caching, and docker-compose for multi-service development.",
          "slug": "docker-containers-multistage-builds",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Multi-Stage Dockerfile",
              "description": "Separating build dependencies from lightweight production runtime images."
            },
            {
              "title": "Docker Compose Multi-Container",
              "description": "Running Node API, Postgres DB, and Redis cache with single `docker-compose up`."
            }
          ],
          "examples": [
            {
              "title": "Production Node.js Dockerfile",
              "description": "Multi-stage Dockerfile",
              "starterCode": "FROM node:20-alpine AS builder\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm ci\\nCOPY . .\\nRUN npm run build\\n\\nFROM node:20-alpine AS runner\\nWORKDIR /app\\nCOPY --from=builder /app/dist ./dist\\nCMD [\"node\", \"dist/server.js\"]",
              "solutionCode": "FROM node:20-alpine AS builder\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm ci\\nCOPY . .\\nRUN npm run build\\n\\nFROM node:20-alpine AS runner\\nWORKDIR /app\\nCOPY --from=builder /app/dist ./dist\\nCMD [\"node\", \"dist/server.js\"]"
            }
          ],
          "exercises": [
            {
              "title": "Write Dockerfile",
              "description": "Create Dockerfile",
              "starterCode": "FROM node:20",
              "solutionCode": "FROM node:20",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "Docker Multi-Stage",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Docker Containers & Multi-Stage Production Builds",
            "content": "Docker ensures identical environments across development and production.",
            "explanation": "Docker is the standard container runtime."
          }
        },
        {
          "title": "Kubernetes Clusters, Pods, Services & Ingress",
          "description": "Deploying containerized microservices to Kubernetes: Pods, Deployments, ReplicaSets, Services, ConfigMaps, and Ingress.",
          "slug": "kubernetes-pods-services-ingress",
          "difficulty": 4,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Deployments & Auto-Scaling",
              "description": "Horizontal Pod Autoscaler (HPA) and rolling zero-downtime updates."
            },
            {
              "title": "Kubernetes Ingress & Routing",
              "description": "Ingress controllers directing external domain traffic to internal ClusterIP services."
            }
          ],
          "examples": [
            {
              "title": "Kubernetes Deployment YAML",
              "description": "Sample k8s deployment",
              "starterCode": "apiVersion: apps/v1\\nkind: Deployment\\nmetadata:\\n  name: api-deployment\\nspec:\\n  replicas: 3",
              "solutionCode": "apiVersion: apps/v1\\nkind: Deployment\\nmetadata:\\n  name: api-deployment\\nspec:\\n  replicas: 3"
            }
          ],
          "exercises": [
            {
              "title": "Create K8s Deployment",
              "description": "Write k8s YAML",
              "starterCode": "kind: Deployment",
              "solutionCode": "kind: Deployment",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "K8s Architecture",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Kubernetes Clusters, Pods, Services & Ingress",
            "content": "Kubernetes orchestrates thousands of containers at enterprise scale.",
            "explanation": "Kubernetes is the industry standard cloud container orchestrator."
          }
        }
      ]
    },
    {
      "title": "Phase 3: Cloud Providers (AWS, GCP, Azure & Vercel)",
      "description": "Deploying serverless and containerized workloads across AWS (EC2, S3, RDS, Lambda), GCP, and Edge Vercel.",
      "slug": "phase-3-cloud-providers-aws-gcp",
      "topics": [
        {
          "title": "AWS Cloud Architecture (EC2, S3, RDS, Lambda)",
          "description": "Architecting resilient cloud backends using AWS compute, relational storage, and serverless functions.",
          "slug": "aws-cloud-architecture-mastery",
          "difficulty": 4,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Compute & Serverless",
              "description": "EC2 virtual instances vs AWS Lambda event-driven serverless functions."
            },
            {
              "title": "Storage & Managed DBs",
              "description": "S3 object storage for uploads and RDS PostgreSQL with automated backups."
            }
          ],
          "examples": [
            {
              "title": "AWS Lambda Node Handler",
              "description": "Serverless handler",
              "starterCode": "exports.handler = async (event) => {\\n  return { statusCode: 200, body: JSON.stringify({ message: 'Hello AWS Lambda' }) };\\n};",
              "solutionCode": "exports.handler = async (event) => {\\n  return { statusCode: 200, body: JSON.stringify({ message: 'Hello AWS Lambda' }) };\\n};"
            }
          ],
          "exercises": [
            {
              "title": "Write Lambda Handler",
              "description": "Serverless function",
              "starterCode": "exports.handler = async () => {}",
              "solutionCode": "exports.handler = async () => {}",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "AWS Architecture",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "AWS Cloud Architecture (EC2, S3, RDS, Lambda)",
            "content": "AWS powers the backbone of global enterprise web applications.",
            "explanation": "AWS is the market-leading cloud infrastructure provider."
          }
        }
      ]
    }
  ]
};
