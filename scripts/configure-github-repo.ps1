[CmdletBinding()]
param(
    # Only inspect the current state and print intended actions; never call mutating APIs.
    [switch]$DryRun,

    # After GitHub configuration, remove local tracking refs that no longer exist on origin.
    [switch]$PruneLocal
)

# Stop immediately when a command or validation fails.
$ErrorActionPreference = "Stop"

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [string]$InputText
    )

    # Pipe JSON through stdin when the command needs a request body.
    if ($null -ne $InputText) {
        $output = $InputText | & $Command @Arguments 2>&1
    }
    else {
        # Run normal commands and capture both stdout and stderr for useful errors.
        $output = & $Command @Arguments 2>&1
    }

    # Native commands report their exit code through LASTEXITCODE.
    if ($LASTEXITCODE -ne 0) {
        $details = ($output | Out-String).Trim()
        throw "Command failed: $Command $($Arguments -join ' ')`n$details"
    }

    return (($output | Out-String).Trim())
}

function Test-CommandAvailable {
    param([string]$Command)

    # Resolve the executable before attempting authentication or API calls.
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Write-Action {
    param([string]$Message)

    # Mark planned operations clearly so dry-run output cannot be mistaken for changes.
    if ($DryRun) {
        Write-Host "[dry-run] $Message" -ForegroundColor Yellow
    }
    else {
        Write-Host $Message
    }
}

try {
    # Confirm that the script is running inside a Git working tree and capture its root.
    $gitRoot = Invoke-External "git" @("rev-parse", "--show-toplevel")

    # Confirm that both required CLIs are available before querying or changing anything.
    if (-not (Test-CommandAvailable "git")) {
        throw "git was not found in PATH."
    }

    if (-not (Test-CommandAvailable "gh")) {
        throw "GitHub CLI (gh) was not found in PATH."
    }

    # Confirm that the GitHub CLI session is authenticated for the current user.
    Invoke-External "gh" @("auth", "status") | Out-Null

    # Resolve the repository from the current checkout instead of hard-coding owner/name.
    $repoJson = Invoke-External "gh" @(
        "repo", "view", "--json", "nameWithOwner,deleteBranchOnMerge"
    ) | ConvertFrom-Json

    $repo = $repoJson.nameWithOwner
    if ([string]::IsNullOrWhiteSpace($repo)) {
        throw "Could not resolve the current GitHub repository."
    }

    # Confirm that the protected deployment branch exists on origin before configuring it.
    Invoke-External "git" @("ls-remote", "--exit-code", "--heads", "origin", "staging") | Out-Null

    # Build the GitHub API endpoint for the staging branch.
    $protectionEndpoint = "repos/$repo/branches/staging/protection"

    # Read the current protection state so dry-run can show the before/after state.
    # GitHub returns HTTP 404 when the branch exists but has no protection yet;
    # that is a valid initial state, not a script failure.
    try {
        $currentProtectionJson = Invoke-External "gh" @("api", $protectionEndpoint)
        $currentProtection = $currentProtectionJson | ConvertFrom-Json
    }
    catch {
        if ($_.Exception.Message -match "Branch not protected|HTTP 404") {
            $currentProtection = $null
        }
        else {
            throw
        }
    }

    # Define the complete desired branch-protection policy.
    # Sending the full policy makes repeated runs idempotent and avoids stale settings.
    $protectionBody = [ordered]@{
        # Null means no required status checks are configured yet.
        required_status_checks = $null

        # Apply protection rules to repository administrators as well.
        enforce_admins = $true

        # Pull Requests are not required by this branch-protection policy.
        required_pull_request_reviews = $null

        # Null means no user/team restriction list is configured.
        restrictions = $null

        # Linear history is not required by this initial policy.
        required_linear_history = $false

        # Force-pushes to staging are disabled.
        allow_force_pushes = $false

        # Deleting staging is disabled.
        allow_deletions = $false

        # Creating new branches matching this rule is not restricted.
        block_creations = $false

        # Conversation resolution is not required yet.
        required_conversation_resolution = $false
    }

    Write-Host "Repository: $repo"
    Write-Host "Git root: $gitRoot"
    Write-Host "Current automatic branch deletion: $($repoJson.deleteBranchOnMerge)"
    Write-Host "Target branch: staging"
    if ($null -eq $currentProtection) {
        Write-Host "Current staging protection: not configured"
    }
    else {
        Write-Host "Current staging protection: configured"
    }
    Write-Host ""

    Write-Action "Enable automatic deletion of merged PR head branches."
    Write-Action "Keep Pull Requests optional for staging."
    Write-Action "Protect staging from deletion and force-pushes."

    if (-not $DryRun) {
        # Enable GitHub's built-in deletion of the source branch after a PR is merged.
        Invoke-External "gh" @(
            "api", "--method", "PATCH", "repos/$repo", "-F", "delete_branch_on_merge=true"
        ) | Out-Null

        # Serialize the desired policy as JSON for GitHub's branch-protection API.
        $protectionJson = $protectionBody | ConvertTo-Json -Depth 10

        # Windows PowerShell does not reliably pipe JSON to native programs through stdin.
        # Use a temporary UTF-8 file so gh receives a valid request body consistently.
        $payloadPath = Join-Path ([System.IO.Path]::GetTempPath()) (
            "paper-seal-staging-protection-$([System.Guid]::NewGuid().ToString('N')).json"
        )
        $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
        [System.IO.File]::WriteAllText($payloadPath, $protectionJson, $utf8NoBom)

        try {
            # Replace staging's protection settings with the desired idempotent policy.
            Invoke-External "gh" @(
                "api", "--method", "PUT", $protectionEndpoint, "--input", $payloadPath
            ) | Out-Null
        }
        finally {
            # Remove only the temporary JSON payload created by this invocation.
            Remove-Item -LiteralPath $payloadPath -Force -ErrorAction SilentlyContinue
        }
    }

    if ($PruneLocal) {
        if ($DryRun) {
            # Ask Git to show stale origin/* refs that would be pruned without changing them.
            Write-Host "Previewing local prune with git fetch --prune --dry-run..."
            Invoke-External "git" @("fetch", "--prune", "--dry-run")
        }
        else {
            # Remove origin/* tracking refs that GitHub has already deleted.
            Write-Host "Running git fetch --prune..."
            Invoke-External "git" @("fetch", "--prune") | Out-Null
        }
    }
    else {
        Write-Host "Local prune: not requested."
    }

    if (-not $DryRun) {
        # Read back the resulting settings so the output confirms what GitHub accepted.
        $updatedRepo = Invoke-External "gh" @(
            "repo", "view", "--json", "nameWithOwner,deleteBranchOnMerge"
        ) | ConvertFrom-Json
        $updatedProtection = Invoke-External "gh" @("api", $protectionEndpoint) | ConvertFrom-Json

        Write-Host ""
        Write-Host "Verification:"
        Write-Host "  Automatic branch deletion: $($updatedRepo.deleteBranchOnMerge)"
        Write-Host "  staging PR required: $($null -ne $updatedProtection.required_pull_request_reviews)"
        Write-Host "  staging deletion allowed: $($updatedProtection.allow_deletions)"
        Write-Host "  staging force-push allowed: $($updatedProtection.allow_force_pushes)"
    }
    else {
        Write-Host ""
        Write-Host "Dry run complete. No GitHub settings or local refs were changed." -ForegroundColor Green
    }
}
catch {
    Write-Error $_
    exit 1
}
