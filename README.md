# Legacy App Modernization — E-Commerce Application

A modernized e-commerce shopping cart application built with Node.js and Express, containerized with Docker, deployed to AWS EKS with Kubernetes, and monitored with Prometheus.

## What Gets Created

- **E-Commerce App** — A shopping cart web application with product listing, add-to-cart, and checkout functionality
- **Prometheus Metrics** — Built-in metrics endpoint (`/metrics`) tracking HTTP request counts and Node.js runtime metrics
- **Docker Image** — Containerized application pushed to your DockerHub account
- **Kubernetes Deployment** — 3 replicas deployed to EKS with readiness/liveness probes, resource limits, and a LoadBalancer service
- **ServiceMonitor** — Prometheus integration for automatic metrics scraping every 15 seconds
- **CI/CD Pipeline** — GitHub Actions workflow that builds, pushes, and deploys the application

## Prerequisites

### 1. EKS Cluster

This project deploys to the `migration-eks-cluster` provisioned by the `cloud-migration-infra` setup. Complete the [Cloud Migration Infrastructure README](https://github.com/anmutetech/cloud-migration-infra) before proceeding.

Verify your cluster is running:

```bash
kubectl get nodes
```

### 2. DockerHub Account

You need a [DockerHub](https://hub.docker.com/) account to store your container image.

1. Sign up at [hub.docker.com](https://hub.docker.com/) if you don't have an account
2. Note your DockerHub **username** and **password** — you will need these later

### 3. Node.js

Skip this step if you already have Node.js installed.

```bash
# macOS
brew install node

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify the installation:

```bash
node --version
npm --version
```

### 4. Docker

Skip this step if you already have Docker installed.

```bash
# macOS
brew install --cask docker

# Linux
curl -fsSL https://get.docker.com | sh
```

Verify the installation:

```bash
docker --version
```

## Setup Guide

### Step 1 — Fork and Clone the Repository

1. Fork this repository to your own GitHub account
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/legacy-app-modernization.git
cd legacy-app-modernization
```

### Step 2 — Run the Application Locally

Test the application before deploying:

```bash
cd app
npm install
npm start
```

Open `http://localhost:3000` in your browser. You should see the shopping cart UI with products (Laptop, Phone, Headphones, Keyboard). Try adding items to the cart and checking out.

Verify the metrics endpoint:

```bash
curl http://localhost:3000/metrics
```

You should see Prometheus-formatted metrics including `http_requests_total`. Stop the server with `Ctrl+C` when done.

### Step 3 — Build and Test the Docker Image

From the `legacy-app-modernization` root directory:

```bash
docker build -f docker/Dockerfile -t <your-dockerhub-username>/ecommerce-app:latest .
```

Run the container locally to verify:

```bash
docker run -p 3000:3000 <your-dockerhub-username>/ecommerce-app:latest
```

Open `http://localhost:3000` to confirm it works. Stop the container with `Ctrl+C`.

### Step 4 — Push the Image to DockerHub

```bash
docker login
docker push <your-dockerhub-username>/ecommerce-app:latest
```

### Step 5 — Update the Kubernetes Deployment

Edit `kubernetes/deployment.yaml` and replace the image reference with your own DockerHub username:

```yaml
image: <your-dockerhub-username>/ecommerce-app:latest
```

### Step 6 — Deploy to EKS Manually

Make sure your kubectl is configured for the EKS cluster:

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name migration-eks-cluster
```

Deploy the application:

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/servicemonitor.yaml
```

### Step 7 — Verify the Deployment

Check the pods are running:

```bash
kubectl get pods -n legacy-app-ns
```

You should see 3 pods in a `Running` state.

Check the service:

```bash
kubectl get svc -n legacy-app-ns
```

Copy the `EXTERNAL-IP` of the LoadBalancer and open it in your browser. It may take a few minutes for the DNS to become available.

### Step 8 — Verify Prometheus Monitoring

If you have Prometheus running from the `cloud-migration-infra` setup, the ServiceMonitor will automatically start scraping metrics from the application.

Confirm the ServiceMonitor is created:

```bash
kubectl get servicemonitor -n legacy-app-ns
```

You can check the metrics directly from one of the pods:

```bash
kubectl port-forward -n legacy-app-ns svc/legacy-app-service 8080:80
curl http://localhost:8080/metrics
```

## Setting Up the CI/CD Pipeline (GitHub Actions)

Once you've verified the manual deployment works, you can automate future deployments with the included GitHub Actions workflow.

### Configure GitHub Secrets

In your forked repository, go to **Settings** > **Secrets and variables** > **Actions** and add:

| Secret Name | Value |
|---|---|
| `DOCKER_USERNAME` | Your DockerHub username |
| `DOCKER_PASSWORD` | Your DockerHub password |
| `AWS_ACCESS_KEY_ID` | Your IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret access key |

### Pipeline Triggers

The pipeline runs automatically on:
- **Push** to the `main` branch
- **Pull requests** targeting `main`

It will:
1. Install Node.js dependencies
2. Build the Docker image
3. Push to DockerHub
4. Deploy to the EKS cluster using the Kubernetes manifests

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | List all products |
| `POST` | `/cart` | Add a product to cart (`{ "productId": 1 }`) |
| `GET` | `/cart` | View cart contents |
| `POST` | `/checkout` | Complete the order and clear the cart |
| `GET` | `/metrics` | Prometheus metrics |

## Cleanup

Remove the application from your EKS cluster:

```bash
kubectl delete -f kubernetes/servicemonitor.yaml
kubectl delete -f kubernetes/service.yaml
kubectl delete -f kubernetes/deployment.yaml
kubectl delete -f kubernetes/namespace.yaml
```

Optionally remove the Docker image from DockerHub via your [DockerHub repository settings](https://hub.docker.com/).

> **Note:** This only removes the application. To destroy the underlying EKS cluster, follow the cleanup steps in the [Cloud Migration Infrastructure README](https://github.com/anmutetech/cloud-migration-infra).

## Project Structure

```
legacy-app-modernization/
├── .github/workflows/
│   └── deploy-ecomm-app.yml   # CI/CD pipeline for build, push, and deploy
├── app/
│   ├── package.json           # Node.js dependencies
│   ├── server.js              # Express API server with product/cart routes
│   └── public/
│       ├── index.html         # Shopping cart UI
│       ├── app.js             # Frontend JavaScript (fetch products, cart, checkout)
│       ├── style.css          # Application styling
│       └── thankyou.html      # Order confirmation page
├── docker/
│   └── Dockerfile             # Container image definition (Node 18)
├── kubernetes/
│   ├── namespace.yaml         # legacy-app-ns namespace
│   ├── deployment.yaml        # 3-replica deployment with probes and resource limits
│   ├── service.yaml           # LoadBalancer service (port 80 → 3000)
│   └── servicemonitor.yaml    # Prometheus ServiceMonitor (scrape every 15s)
└── monitoring/
    └── metrics.js             # Prometheus metrics middleware (http_requests_total)
```
