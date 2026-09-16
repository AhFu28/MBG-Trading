# MBG APEX - Upstream Sync PowerShell Runner
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
python "$ScriptDir\sync_upstream.py"
