# GitHub Actions CI/CD Setup Guide

This document provides comprehensive instructions for setting up the GitHub Actions CI/CD pipeline for the AI SDR system.

## 📋 Overview

The CI/CD pipeline consists of three main workflows:

1. **Main CI/CD Pipeline** (`ci-cd.yml`) - Testing, building, and deployment
2. **Security Scanning** (`security.yml`) - Comprehensive security analysis
3. **Code Quality** (`code-quality.yml`) - Code quality checks and formatting

## 🔐 Required GitHub Secrets

### Core Deployment Secrets

```bash
# Render Deployment
RENDER_API_KEY=rnd_FALUoefHcKh2BQNazgeRIMdYROZL
RENDER_SERVICE_ID=srv-d1pfnl7fte5s73cabcp0  # Your Render service ID

# Vercel Deployment
VERCEL_TOKEN=wRHMJtPUS0yOCvAY6SqJpHWC
VERCEL_ORG_ID=team_6BO8daUCrGdvsUQ6GvQzAhhJ
VERCEL_PROJECT_ID=prj_JrYekVXHKjUqosshf7u3146EEFMY

# Optional: Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

### Security Scanning Secrets

```bash
# Snyk Security Scanning (Optional)
SNYK_TOKEN=your_snyk_token_here

# CodeQL is automatically enabled for public repositories
# For private repositories, GitHub Advanced Security is required
```

## 🛠️ Setting Up GitHub Secrets

### 1. Navigate to Repository Settings
- Go to your GitHub repository
- Click on **Settings** tab
- Select **Secrets and variables** → **Actions**

### 2. Add Required Secrets

#### Render Secrets
1. **RENDER_API_KEY**: 
   - Already provided: `rnd_FALUoefHcKh2BQNazgeRIMdYROZL`
   - Add this to GitHub Secrets

2. **RENDER_SERVICE_ID**:
   - Your service ID: `srv-d1pfnl7fte5s73cabcp0`
   - Add this to GitHub Secrets

#### Vercel Secrets
1. **VERCEL_TOKEN**:
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token
   - Add to GitHub Secrets

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   - Run `npx vercel link` in your frontend directory
   - Check `.vercel/project.json` for these values
   - Add both to GitHub Secrets

#### Optional: Snyk Security Scanning
1. **SNYK_TOKEN**:
   - Sign up at [Snyk.io](https://snyk.io/)
   - Get your API token from Account Settings
   - Add to GitHub Secrets

#### Optional: Slack Notifications
1. **SLACK_WEBHOOK_URL**:
   - Create a Slack app and incoming webhook
   - Add webhook URL to GitHub Secrets

## 🚀 Workflow Features

### Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
1. **Code Quality & Linting**
   - ESLint checks for both backend and frontend
   - Prettier formatting validation
   - Runs on all pushes and PRs

2. **Security Scanning**
   - npm audit for dependency vulnerabilities
   - Snyk security scanning (if token provided)
   - Runs on all pushes and PRs

3. **Backend Tests**
   - MongoDB service container for testing
   - Health check validation
   - Test environment setup

4. **Frontend Tests**
   - React testing with coverage
   - Build verification
   - Artifact upload

5. **Backend Deployment** (main branch only)
   - Deploys to Render
   - Verifies deployment health
   - Runs after successful tests

6. **Frontend Deployment** (main branch only)
   - Deploys to Vercel
   - Runs after successful tests

7. **Notifications**
   - Slack notifications for deployment status
   - Runs after deployments complete

### Security Workflow (`security.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly scheduled scan (Mondays at 2 AM)

**Jobs:**
1. **CodeQL Analysis** - Static code analysis
2. **Dependency Scanning** - Vulnerability scanning
3. **Secret Scanning** - TruffleHog for exposed secrets
4. **License Compliance** - License compatibility checks
5. **Docker Security** - Container vulnerability scanning
6. **OWASP ZAP** - Web application security testing
7. **Security Report** - Consolidated security summary

### Code Quality Workflow (`code-quality.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
1. **ESLint Analysis** - Detailed linting with annotations
2. **Prettier Formatting** - Code formatting validation
3. **TypeScript Checking** - Type safety validation
4. **Code Coverage** - Test coverage reporting
5. **Complexity Analysis** - Code complexity metrics
6. **Bundle Size Analysis** - Frontend bundle size tracking
7. **Quality Gate** - Pass/fail decision based on results

## 📊 Monitoring and Reports

### Artifacts Generated
- ESLint reports (JSON format)
- Security scan results
- Code coverage reports
- Complexity analysis
- Bundle size analysis
- Quality gate summaries

### Integration Points
- **Codecov** - Code coverage reporting
- **GitHub Security** - Security findings integration
- **PR Comments** - Automated quality reports on PRs
- **Slack** - Deployment notifications

## 🔧 Configuration Files

### ESLint Configuration
Add to `backend/package.json` and `frontend/package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Prettier Configuration
Create `.prettierrc` in both backend and frontend:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### TypeScript Configuration
Ensure `frontend/tsconfig.json` is properly configured for type checking.

## 🚦 Quality Gates

### Blocking Conditions
The pipeline will fail if:
- ESLint errors (warnings are allowed)
- Prettier formatting issues
- TypeScript type errors
- High-severity security vulnerabilities
- Backend health check failures

### Non-Blocking Conditions
These will generate warnings but won't block deployment:
- Code coverage below threshold
- High code complexity
- Bundle size increases
- License compliance issues

## 📝 Best Practices

### Branch Protection
Configure branch protection rules:
- Require status checks to pass
- Require branches to be up to date
- Require review from code owners
- Dismiss stale reviews

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Use least privilege access
- Monitor secret usage

### Performance Optimization
- Use npm cache in workflows
- Parallel job execution where possible
- Conditional job execution
- Artifact caching

## 🔍 Troubleshooting

### Common Issues

1. **Render Deployment Fails**
   - Check RENDER_API_KEY is correct
   - Verify RENDER_SERVICE_ID matches your service
   - Ensure service is not sleeping

2. **Vercel Deployment Fails**
   - Verify VERCEL_TOKEN has correct permissions
   - Check VERCEL_ORG_ID and VERCEL_PROJECT_ID
   - Ensure build completes successfully

3. **Security Scans Fail**
   - Check SNYK_TOKEN is valid
   - Review dependency vulnerabilities
   - Update vulnerable packages

4. **Tests Fail**
   - Ensure MongoDB service is running
   - Check environment variables
   - Verify test configuration

### Debug Steps

1. Check workflow logs in GitHub Actions tab
2. Review artifact uploads for detailed reports
3. Test locally with same Node.js version
4. Verify all secrets are properly configured

## 🎯 Next Steps

1. **Set up all required GitHub Secrets**
2. **Configure branch protection rules**
3. **Test the pipeline with a small change**
4. **Monitor first deployment**
5. **Set up Slack notifications**
6. **Review security scan results**
7. **Optimize workflow performance**

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Deployment Guide](https://render.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Snyk Security Documentation](https://docs.snyk.io/)
- [CodeQL Documentation](https://codeql.github.com/docs/)

---

**Note**: This CI/CD pipeline is designed to be production-ready with comprehensive testing, security scanning, and deployment automation. Adjust the configuration based on your specific requirements and security policies. 