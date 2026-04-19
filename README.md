# CodeOps AI

An AI-powered GitHub PR code review platform using a multi-agent LLM pipeline, MERN stack, and AWS.

## Architecture

- **React + TailwindCSS** — dashboard with real-time WebSocket updates, analytics charts, per-review findings
- **Node.js / Express** — REST API, GitHub OAuth, Socket.io, webhook handler
- **LangChain.js agents** — Code Review, Complexity, Test Gap, and Synthesis agents run in parallel
- **MongoDB Atlas** — stores reviews, findings, user sessions, analytics
- **AWS SQS** — decouples webhook intake from processing (production pattern)
- **AWS Lambda** — serverless SQS consumer and webhook receiver
- **AWS S3** — diff storage
- **Terraform** — infrastructure as code for all AWS resources
- **GitHub Actions** — CI (lint + build) and CD (ECS + Lambda deploy)

## Quick Start (local dev)

### Prerequisites
- Node.js 20+
- MongoDB running locally (or Atlas URI)
- Google Gemini API key
- GitHub App (see setup below)

### 1. Clone and install
```bash
git clone https://github.com/your-username/codeops-ai
cd codeops-ai
npm run install:all
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your values in .env
```

### 3. Create a GitHub App
1. Go to GitHub → Settings → Developer settings → GitHub Apps → New GitHub App
2. Set **Webhook URL** to your ngrok URL + `/api/webhook` (e.g. `https://abc.ngrok.io/api/webhook`)
3. Set **Webhook secret** — copy to `GITHUB_WEBHOOK_SECRET` in `.env`
4. Permissions needed: Pull requests (Read & Write), Contents (Read)
5. Subscribe to events: Pull request
6. Generate a private key, paste into `GITHUB_PRIVATE_KEY` in `.env`
7. Copy App ID to `GITHUB_APP_ID`

### 4. Expose local server with ngrok
```bash
npx ngrok http 3001
# Copy the HTTPS URL → set as webhook URL in your GitHub App
```

### 5. Run
```bash
npm run dev
# Server: http://localhost:3001
# Client: http://localhost:3000
```

### 6. Install the GitHub App on a repo
Go to your GitHub App → Install App → select a repository.  
Open a pull request → watch the review appear in your dashboard!

## Docker
```bash
docker-compose up
```

## Deploy to AWS

### One-time setup
```bash
cd infra
terraform init
terraform apply -var-file=production.tfvars
# Outputs: webhook_url, sqs_queue_url, s3_bucket_name
```

### Set GitHub Secrets for CI/CD
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## Project Structure
```
codeops-ai/
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Express API + LangChain agents
│   └── src/
│       ├── agents/  # codeReviewAgent, complexityAgent, testGapAgent, synthesisAgent, orchestrator
│       ├── routes/  # auth, webhook, reviews, analytics, repos
│       ├── models/  # User, Repository, Review (Mongoose)
│       └── services/# github.service, sqs.service
├── lambda/          # AWS Lambda handlers (webhookReceiver, processReview)
├── infra/           # Terraform (SQS, Lambda, S3, IAM)
└── .github/         # CI + CD workflows
```

## Key Concepts

### Multi-agent pipeline
When a PR is opened, three agents run **in parallel** via `Promise.allSettled`:
1. **Code Review Agent** — bugs, security, style
2. **Complexity Agent** — cyclomatic complexity, refactor suggestions  
3. **Test Gap Agent** — missing tests, auto-generates stubs

Results are merged by the **Synthesis Agent** which formats and posts the GitHub comment.

### Event-driven processing
Webhook → SQS queue → Lambda consumer → agent orchestrator → GitHub comment  
In development (no SQS configured), processing happens inline in the webhook handler.

## License
MIT
