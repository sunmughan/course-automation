// Complete DevOps, Cloud Infrastructure & SRE Mastery Course (Zero to Hero)

export const devopsCourse = {
  title: "DevOps, Cloud Infrastructure & SRE Engineering Mastery",
  description: "Exhaustive professional DevOps curriculum: Linux Systems Internals, Advanced Docker Containerization, Kubernetes Cluster Orchestration, Infrastructure as Code (Terraform & AWS Cloud Architecture), CI/CD Automation, GitOps with ArgoCD, and Prometheus & Grafana Observability.",
  slug: "devops-cloud-engineering",
  stream: "devops",
  imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80",
  order: 6,
  modules: [
    {
      title: "Phase 1: Linux Systems Internals, Shell Scripting & Networking",
      description: "Master the Linux operating system: processes (signals, systemd), file permissions, TCP/IP networking, SSH tunneling, and bash automation.",
      slug: "phase-1-linux-systems-networking",
      topics: [
        {
          title: "Linux System Administration, Process Management & Networking",
          description: "Explore systemd service units, process signals (SIGTERM/SIGKILL), journalctl, cgroups, file descriptors, and netstat/ss network diagnostics.",
          slug: "linux-processes-systemd-networking",
          difficulty: 2,
          prerequisites: [],
          concepts: [
            {
              title: "Process Trees & Signals (SIGTERM vs SIGKILL)",
              description: "Linux processes form a tree under PID 1 (systemd). SIGTERM (15) politely requests a process to cleanly close connections and flush buffers. SIGKILL (9) immediately terminates the process at the kernel level without cleanup."
            },
            {
              title: "Systemd Service Units & Daemon Management",
              description: "Systemd manages system initialization and background services. A `.service` unit defines start commands (`ExecStart`), restart policies (`Restart=always`), environment files, and user/group sandboxing."
            },
            {
              title: "Linux Networking & Socket Diagnostics",
              description: "Analyzing network connections with `ss -tulnp`, managing DNS resolution via `/etc/resolv.conf`, setting firewall rules with `iptables` / `ufw`, and inspecting traffic with `tcpdump`."
            }
          ],
          examples: [
            {
              title: "Production Systemd Service Unit for Node.js / Python",
              description: "Writing a robust, secure systemd unit with automatic restart and security sandboxing",
              starterCode: `# /etc/systemd/system/myapp.service
[Unit]
Description=My App
# Configure service`,
              solutionCode: `[Unit]
Description=Production Backend API Service
After=network.target remote-fs.target

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/var/www/api
Environment=NODE_ENV=production PORT=3000
EnvironmentFile=/var/www/api/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5s

# Security Hardening Directives
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target`,
              expectedOutput: "Systemd service configured with auto-restart and security sandboxing"
            }
          ],
          exercises: [
            {
              title: "Write a Bash Server Health Monitor Script",
              description: "Create a bash script that checks CPU usage, free memory percentage, and sends an alert if disk usage exceeds 85%",
              instructions: "Use df -h, free -m, and awk to parse metrics, returning exit code 1 on threshold breach.",
              starterCode: `#!/bin/bash
# Health check script`,
              solutionCode: `#!/bin/bash
set -euo pipefail

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
MEM_FREE_MB=$(free -m | awk 'NR==2 {print $7}')

echo "Current Root Disk Usage: \${DISK_USAGE}%"
echo "Available Memory: \${MEM_FREE_MB} MB"

if [ "$DISK_USAGE" -ge 85 ]; then
    echo "ALERT: Disk usage is critical (\${DISK_USAGE}%)!" >&2
    exit 1
fi

echo "System Health: OK"
exit 0`,
              testCases: "Parses disk usage percentage; Checks memory; Exits with code 1 if disk >= 85%; Exits 0 on healthy status",
              hints: "Use df / | awk 'NR==2 {print $5}' and strip the % sign.",
              difficulty: 2
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Linux Process Lifecycle & Systemd Supervision",
              config: JSON.stringify({
                nodes: [
                  { id: "init", label: "systemd (PID 1)\nKernel Init", x: 80, y: 120 },
                  { id: "fork", label: "fork() & execve()\nSpawns Worker Process", x: 280, y: 120 },
                  { id: "run", label: "Active Daemon\nListening on TCP :3000", x: 480, y: 120 },
                  { id: "heal", label: "Crash Detected\nAuto-Restart (5s delay)", x: 680, y: 120 }
                ],
                edges: [
                  { from: "init", to: "fork", label: "systemctl start" },
                  { from: "fork", to: "run", label: "cgroup isolation" },
                  { from: "run", to: "heal", label: "exit code != 0" },
                  { from: "heal", to: "fork", label: "restart=always" }
                ],
                steps: [
                  { id: "1", activeNodes: ["init", "fork"], description: "Systemd forks and executes daemon process under unprivileged user" },
                  { id: "2", activeNodes: ["fork", "run"], description: "Process assigned to dedicated cgroup with memory and CPU constraints" },
                  { id: "3", activeNodes: ["run", "heal", "fork"], description: "Process failure intercepted by systemd and automatically restarted" }
                ]
              })
            }
          ],
          lesson: {
            title: "Linux System Administration, Process Management & Networking",
            content: `## Linux Systems Architecture for DevOps

### 1. Essential Process Management Commands
- \`ps aux | grep node\`: View running processes.
- \`kill -15 <PID>\`: Send polite \`SIGTERM\` signal.
- \`kill -9 <PID>\`: Forceful \`SIGKILL\` signal.
- \`journalctl -u myapp.service -f -n 100\`: Follow live systemd application logs.

### 2. File Permissions & Octal Notation
- \`chmod 755 script.sh\`: Owner read/write/execute (\`7\`), Group read/execute (\`5\`), Others read/execute (\`5\`).
- \`chown -R www-data:www-data /var/www\`: Change owner and group recursively.`,
            explanation: "Master core Linux systems administration, process signals, and systemd service management."
          }
        }
      ]
    },
    {
      title: "Phase 2: Advanced Docker Containerization & Security Hardening",
      description: "Master production Dockerfiles: Multi-stage builds, layer caching optimization, non-root user sandboxing, distroless images, and Docker Compose.",
      slug: "phase-2-docker-containerization",
      topics: [
        {
          title: "Multi-Stage Docker Builds, Layer Caching & Security",
          description: "Learn minimizing image sizes, optimizing build cache, eliminating vulnerabilities with distroless base images, and orchestrating multi-container environments.",
          slug: "docker-multistage-caching-security",
          difficulty: 3,
          prerequisites: [0],
          concepts: [
            {
              title: "Docker Layer Caching Mechanics",
              description: "Docker executes instructions from top to bottom. If a layer hasn't changed, all subsequent layers can use the cache. Placing `COPY package*.json ./` and `RUN npm ci` before `COPY . .` ensures dependencies aren't reinstalled on code edits."
            },
            {
              title: "Multi-Stage Builds & Distroless Images",
              description: "Multi-stage builds separate the build environment (compilers, build tools, dev dependencies) from the final minimal runtime image, shrinking image sizes from 1GB+ down to <50MB."
            },
            {
              title: "Rootless Containers & Principle of Least Privilege",
              description: "Running containers as `root` is a major security vulnerability. Explicitly creating and switching to an unprivileged user (`USER appuser`) prevents container breakout attacks."
            }
          ],
          examples: [
            {
              title: "Production Multi-Stage Dockerfile with Security Hardening",
              description: "Building an optimized, secure Node.js production image with multi-stage build",
              starterCode: `# Write multi-stage Dockerfile
FROM node:20-alpine
WORKDIR /app
# Build and run`,
              solutionCode: `# Stage 1: Dependency Resolver
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Minimal Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Create non-root system group and user
RUN addgroup -S -g 10001 appgroup && \\
    adduser -S -u 10001 -G appgroup appuser

COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --chown=appuser:appgroup package.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]`,
              expectedOutput: "Secure multi-stage Dockerfile running as non-root user with health checks"
            }
          ],
          exercises: [
            {
              title: "Write Multi-Service Docker Compose Configuration",
              description: "Create a docker-compose.yml file configuring a web app and PostgreSQL database with health checks and persistent volume",
              instructions: "Define services 'web' and 'postgres', mapping ports, env vars, and postgres_data volume.",
              starterCode: `# docker-compose.yml
services:
  web:
    # configure web
  postgres:
    # configure postgres`,
              solutionCode: `version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:secret@postgres:5432/appdb
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:`,
              testCases: "Configures web and postgres services; Sets healthcheck on postgres; Uses named volume postgres_data; Sets depends_on condition",
              hints: "Use depends_on with condition: service_healthy on postgres.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Docker Multi-Stage Build & Layer Caching",
              config: JSON.stringify({
                nodes: [
                  { id: "deps", label: "Stage 1: Dependencies\npackage.json cached (npm ci)", x: 80, y: 120 },
                  { id: "build", label: "Stage 2: Build Stage\nTypeScript Compiler & Tools", x: 280, y: 120 },
                  { id: "runner", label: "Stage 3: Runtime Image\nClean Alpine / Distroless (<50MB)", x: 480, y: 120 },
                  { id: "deploy", label: "Production Registry\nFast Push & Instant Pull", x: 680, y: 120 }
                ],
                edges: [
                  { from: "deps", to: "build", label: "node_modules" },
                  { from: "build", to: "runner", label: "compiled dist/" },
                  { from: "runner", to: "deploy", label: "docker push" }
                ],
                steps: [
                  { id: "1", activeNodes: ["deps", "build"], description: "Dependencies resolved and built in isolated intermediate container" },
                  { id: "2", activeNodes: ["build", "runner"], description: "Only compiled artifacts copied to final container, discarding build tools" },
                  { id: "3", activeNodes: ["runner", "deploy"], description: "Minimal, secure image tagged and deployed with non-root privileges" }
                ]
              })
            }
          ],
          lesson: {
            title: "Multi-Stage Docker Builds, Layer Caching & Security",
            content: `## Docker Production Optimization

### 1. The \`.dockerignore\` File
Always include a \`.dockerignore\` file to prevent copying local clutter into container build context:
\`\`\`
node_modules
.git
.env
dist
coverage
\`\`\`

### 2. Health Checks
Configuring \`HEALTHCHECK\` allows Docker and orchestrators to automatically restart unresponsive containers before downtime impacts users.`,
            explanation: "Master production multi-stage Dockerfiles, layer caching optimization, and container security."
          }
        }
      ]
    },
    {
      title: "Phase 3: Kubernetes Cluster Orchestration & Networking",
      description: "Master production Kubernetes: Pods, Deployments, ReplicaSets, Services (ClusterIP, NodePort, LoadBalancer), Ingress Controllers, HPA, and ConfigMaps.",
      slug: "phase-3-kubernetes-orchestration",
      topics: [
        {
          title: "Kubernetes Architecture, Deployments, Services & Ingress",
          description: "Learn control plane components, rolling updates, zero-downtime deployments, Horizontal Pod Autoscaling (HPA), and TLS Ingress routing.",
          slug: "kubernetes-deployments-services-ingress",
          difficulty: 4,
          prerequisites: [0, 1],
          concepts: [
            {
              title: "The Kubernetes Control Plane Architecture",
              description: "The Control Plane consists of `kube-apiserver` (REST interface), `etcd` (distributed key-value store), `kube-scheduler` (assigns pods to nodes), and `kube-controller-manager` (reconciles desired state)."
            },
            {
              title: "Deployments & Rolling Updates",
              description: "A Deployment manages ReplicaSets. Setting `maxSurge: 25%` and `maxUnavailable: 0` guarantees zero-downtime rolling updates by ensuring new pods pass readiness probes before terminating old pods."
            },
            {
              title: "Services & Ingress Controllers",
              description: "Pods have ephemeral IP addresses. A `Service` provides a stable internal DNS name (`app-svc.default.svc.cluster.local`). An `Ingress` routes external HTTP/HTTPS traffic to internal services based on hostname and path."
            }
          ],
          examples: [
            {
              title: "Production Kubernetes Deployment & Service Manifest",
              description: "Declaring a high-availability deployment with probes, resource limits, and ClusterIP service",
              starterCode: `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
# Define deployment`,
              solutionCode: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  labels:
    app: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: registry.example.com/api:v1.2.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 3000`,
              expectedOutput: "Zero-downtime Kubernetes Deployment with health probes and resource bounds"
            }
          ],
          exercises: [
            {
              title: "Write an Ingress Resource with TLS Termination",
              description: "Create an Ingress manifest that routes traffic for 'api.example.com' to 'api-service' port 80 with cert-manager TLS",
              instructions: "Define Ingress with spec.tls secretName 'api-tls' and path / to api-service:80.",
              starterCode: `apiVersion: networking.k8s.io/v1
kind: Ingress
# Write ingress manifest`,
              solutionCode: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls-cert
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80`,
              testCases: "Includes TLS config with secretName; Routes host api.example.com; Backend points to api-service port 80",
              hints: "Use ingressClassName: nginx, tls block with secretName, and rules with service name api-service.",
              difficulty: 4
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Kubernetes Traffic Routing & Pod Autoscaling",
              config: JSON.stringify({
                nodes: [
                  { id: "user", label: "External Internet\nHTTPS api.example.com", x: 80, y: 120 },
                  { id: "ing", label: "Nginx Ingress Controller\nTLS Termination & Host Routing", x: 280, y: 120 },
                  { id: "svc", label: "ClusterIP Service\nRound-Robin Load Balancer", x: 480, y: 120 },
                  { id: "pods", label: "Pod Replicas (HPA)\n3 to 10 Scaled Instances", x: 680, y: 120 }
                ],
                edges: [
                  { from: "user", to: "ing", label: "DNS query" },
                  { from: "ing", to: "svc", label: "internal proxy" },
                  { from: "svc", to: "pods", label: "iptables routing" }
                ],
                steps: [
                  { id: "1", activeNodes: ["user", "ing"], description: "External traffic reaches Ingress and TLS certificate is terminated" },
                  { id: "2", activeNodes: ["ing", "svc"], description: "Ingress forwards traffic to stable ClusterIP service endpoint" },
                  { id: "3", activeNodes: ["svc", "pods"], description: "Traffic distributed across healthy pods with automatic Horizontal Pod Autoscaling" }
                ]
              })
            }
          ],
          lesson: {
            title: "Kubernetes Architecture, Deployments, Services & Ingress",
            content: `## Kubernetes Cluster Architecture

### 1. Liveness vs Readiness Probes
- **Liveness Probe**: Checks if container is alive. If it fails, kubelet **kills and restarts** the container.
- **Readiness Probe**: Checks if container is ready to accept traffic. If it fails, the pod is **removed from Service endpoints** without being restarted.

### 2. Resource Management
Always define both \`requests\` (guaranteed minimum allocated by scheduler) and \`limits\` (maximum threshold before throttling/OOMKill).`,
            explanation: "Master the architecture, networking, and deployment patterns of production Kubernetes clusters."
          }
        }
      ]
    },
    {
      title: "Phase 4: Infrastructure as Code (IaC) with Terraform & AWS",
      description: "Provision reproducible cloud infrastructure: Terraform HCL, State locking with DynamoDB, AWS VPC networking, ALB, ECS Fargate, and RDS PostgreSQL.",
      slug: "phase-4-terraform-aws-iac",
      topics: [
        {
          title: "Terraform Infrastructure as Code & AWS Cloud Architecture",
          description: "Learn Terraform providers, remote state with S3 and DynamoDB locking, modular HCL, Multi-AZ VPC provisioning, and ECS Fargate deployments.",
          slug: "terraform-aws-vpc-ecs-rds",
          difficulty: 4,
          prerequisites: [0, 1, 2],
          concepts: [
            {
              title: "Declarative Infrastructure as Code (IaC)",
              description: "Terraform allows defining desired cloud infrastructure declaratively in HCL. Running `terraform plan` previews changes, and `terraform apply` converges actual infrastructure to match desired state."
            },
            {
              title: "Remote State & State Locking",
              description: "Terraform records infrastructure state in `terraform.tfstate`. Storing state in AWS S3 with DynamoDB locking prevents simultaneous conflicting writes in team environments."
            },
            {
              title: "AWS Multi-AZ VPC Architecture",
              description: "A production VPC spans at least two Availability Zones (AZs) with Public Subnets (NAT Gateways, ALBs) and Private Subnets (Application Containers, RDS Databases) with zero direct internet exposure."
            }
          ],
          examples: [
            {
              title: "Terraform AWS VPC & Multi-AZ Subnet Module",
              description: "Declaring a secure AWS VPC with public and private subnets across multiple AZs",
              starterCode: `# main.tf
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
# Define VPC and subnets`,
              solutionCode: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "company-tf-state-bucket"
    key            = "prod/vpc.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "prod-vpc"
    Environment = "production"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = { Name = "prod-public-us-east-1a" }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"

  tags = { Name = "prod-private-us-east-1a" }
}`,
              expectedOutput: "Terraform configuration with remote S3 backend, DynamoDB lock, and Multi-AZ VPC"
            }
          ],
          exercises: [
            {
              title: "Write an RDS PostgreSQL Terraform Resource",
              description: "Create an aws_db_instance resource for PostgreSQL 16 with multi_az enabled, allocated_storage 20, and encrypted storage",
              instructions: "Declare aws_db_instance with engine 'postgres', instance_class 'db.t4g.medium', multi_az true, and storage_encrypted true.",
              starterCode: `# rds.tf
resource "aws_db_instance" "database" {
    # define PostgreSQL DB
}`,
              solutionCode: `resource "aws_db_instance" "database" {
  identifier           = "production-postgres"
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t4g.medium"
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  storage_encrypted    = true
  multi_az             = true

  db_name  = "appdb"
  username = "dbadmin"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = false
  final_snapshot_identifier = "prod-db-final-snapshot"
}`,
              testCases: "Enables multi_az; Encrypts storage; Uses postgres engine; Sets storage bounds",
              hints: "Set multi_az = true and storage_encrypted = true.",
              difficulty: 4
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Terraform Infrastructure as Code Provisioning Flow",
              config: JSON.stringify({
                nodes: [
                  { id: "hcl", label: "Terraform HCL Code\nDeclarative Config", x: 80, y: 120 },
                  { id: "plan", label: "terraform plan\nGraph Execution Preview", x: 280, y: 120 },
                  { id: "state", label: "S3 + DynamoDB Lock\nState Synchronization", x: 480, y: 120 },
                  { id: "aws", label: "AWS Cloud Resources\nVPC, ECS, RDS Created", x: 680, y: 120 }
                ],
                edges: [
                  { from: "hcl", to: "plan", label: "compile DAG" },
                  { from: "plan", to: "state", label: "acquire lock" },
                  { from: "state", to: "aws", label: "terraform apply" }
                ],
                steps: [
                  { id: "1", activeNodes: ["hcl", "plan"], description: "Terraform compiles dependency graph and generates deterministic execution plan" },
                  { id: "2", activeNodes: ["plan", "state"], description: "DynamoDB lock acquired to prevent concurrent state corruption" },
                  { id: "3", activeNodes: ["state", "aws"], description: "Cloud APIs invoked concurrently to provision VPC, ALB, and RDS database" }
                ]
              })
            }
          ],
          lesson: {
            title: "Terraform Infrastructure as Code & AWS Cloud Architecture",
            content: `## Infrastructure as Code with Terraform

### 1. The Core Workflow
1. \`terraform init\`: Download provider plugins and configure remote backend.
2. \`terraform plan\`: Generate predictive diff without modifying real resources.
3. \`terraform apply\`: Execute changes to converge cloud state.

### 2. State Management Security
Never commit \`terraform.tfstate\` to Git! State files contain unencrypted sensitive credentials. Always use an encrypted S3 bucket with strict IAM access policies.`,
            explanation: "Master declarative infrastructure management using Terraform and production AWS cloud architecture."
          }
        }
      ]
    },
    {
      title: "Phase 5: CI/CD Automation, GitOps (ArgoCD) & Observability",
      description: "Build end-to-end continuous delivery pipelines: GitHub Actions, GitOps with ArgoCD, Prometheus metrics scraping, Grafana dashboards, and Distributed Tracing.",
      slug: "phase-5-cicd-gitops-observability",
      topics: [
        {
          title: "GitOps Continuous Delivery & Prometheus/Grafana Observability",
          description: "Learn GitHub Actions CI pipelines, ArgoCD GitOps reconciliation, Prometheus metrics collection, Grafana alerting, and OpenTelemetry tracing.",
          slug: "gitops-argocd-prometheus-grafana",
          difficulty: 4,
          prerequisites: [0, 1, 2, 3],
          concepts: [
            {
              title: "The GitOps Operating Model (ArgoCD)",
              description: "In GitOps, Git is the single source of truth for desired infrastructure. An agent running inside the cluster (ArgoCD) continuously monitors Git and pulls changes, reconciling cluster drift automatically."
            },
            {
              title: "Prometheus Metrics & PromQL",
              description: "Prometheus pulls time-series metrics from `/metrics` endpoints via HTTP scraping. PromQL allows querying counters, gauges, histograms, and computing 99th percentile request latency (`histogram_quantile(0.99, ...)`)."
            },
            {
              title: "The 4 Golden Signals of SRE Observability",
              description: "Latency (time taken to serve request), Traffic (demand/throughput), Errors (rate of failing requests), and Saturation (how full CPU/memory/queue buffers are)."
            }
          ],
          examples: [
            {
              title: "Production GitHub Actions CI/CD Pipeline Workflow",
              description: "Automated linting, testing, Docker build/push, and GitOps commit trigger",
              starterCode: `# .github/workflows/deploy.yml
name: CI/CD Pipeline
on: [push]
# Define jobs`,
              solutionCode: `name: Production CI/CD & GitOps Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: myorg/api:\${{ github.sha }},myorg/api:latest

  update-gitops:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: myorg/gitops-manifests
          token: \${{ secrets.GITOPS_PAT }}
      - name: Update Kubernetes Image Tag
        run: |
          sed -i 's|image: myorg/api:.*|image: myorg/api:\${{ github.sha }}|' deployment.yaml
          git config user.name "CI Bot"
          git config user.email "bot@myorg.com"
          git commit -am "Update image to \${{ github.sha }}"
          git push`,
              expectedOutput: "GitHub Actions workflow running tests, building Docker image, and committing to GitOps repo"
            }
          ],
          exercises: [
            {
              title: "Write a Prometheus Alerting Rule for High Error Rates",
              description: "Create a PrometheusRule manifest alerting when HTTP 5xx error rate exceeds 5% for 2 minutes",
              instructions: "Write PromQL expression checking rate of 5xx status codes divided by total request rate > 0.05.",
              starterCode: `# alert.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
# Write alerting rule`,
              solutionCode: `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-high-error-rate
  labels:
    role: alert-rules
spec:
  groups:
  - name: api.rules
    rules:
    - alert: HighHTTP5xxErrorRate
      expr: |
        sum(rate(http_requests_total{status=~"5.."}[2m])) 
        / 
        sum(rate(http_requests_total[2m])) > 0.05
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "API High 5xx Error Rate (> 5%)"
        description: "HTTP 5xx error rate is currently at {{ $value | humanizePercentage }} for service {{ $labels.service }}."`,
              testCases: "PromQL expression calculates 5xx ratio; Sets severity critical; Defines 2-minute duration threshold",
              hints: "Use sum(rate(http_requests_total{status=~'5..'}[2m])) / sum(rate(http_requests_total[2m])) > 0.05.",
              difficulty: 4
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "GitOps (ArgoCD) & Prometheus Observability Architecture",
              config: JSON.stringify({
                nodes: [
                  { id: "git", label: "GitOps Manifest Repo\ndeployment.yaml (main)", x: 80, y: 120 },
                  { id: "argo", label: "ArgoCD Controller\nContinuous Drift Sync", x: 280, y: 120 },
                  { id: "k8s", label: "Kubernetes Cluster\nLive Pods & Metrics Exporter", x: 480, y: 120 },
                  { id: "prom", label: "Prometheus & Grafana\nSRE Dashboards & PagerDuty", x: 680, y: 120 }
                ],
                edges: [
                  { from: "git", to: "argo", label: "pull state" },
                  { from: "argo", to: "k8s", label: "reconcile (kubectl apply)" },
                  { from: "k8s", to: "prom", label: "scrape /metrics" }
                ],
                steps: [
                  { id: "1", activeNodes: ["git", "argo"], description: "ArgoCD polls Git repository for updated container image tags and manifests" },
                  { id: "2", activeNodes: ["argo", "k8s"], description: "Cluster state synchronized automatically with zero direct developer cluster access" },
                  { id: "3", activeNodes: ["k8s", "prom"], description: "Prometheus scrapes Golden Signal metrics and routes alerts to Grafana & PagerDuty" }
                ]
              })
            }
          ],
          lesson: {
            title: "GitOps Continuous Delivery & Prometheus/Grafana Observability",
            content: `## Modern GitOps & Observability

### 1. The Power of GitOps
In traditional CI/CD, the CI server has direct admin credentials to the cluster (\`push\` model). In **GitOps (\`pull\` model)**:
- No external CI server has cluster write permissions.
- All configuration is audited and versioned in Git.
- Cluster drift is automatically reverted if someone attempts manual \`kubectl\` changes!

### 2. Prometheus 99th Percentile Latency
\`\`\`promql
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
\`\`\``,
            explanation: "Master the complete GitOps deployment lifecycle with ArgoCD and full-stack observability with Prometheus and Grafana."
          }
        }
      ]
    }
  ]
};
