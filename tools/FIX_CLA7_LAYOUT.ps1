# CLΑ CP22/23 layout migration. Non-identical conflicts are archived, never discarded.
[CmdletBinding(SupportsShouldProcess=$true)]
param([string]$ProjectRoot = (Join-Path $PSScriptRoot '..'))
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $ProjectRoot).Path
$mapping = @(
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
    @('data/evidence/RUN_RULES_CHECKPOINT21.ps1','RUN_RULES_CHECKPOINT21.ps1'),
    @('CP22_APPLY_AND_TEST.md','docs/CP22_APPLY_AND_TEST.md'),
    @('CP22_PROGRESS_20261105.md','docs/CP22_PROGRESS_20261105.md'),
    @('COGNITIVE LEARN AI.docx','docs/specifications/COGNITIVE LEARN AI.docx'),
    @('COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC.docx','docs/specifications/COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC.docx'),
    @('COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx','docs/specifications/COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx'),
    @('lộ trình (1) (1).docx','docs/specifications/lộ trình (1) (1).docx'),
    @('firestore.rules.CANDIDATE','docs/archive/firestore.rules.CANDIDATE'),
    @('firebase.emulator.checkpoint.json','docs/archive/firebase.emulator.checkpoint.json'),
    @('docs/CLA6_STRUCTURE_AUDIT.json','docs/archive/CLA6_STRUCTURE_AUDIT.json')
)
Write-Host "CLA7 layout migration: $root" -ForegroundColor Cyan
$counts = @{Moved=0; Deduplicated=0; Archived=0; Skipped=0}
foreach ($entry in $mapping) {
    $relativeOld = $entry[0]; $relativeNew = $entry[1]
    $old = Join-Path $root $relativeOld
    $new = Join-Path $root $relativeNew
    if (-not (Test-Path -LiteralPath $old -PathType Leaf)) { continue }
    $dest = $new; $mode = 'move'
    if (Test-Path -LiteralPath $new -PathType Leaf) {
        $same = (Get-FileHash -LiteralPath $old -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $new -Algorithm SHA256).Hash
        if ($same) { $mode = 'duplicate' }
        else {
            # Keep both versions in distinct paths; do not overwrite canonical data.
            $dest = Join-Path $root (Join-Path 'docs/archive/legacy-layout' $relativeOld)
            $mode = 'archive'
            if (Test-Path -LiteralPath $dest) {
                if ((Get-FileHash $old).Hash -eq (Get-FileHash $dest).Hash) { $mode='duplicateArchive' }
                else { Write-Warning "Archive collision, manual review required: $relativeOld"; $counts.Skipped++; continue }
            }
        }
    }
    if ($PSCmdlet.ShouldProcess($old,"$mode -> $dest")) {
        if ($mode -eq 'duplicate' -or $mode -eq 'duplicateArchive') { Remove-Item -LiteralPath $old; $counts.Deduplicated++ }
        else {
            New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
            Move-Item -LiteralPath $old -Destination $dest
            if ($mode -eq 'archive') { $counts.Archived++ } else { $counts.Moved++ }
        }
        Write-Host "$mode : $relativeOld"
    }
}
foreach ($relative in @('data/evidence','data','evidence','benchmarks')) {
    $dir=Join-Path $root $relative
    if ((Test-Path -LiteralPath $dir -PathType Container) -and -not (Get-ChildItem -LiteralPath $dir -Force | Select-Object -First 1)) {
        if ($PSCmdlet.ShouldProcess($dir,'remove empty legacy directory')) { Remove-Item -LiteralPath $dir }
    }
}
Write-Host "Moved=$($counts.Moved), duplicates=$($counts.Deduplicated), archived conflicts=$($counts.Archived), manual review=$($counts.Skipped)" -ForegroundColor Green
if (-not $WhatIfPreference) { & node (Join-Path $root 'tools/check-cla-layout.cjs'); if($LASTEXITCODE -ne 0){throw 'Layout check failed; examine the remaining misplacement before continuing.'} }
