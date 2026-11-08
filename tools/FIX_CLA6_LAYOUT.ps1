param([string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $ProjectRoot).Path
$paths = @(
    @('src/audit_dataset.py','research/src/audit_dataset.py'),
    @('src/baseline_next_term.py','research/src/baseline_next_term.py'),
    @('benchmarks/cla_llm_120_cases_DRAFT.jsonl','research/benchmarks/cla_llm_120_cases_DRAFT.jsonl'),
    @('evidence/RESEARCH_SCOPE_DAY1.md','research/protocol/RESEARCH_SCOPE_DAY1.md'),
    @('data/evidence/RESEARCH_SCOPE_DAY1.md','research/protocol/RESEARCH_SCOPE_DAY1.md'),
    @('evidence/CLAIM_EVIDENCE_DAY1.md','research/evidence/CLAIM_EVIDENCE_DAY1.md'),
    @('data/evidence/CLAIM_EVIDENCE_DAY1.md','research/evidence/CLAIM_EVIDENCE_DAY1.md'),
    @('evidence/firebase.emulator.cp21.json','firebase.emulator.cp21.json'),
    @('data/evidence/firebase.emulator.cp21.json','firebase.emulator.cp21.json'),
    @('evidence/RUN_RULES_CHECKPOINT21.ps1','RUN_RULES_CHECKPOINT21.ps1'),
    @('data/evidence/RUN_RULES_CHECKPOINT21.ps1','RUN_RULES_CHECKPOINT21.ps1')
)
Write-Host "Migrating CLA research layout at $root" -ForegroundColor Cyan
foreach($pair in $paths) {
    $old=Join-Path $root $pair[0]
    $new=Join-Path $root $pair[1]
    if (-not (Test-Path -LiteralPath $old -PathType Leaf)) { continue }
    $parent=Split-Path $new -Parent
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    if (Test-Path -LiteralPath $new -PathType Leaf) {
        $srcHash=(Get-FileHash -LiteralPath $old -Algorithm SHA256).Hash
        $dstHash=(Get-FileHash -LiteralPath $new -Algorithm SHA256).Hash
        if ($srcHash -ne $dstHash) {
            Write-Warning "SKIPPED conflicting content: $($pair[0]) and $($pair[1]). Compare manually."
            continue
        }
        Remove-Item -LiteralPath $old
        Write-Host "Removed byte-identical duplicate: $($pair[0])"
    } else {
        Move-Item -LiteralPath $old -Destination $new
        Write-Host "Moved: $($pair[0]) -> $($pair[1])"
    }
}
# Remove only empty legacy directories; never delete directories with other files.
foreach($relativeDir in @('data/evidence','evidence','data','protocol','benchmarks')) {
    $candidate=Join-Path $root $relativeDir
    if ((Test-Path -LiteralPath $candidate -PathType Container) -and
        -not (Get-ChildItem -LiteralPath $candidate -Force | Select-Object -First 1)) {
        Remove-Item -LiteralPath $candidate
        Write-Host "Removed empty directory: $relativeDir"
    }
}
Write-Host 'Migration complete. No modified non-identical file was overwritten.' -ForegroundColor Green
Write-Host 'Next: npm run check:layout; npm install; npm run test:rules:static; npm run test:rules:emulator'
