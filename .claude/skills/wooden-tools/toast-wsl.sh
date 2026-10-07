#!/usr/bin/env bash

set -euo pipefail

wsl=/mnt/c/Windows/System32/wsl.exe

for command in "$wsl" base64 iconv dirname; do
  command -v "$command" > /dev/null 2>&1 || {
    echo "$command not found in PATH" >&2
    exit 1
  }
done

powershell=$(command -v powershell.exe) || {
    powershell=$("$wsl" which powershell.exe) || {
        echo "powershell.exe not found via $wsl" >&2
        exit 1
    }
}

(($# == 2)) || {
    echo "Usage: $0 <title> <message>" >&2
    exit 1
}
export title=$1
export message=$2


xa() {
    "$(dirname -- "$0")"/../../xarpite/xarpite -A 5 -e "$@"
}
power_shell() {
    "$powershell" -NoProfile -EncodedCommand "$(iconv -f UTF-8 -t UTF-16LE | base64 -w0)"
}

icon_file="./claude.png"


export icon_url=$(
    {
        ICON_B64="$(base64 -w0 "$icon_file")" WSLENV=ICON_B64 power_shell <<'EOF'
            $ProgressPreference = 'SilentlyContinue'
            $iconPath = Join-Path $env:TEMP 'claude-fairy-toast-icon.png'
            [IO.File]::WriteAllBytes($iconPath, [Convert]::FromBase64String($env:ICON_B64))
            Write-Output $iconPath
EOF
    } | xa 'I | %>file:///<%= _::replace("\\"; "/") %><%'
)

xml=$(xa '
    xmlEscape := string -> string
        ::replace("&"; "&amp;")
        ::replace("<"; "&lt;")
        ::replace(">"; "&gt;")
    %>
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text><%= ENV.title >> xmlEscape %></text>
                    <text><%= ENV.message >> xmlEscape %></text>
                    <image src="<%= ENV.icon_url >> xmlEscape %>" placement="appLogoOverride" />
                </binding>
            </visual>
        </toast>
    <%
')

TOAST_XML="$xml" WSLENV=TOAST_XML power_shell <<'EOF'
    $ProgressPreference = 'SilentlyContinue'
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($env:TOAST_XML)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe').Show($toast)
EOF

echo OK
